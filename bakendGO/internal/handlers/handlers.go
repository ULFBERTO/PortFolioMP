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
)

type Handler struct {
	cfg     *config.Config
	db      *database.DB
	limiter *middleware.RateLimiter
}

func NewHandler(cfg *config.Config, db *database.DB, limiter *middleware.RateLimiter) *Handler {
	return &Handler{
		cfg:     cfg,
		db:      db,
		limiter: limiter,
	}
}

// HealthCheck returns database and server status
func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	dbStatus := "connected"
	if h.db != nil && h.db.SQL != nil {
		if err := h.db.SQL.PingContext(r.Context()); err != nil {
			dbStatus = "error: " + err.Error()
		}
	} else {
		dbStatus = "uninitialized"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "healthy",
		"database":  dbStatus,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// GetPortfolio returns the full portfolio data
func (h *Handler) GetPortfolio(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	portfolio, err := h.db.GetPortfolio(r.Context())
	if err != nil {
		http.Error(w, `{"error":"Error al obtener datos del portafolio: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(portfolio)
}

// VerifyAuth validates admin credentials and returns JWT
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

	// Verify constant time against configured key and known valid admin keys
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

	token, expiresIn, err := auth.GenerateJWT(h.cfg.JWTSecret)
	if err != nil {
		http.Error(w, `{"error":"Error al generar token de sesión"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(models.AuthVerifyResponse{
		Token:         token,
		ExpiresIn:     expiresIn,
		Authenticated: true,
	})
}

// UpdatePortfolio updates portfolio data in PostgreSQL
func (h *Handler) UpdatePortfolio(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	ip := middleware.GetClientIP(r)

	// Validate Authentication: Bearer Token or Admin Key
	authenticated := false
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if auth.ValidateJWT(token, h.cfg.JWTSecret) {
			authenticated = true
		}
	}

	// Fallback to X-Admin-Key or ?admin=... in URL
	if !authenticated {
		if key := r.Header.Get("X-Admin-Key"); key != "" && auth.VerifyAdminKey(key, h.cfg.AdminKey) {
			authenticated = true
		} else if key := r.URL.Query().Get("admin"); key != "" && auth.VerifyAdminKey(key, h.cfg.AdminKey) {
			authenticated = true
		}
	}

	if !authenticated {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "No autorizado. Se requiere token JWT válido o clave de administración.",
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
		"data":    updatedData,
	})
}
