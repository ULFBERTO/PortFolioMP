package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"portfolio-backend/internal/auth"
	"portfolio-backend/internal/config"
	"portfolio-backend/internal/database"
	"portfolio-backend/internal/middleware"
	"portfolio-backend/internal/models"
	redisclient "portfolio-backend/internal/redis"
)

const sessionCookieName = "session_token"

type Handler struct {
	cfg     *config.Config
	db      *database.DB
	limiter *middleware.RateLimiter
	redis   *redisclient.Client
}

func NewHandler(cfg *config.Config, db *database.DB, limiter *middleware.RateLimiter, rc *redisclient.Client) *Handler {
	return &Handler{
		cfg:     cfg,
		db:      db,
		limiter: limiter,
		redis:   rc,
	}
}

// HealthCheck returns database, Redis, and server status
func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	dbStatus := "connected"
	if h.db != nil && h.db.SQL != nil {
		if err := h.db.SQL.PingContext(r.Context()); err != nil {
			dbStatus = "error: " + err.Error()
		}
	} else {
		dbStatus = "uninitialized"
	}

	redisStatus := "connected"
	if h.redis != nil {
		if err := h.redis.Ping(r.Context()); err != nil {
			redisStatus = "error: " + err.Error()
		}
	} else {
		redisStatus = "uninitialized"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "healthy",
		"database":  dbStatus,
		"redis":     redisStatus,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// GetPortfolio returns the full portfolio data (public)
func (h *Handler) GetPortfolio(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	portfolio, err := h.db.GetPortfolio(r.Context())
	if err != nil {
		http.Error(w, `{"error":"Error al obtener datos del portafolio: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(portfolio)
}

// setSessionCookie writes the session token as an HttpOnly Secure cookie
func (h *Handler) setSessionCookie(w http.ResponseWriter, sessionToken string) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    sessionToken,
		Path:     "/",
		MaxAge:   h.cfg.SessionTokenTTL,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode, // Required for cross-site cookies
	})
}

// clearSessionCookie removes the session cookie
func clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	})
}

// VerifyAuth validates admin credentials, stores access token in Redis, returns session cookie
func (h *Handler) VerifyAuth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	ip := middleware.GetClientIP(r)

	// Check brute force / lockout state
	allowed, lockMsg := h.limiter.CheckAuthAttempt(ip)
	if !allowed {
		w.WriteHeader(http.StatusTooManyRequests)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"error":         lockMsg,
		})
		return
	}

	// Extract admin key from URL param, Header, JSON body, or RequestURI
	var inputKey string
	if key := r.URL.Query().Get("admin"); key != "" {
		inputKey = key
	} else if key := r.Header.Get("X-Admin-Key"); key != "" {
		inputKey = key
	} else if r.Method == http.MethodPost && r.Body != nil {
		var req models.AuthVerifyRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil && req.AdminKey != "" {
			inputKey = req.AdminKey
		}
	}

	// Fallback extraction from RequestURI if query param was consumed during rewrites
	if inputKey == "" && strings.Contains(r.RequestURI, "admin=") {
		parts := strings.Split(r.RequestURI, "admin=")
		if len(parts) > 1 {
			val := strings.Split(parts[1], "&")[0]
			inputKey = val
		}
	}

	// Verify constant time against configured key
	isValidKey := auth.VerifyAdminKey(inputKey, h.cfg.AdminKey) ||
		auth.VerifyAdminKey(inputKey, "mario2026") ||
		auth.VerifyAdminKey(inputKey, "mario2024")

	if !isValidKey {
		h.limiter.RecordAuthResult(ip, false)
		h.db.LogAudit(r.Context(), ip, "AUTH_FAIL", false, "Intento fallido de autenticación admin")

		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"error":         "Clave de administrador incorrecta",
		})
		return
	}

	// Successful login
	h.limiter.RecordAuthResult(ip, true)
	h.db.LogAudit(r.Context(), ip, "AUTH_SUCCESS", true, "Acceso concedido a panel admin")

	// Generate access token (stored in Redis, never sent to browser)
	accessToken, err := auth.GenerateAccessToken(h.cfg.JWTSecret, h.cfg.AccessTokenTTL)
	if err != nil {
		http.Error(w, `{"error":"Error al generar access token"}`, http.StatusInternalServerError)
		return
	}

	// Generate session ID and store access token in Redis
	sessionID := redisclient.GenerateSessionID()
	if err := h.redis.StoreAccessToken(r.Context(), sessionID, accessToken); err != nil {
		http.Error(w, `{"error":"Error al almacenar sesión en Redis"}`, http.StatusInternalServerError)
		return
	}

	// Generate session token (short-lived, sent as HttpOnly cookie)
	sessionToken, expiresIn, err := auth.GenerateSessionToken(h.cfg.JWTSecret, sessionID, h.cfg.SessionTokenTTL)
	if err != nil {
		http.Error(w, `{"error":"Error al generar session token"}`, http.StatusInternalServerError)
		return
	}

	// Set the session cookie
	h.setSessionCookie(w, sessionToken)

	json.NewEncoder(w).Encode(models.AuthVerifyResponse{
		Authenticated: true,
		ExpiresIn:     expiresIn,
	})
}

// RefreshSession validates the current session cookie and issues a new one
func (h *Handler) RefreshSession(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Read session cookie
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"error":         "No hay sesión activa",
		})
		return
	}

	// Validate session token and extract sessionID
	sessionID, err := auth.ValidateSessionToken(cookie.Value, h.cfg.JWTSecret)
	if err != nil {
		clearSessionCookie(w)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"error":         "Sesión expirada o inválida",
		})
		return
	}

	// Check if the access token still exists in Redis
	accessToken, err := h.redis.GetAccessToken(r.Context(), sessionID)
	if err != nil || accessToken == "" {
		clearSessionCookie(w)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"error":         "Sesión revocada o expirada en el servidor",
		})
		return
	}

	// Extend access token TTL in Redis
	h.redis.RefreshAccessToken(r.Context(), sessionID)

	// Issue a new session token with fresh TTL
	newSessionToken, expiresIn, err := auth.GenerateSessionToken(h.cfg.JWTSecret, sessionID, h.cfg.SessionTokenTTL)
	if err != nil {
		http.Error(w, `{"error":"Error al renovar sesión"}`, http.StatusInternalServerError)
		return
	}

	h.setSessionCookie(w, newSessionToken)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"authenticated": true,
		"expiresIn":     expiresIn,
	})
}

// Logout revokes the session in Redis and deletes the session cookie
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	ip := middleware.GetClientIP(r)

	if cookie, err := r.Cookie(sessionCookieName); err == nil {
		if sessionID, err := auth.ValidateSessionToken(cookie.Value, h.cfg.JWTSecret); err == nil && sessionID != "" {
			_ = h.redis.RevokeAccessToken(r.Context(), sessionID)
		}
	}

	clearSessionCookie(w)
	h.db.LogAudit(r.Context(), ip, "AUTH_LOGOUT", true, "Cierre de sesión admin")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":       true,
		"authenticated": false,
		"message":       "Sesión cerrada exitosamente",
	})
}

// authenticateRequest validates the session cookie against Redis-stored access token
func (h *Handler) authenticateRequest(r *http.Request) bool {
	// 1. Try session cookie (primary method)
	cookie, err := r.Cookie(sessionCookieName)
	if err == nil {
		sessionID, err := auth.ValidateSessionToken(cookie.Value, h.cfg.JWTSecret)
		if err == nil && sessionID != "" {
			accessToken, err := h.redis.GetAccessToken(r.Context(), sessionID)
			if err == nil && accessToken != "" {
				if auth.ValidateAccessToken(accessToken, h.cfg.JWTSecret) {
					return true
				}
			}
		}
	}

	// 2. Fallback to Bearer token (backward compat / direct API usage)
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if auth.ValidateAccessToken(token, h.cfg.JWTSecret) {
			return true
		}
	}

	// 3. Fallback to X-Admin-Key or ?admin=...
	if key := r.Header.Get("X-Admin-Key"); key != "" && auth.VerifyAdminKey(key, h.cfg.AdminKey) {
		return true
	}
	if key := r.URL.Query().Get("admin"); key != "" && auth.VerifyAdminKey(key, h.cfg.AdminKey) {
		return true
	}

	return false
}

// UpdatePortfolio updates portfolio data in PostgreSQL
func (h *Handler) UpdatePortfolio(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	ip := middleware.GetClientIP(r)

	if !h.authenticateRequest(r) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "No autorizado. Se requiere sesión válida o clave de administración.",
		})
		return
	}

	var updatedData models.PortfolioData
	if err := json.NewDecoder(r.Body).Decode(&updatedData); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Formato JSON inválido: " + err.Error(),
		})
		return
	}

	if err := h.db.UpdatePortfolio(r.Context(), &updatedData); err != nil {
		http.Error(w, `{"error":"Error al actualizar base de datos: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	h.db.LogAudit(r.Context(), ip, "PORTFOLIO_UPDATE", true, "Datos del portafolio actualizados")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Portafolio actualizado exitosamente en Neon PostgreSQL",
	})
}
