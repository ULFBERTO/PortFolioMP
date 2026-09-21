package handlers

import (
	"encoding/json"
	"net/http"
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

// setSessionCookie writes the session token as an HttpOnly cookie
// (Secure + SameSite=None in production for cross-site; COOKIE_SECURE=false
// only for local http development).
func (h *Handler) setSessionCookie(w http.ResponseWriter, sessionToken string) {
	sameSite := http.SameSiteNoneMode
	if !h.cfg.CookieSecure {
		sameSite = http.SameSiteLaxMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    sessionToken,
		Path:     "/",
		MaxAge:   h.cfg.SessionTokenTTL,
		HttpOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: sameSite,
	})
}

// clearSessionCookie removes the session cookie
func (h *Handler) clearSessionCookie(w http.ResponseWriter) {
	sameSite := http.SameSiteNoneMode
	if !h.cfg.CookieSecure {
		sameSite = http.SameSiteLaxMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: sameSite,
	})
}

// RefreshSession validates the current user session cookie and issues a new one.
// POST /api/auth/refresh
func (h *Handler) RefreshSession(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"error":         "No hay sesión activa",
		})
		return
	}

	sessionID, uid, _, err := auth.ValidateUserSessionToken(cookie.Value, h.cfg.JWTSecret)
	if err != nil || uid == "" {
		h.clearSessionCookie(w)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"error":         "Sesión expirada o inválida",
		})
		return
	}

	accessToken, err := h.redis.GetAccessToken(r.Context(), sessionID)
	if err != nil || accessToken == "" {
		h.clearSessionCookie(w)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"error":         "Sesión revocada o expirada en el servidor",
		})
		return
	}
	if _, _, valid := auth.ValidateUserAccessToken(accessToken, h.cfg.JWTSecret); !valid {
		h.clearSessionCookie(w)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"error":         "Sesión revocada o expirada en el servidor",
		})
		return
	}

	h.redis.RefreshAccessToken(r.Context(), sessionID)

	// Releer el usuario (el rol pudo cambiar) y reemitir sesión
	u, err := h.db.GetUserByID(r.Context(), uid)
	if err != nil {
		h.clearSessionCookie(w)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"authenticated": false,
			"error":         "Usuario no existe",
		})
		return
	}

	newSessionToken, expiresIn, err := auth.GenerateUserSessionToken(h.cfg.JWTSecret, sessionID, u.ID, u.Role, h.cfg.SessionTokenTTL)
	if err != nil {
		http.Error(w, `{"error":"Error al renovar sesión"}`, http.StatusInternalServerError)
		return
	}

	h.setSessionCookie(w, newSessionToken)

	json.NewEncoder(w).Encode(models.AuthResponse{
		Authenticated: true,
		User:          u.Public(),
		ExpiresIn:     expiresIn,
	})
}

// UpdatePortfolio updates the legacy single-row portfolio (admin only).
// Kept for backward compatibility; new CVs use /api/cvs.
func (h *Handler) UpdatePortfolio(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	ip := middleware.GetClientIP(r)

	if _, ok := h.requireAdmin(r); !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "No autorizado. Se requiere sesión de administrador.",
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
