package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"portfolio-backend/internal/auth"
	"portfolio-backend/internal/middleware"
	"portfolio-backend/internal/models"
	redisclient "portfolio-backend/internal/redis"
)

var emailPattern = regexp.MustCompile(`^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$`)

func validEmail(e string) bool {
	e = strings.TrimSpace(e)
	return len(e) >= 5 && len(e) <= 254 && emailPattern.MatchString(e)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeAuthError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]interface{}{"authenticated": false, "error": msg})
}

// issueUserSession creates Redis access + cookie session for a user.
func (h *Handler) issueUserSession(w http.ResponseWriter, r *http.Request, user *models.User) (models.AuthResponse, error) {
	accessToken, err := auth.GenerateUserAccessToken(h.cfg.JWTSecret, user.ID, user.Role, h.cfg.AccessTokenTTL)
	if err != nil {
		return models.AuthResponse{}, err
	}
	sessionID := redisclient.GenerateSessionID()
	if err := h.redis.StoreAccessToken(r.Context(), sessionID, accessToken); err != nil {
		return models.AuthResponse{}, err
	}
	sessionToken, expiresIn, err := auth.GenerateUserSessionToken(h.cfg.JWTSecret, sessionID, user.ID, user.Role, h.cfg.SessionTokenTTL)
	if err != nil {
		return models.AuthResponse{}, err
	}
	h.setSessionCookie(w, sessionToken)
	return models.AuthResponse{Authenticated: true, User: user, ExpiresIn: expiresIn}, nil
}

// currentUser validates the session cookie and returns userID + role.
func (h *Handler) currentUser(r *http.Request) (userID, role string, ok bool) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		return "", "", false
	}
	sessionID, uid, _, err := auth.ValidateUserSessionToken(cookie.Value, h.cfg.JWTSecret)
	if err != nil || sessionID == "" || uid == "" {
		return "", "", false
	}
	accessToken, err := h.redis.GetAccessToken(r.Context(), sessionID)
	if err != nil || accessToken == "" {
		return "", "", false
	}
	auid, arole, valid := auth.ValidateUserAccessToken(accessToken, h.cfg.JWTSecret)
	if !valid || auid != uid {
		return "", "", false
	}
	return uid, arole, true
}

func (h *Handler) requireAdmin(r *http.Request) (userID string, ok bool) {
	uid, role, valid := h.currentUser(r)
	if !valid || role != models.RoleAdmin {
		return "", false
	}
	return uid, true
}

// Register creates a new user account (email + password).
// POST /api/auth/register
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	ip := middleware.GetClientIP(r)
	allowed, lockMsg := h.limiter.CheckAuthAttempt(ip)
	if !allowed {
		writeAuthError(w, http.StatusTooManyRequests, lockMsg)
		return
	}

	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeAuthError(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	req.Email = strings.TrimSpace(req.Email)
	if !validEmail(req.Email) {
		writeAuthError(w, http.StatusBadRequest, "Email inválido")
		return
	}
	if len(req.Password) < 8 {
		writeAuthError(w, http.StatusBadRequest, "La contraseña debe tener mínimo 8 caracteres")
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeAuthError(w, http.StatusInternalServerError, "Error interno")
		return
	}
	user, err := h.db.CreateUser(r.Context(), req.Email, hash, models.RoleUser)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			h.limiter.RecordAuthResult(ip, false)
			writeAuthError(w, http.StatusConflict, "Ese email ya está registrado")
			return
		}
		writeAuthError(w, http.StatusInternalServerError, "No se pudo crear la cuenta")
		return
	}

	h.limiter.RecordAuthResult(ip, true)
	h.db.LogAudit(r.Context(), ip, "USER_REGISTER", true, "Registro: "+user.Email)

	resp, err := h.issueUserSession(w, r, user)
	if err != nil {
		writeAuthError(w, http.StatusInternalServerError, "No se pudo iniciar sesión")
		return
	}
	writeJSON(w, http.StatusCreated, resp)
}

// Login validates credentials and issues a session.
// POST /api/auth/login
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	ip := middleware.GetClientIP(r)
	allowed, lockMsg := h.limiter.CheckAuthAttempt(ip)
	if !allowed {
		writeAuthError(w, http.StatusTooManyRequests, lockMsg)
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeAuthError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	u, err := h.db.GetUserByEmail(r.Context(), req.Email)
	if err != nil || !auth.CheckPassword(u.PasswordHash, req.Password) {
		h.limiter.RecordAuthResult(ip, false)
		h.db.LogAudit(r.Context(), ip, "AUTH_FAIL", false, "Login fallido: "+strings.TrimSpace(req.Email))
		writeAuthError(w, http.StatusUnauthorized, "Email o contraseña incorrectos")
		return
	}

	h.limiter.RecordAuthResult(ip, true)
	h.db.LogAudit(r.Context(), ip, "AUTH_SUCCESS", true, "Login: "+u.Email)

	resp, err := h.issueUserSession(w, r, u.Public())
	if err != nil {
		writeAuthError(w, http.StatusInternalServerError, "No se pudo iniciar sesión")
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

// Me returns the current session user.
// GET /api/auth/me
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	uid, _, ok := h.currentUser(r)
	if !ok {
		writeAuthError(w, http.StatusUnauthorized, "Sin sesión")
		return
	}
	u, err := h.db.GetUserByID(r.Context(), uid)
	if err != nil {
		writeAuthError(w, http.StatusUnauthorized, "Usuario no existe")
		return
	}
	writeJSON(w, http.StatusOK, models.AuthResponse{Authenticated: true, User: u.Public()})
}

// LogoutUser revokes the user session.
// POST /api/auth/logout
func (h *Handler) LogoutUser(w http.ResponseWriter, r *http.Request) {
	ip := middleware.GetClientIP(r)
	if cookie, err := r.Cookie(sessionCookieName); err == nil {
		if sessionID, _, _, err := auth.ValidateUserSessionToken(cookie.Value, h.cfg.JWTSecret); err == nil && sessionID != "" {
			_ = h.redis.RevokeAccessToken(r.Context(), sessionID)
		}
	}
	h.clearSessionCookie(w)
	h.db.LogAudit(r.Context(), ip, "AUTH_LOGOUT", true, "Cierre de sesión")
	writeJSON(w, http.StatusOK, map[string]interface{}{"success": true, "authenticated": false})
}

// ---------------- CV endpoints ----------------

// CreateCV creates a CV for the logged user.
// POST /api/cvs
func (h *Handler) CreateCV(w http.ResponseWriter, r *http.Request) {
	uid, _, ok := h.currentUser(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{"error": "Se requiere sesión"})
		return
	}
	var req models.CreateCVRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "JSON inválido"})
		return
	}
	if strings.TrimSpace(req.Title) == "" {
		req.Title = "Mi hoja de vida"
	}
	cv, err := h.db.CreateCV(r.Context(), uid, &req)
	if err != nil {
		msg := err.Error()
		status := http.StatusBadRequest
		if strings.Contains(strings.ToLower(msg), "duplicate") || strings.Contains(strings.ToLower(msg), "unique") {
			msg = "Ese slug ya está en uso"
			status = http.StatusConflict
		}
		writeJSON(w, status, map[string]interface{}{"error": msg})
		return
	}
	writeJSON(w, http.StatusCreated, cv)
}

// ListMyCVs returns the logged user's CVs.
// GET /api/cvs/mine
func (h *Handler) ListMyCVs(w http.ResponseWriter, r *http.Request) {
	uid, _, ok := h.currentUser(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{"error": "Se requiere sesión"})
		return
	}
	cvs, err := h.db.ListCVsByOwner(r.Context(), uid)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"error": "Error listando CVs"})
		return
	}
	if cvs == nil {
		cvs = []models.CV{}
	}
	writeJSON(w, http.StatusOK, cvs)
}

// GetCV returns one CV if the requester is owner or admin.
// GET /api/cvs/:id
func (h *Handler) GetCV(w http.ResponseWriter, r *http.Request, id string) {
	uid, role, ok := h.currentUser(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{"error": "Se requiere sesión"})
		return
	}
	cv, err := h.db.GetCVByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{"error": "CV no encontrado"})
		return
	}
	if cv.OwnerID != uid && role != models.RoleAdmin {
		writeJSON(w, http.StatusForbidden, map[string]interface{}{"error": "Sin permiso"})
		return
	}
	writeJSON(w, http.StatusOK, cv)
}

// UpdateCV edits a CV (owner or admin).
// PUT /api/cvs/:id
func (h *Handler) UpdateCV(w http.ResponseWriter, r *http.Request, id string) {
	uid, role, ok := h.currentUser(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{"error": "Se requiere sesión"})
		return
	}
	var req models.UpdateCVRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "JSON inválido"})
		return
	}
	ownerScope := uid
	if role == models.RoleAdmin {
		ownerScope = "" // admin puede editar cualquier CV
	}
	cv, err := h.db.UpdateCV(r.Context(), id, ownerScope, &req)
	if err != nil {
		msg := err.Error()
		status := http.StatusBadRequest
		switch {
		case msg == "forbidden":
			msg = "Sin permiso"
			status = http.StatusForbidden
		case strings.Contains(strings.ToLower(msg), "duplicate") || strings.Contains(strings.ToLower(msg), "unique"):
			msg = "Ese slug ya está en uso"
			status = http.StatusConflict
		case err == sql.ErrNoRows:
			msg = "CV no encontrado"
			status = http.StatusNotFound
		}
		writeJSON(w, status, map[string]interface{}{"error": msg})
		return
	}
	writeJSON(w, http.StatusOK, cv)
}

// DuplicateCV copies a CV (owner or admin) with a unique "-copia" slug.
// POST /api/cvs/:id/duplicate
func (h *Handler) DuplicateCV(w http.ResponseWriter, r *http.Request, id string) {
	uid, role, ok := h.currentUser(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{"error": "Se requiere sesión"})
		return
	}
	src, err := h.db.GetCVByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{"error": "CV no encontrado"})
		return
	}
	if src.OwnerID != uid && role != models.RoleAdmin {
		writeJSON(w, http.StatusForbidden, map[string]interface{}{"error": "Sin permiso"})
		return
	}
	// Slug único derivado del original: slug-copia, slug-copia-2, ...
	slug := src.Slug + "-copia"
	for i := 2; ; i++ {
		var count int
		_ = h.db.SQL.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM cvs WHERE lower(slug) = lower($1)`, slug).Scan(&count)
		if count == 0 {
			break
		}
		slug = src.Slug + "-copia-" + strconv.Itoa(i)
	}
	copy, err := h.db.CreateCV(r.Context(), src.OwnerID, &models.CreateCVRequest{
		Slug:       slug,
		Title:      src.Title + " (copia)",
		Profession: src.Profession,
		Template:   src.Template,
		Visibility: models.VisibilityPrivate, // la copia nace privada por seguridad
		Data:       src.Data,
	})
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, copy)
}

// DeleteCV removes a CV (owner or admin).
// DELETE /api/cvs/:id
func (h *Handler) DeleteCV(w http.ResponseWriter, r *http.Request, id string) {
	uid, role, ok := h.currentUser(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{"error": "Se requiere sesión"})
		return
	}
	ownerScope := uid
	if role == models.RoleAdmin {
		ownerScope = ""
	}
	if err := h.db.DeleteCV(r.Context(), id, ownerScope); err != nil {
		if err == sql.ErrNoRows {
			writeJSON(w, http.StatusNotFound, map[string]interface{}{"error": "CV no encontrado o sin permiso"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"error": "No se pudo eliminar"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

// GetPublicCV serves a CV by slug at its exact URL.
// GET /api/cv/:slug — public CVs open; private only for owner/admin.
func (h *Handler) GetPublicCV(w http.ResponseWriter, r *http.Request, slug string) {
	cv, err := h.db.GetCVBySlug(r.Context(), slug)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{"error": "Hoja de vida no encontrada"})
		return
	}
	if cv.Visibility == models.VisibilityPublic {
		writeJSON(w, http.StatusOK, cv)
		return
	}
	uid, role, ok := h.currentUser(r)
	if !ok || (cv.OwnerID != uid && role != models.RoleAdmin) {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{"error": "Hoja de vida no encontrada"})
		return
	}
	writeJSON(w, http.StatusOK, cv)
}

// ---------------- Admin endpoints ----------------

func (h *Handler) requireAdminJSON(w http.ResponseWriter, r *http.Request) (string, bool) {
	uid, ok := h.requireAdmin(r)
	if !ok {
		writeJSON(w, http.StatusForbidden, map[string]interface{}{"error": "Solo administradores"})
		return "", false
	}
	return uid, true
}

// ListUsers lists all accounts (admin).
// GET /api/admin/users
func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	if _, ok := h.requireAdminJSON(w, r); !ok {
		return
	}
	users, err := h.db.ListUsers(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"error": "Error listando usuarios"})
		return
	}
	if users == nil {
		users = []models.User{}
	}
	writeJSON(w, http.StatusOK, users)
}

// SetUserRole changes a user's role (admin, cannot demote self).
// PATCH /api/admin/users/:id/role
func (h *Handler) SetUserRole(w http.ResponseWriter, r *http.Request, id string) {
	adminID, ok := h.requireAdminJSON(w, r)
	if !ok {
		return
	}
	if id == adminID {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "No puedes cambiar tu propio rol"})
		return
	}
	var req models.UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || !models.ValidRole(req.Role) {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Rol inválido (admin|user)"})
		return
	}
	u, err := h.db.SetUserRole(r.Context(), id, req.Role)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{"error": "Usuario no encontrado"})
		return
	}
	writeJSON(w, http.StatusOK, u)
}

// DeleteUser removes an account (admin, cannot delete self).
// DELETE /api/admin/users/:id
func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request, id string) {
	adminID, ok := h.requireAdminJSON(w, r)
	if !ok {
		return
	}
	if id == adminID {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "No puedes eliminar tu propia cuenta"})
		return
	}
	if err := h.db.DeleteUser(r.Context(), id); err != nil {
		if err == sql.ErrNoRows {
			writeJSON(w, http.StatusNotFound, map[string]interface{}{"error": "Usuario no encontrado"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"error": "No se pudo eliminar"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

// ListAllCVs lists every CV (admin).
// GET /api/admin/cvs
func (h *Handler) ListAllCVs(w http.ResponseWriter, r *http.Request) {
	if _, ok := h.requireAdminJSON(w, r); !ok {
		return
	}
	cvs, err := h.db.ListAllCVs(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"error": "Error listando CVs"})
		return
	}
	if cvs == nil {
		cvs = []models.CV{}
	}
	writeJSON(w, http.StatusOK, cvs)
}
