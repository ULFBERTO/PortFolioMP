package app

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"portfolio-backend/internal/config"
	"portfolio-backend/internal/database"
	"portfolio-backend/internal/handlers"
	"portfolio-backend/internal/middleware"
	redisclient "portfolio-backend/internal/redis"
)

type App struct {
	Config  *config.Config
	DB      *database.DB
	Redis   *redisclient.Client
	Handler http.Handler
}

func NewApp() (*App, error) {
	cfg := config.Load()

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize database: %w", err)
	}

	rc, err := redisclient.Connect(cfg)
	if err != nil {
		log.Printf("[App] Warning: Redis not available: %v", err)
		return nil, fmt.Errorf("failed to initialize Redis: %w", err)
	}

	limiter := middleware.NewRateLimiter(rc, cfg)
	h := handlers.NewHandler(cfg, db, limiter, rc)

	// Handler dispatcher function that matches routes flexibly
	router := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// In Vercel rewrites, the original path may be in query param 'path',
		// in headers, or in r.RequestURI
		if qPath := r.URL.Query().Get("path"); qPath != "" {
			path = qPath
		} else if matchedPath := r.Header.Get("X-Matched-Path"); matchedPath != "" {
			path = matchedPath
		} else if origPath := r.Header.Get("X-Forwarded-Uri"); origPath != "" {
			path = strings.Split(origPath, "?")[0]
		} else if invokePath := r.Header.Get("X-Invoke-Path"); invokePath != "" {
			path = invokePath
		}

		if !strings.HasPrefix(path, "/") {
			path = "/" + path
		}

		// Normalize: strip /api prefix and trailing slash for matching
		norm := path
		if strings.HasPrefix(norm, "/api/") {
			norm = norm[4:]
		} else if norm == "/api" {
			norm = "/"
		}
		if len(norm) > 1 && strings.HasSuffix(norm, "/") {
			norm = strings.TrimSuffix(norm, "/")
		}
		seg := strings.Split(strings.Trim(norm, "/"), "/")

		methodNotAllowed := func() {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}

		switch {
		case norm == "/" || norm == "":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"service":"Portfolio CV Platform Go","status":"running"}`))
			return

		case norm == "/health":
			if r.Method == http.MethodGet {
				h.HealthCheck(w, r)
			} else {
				methodNotAllowed()
			}
			return

		// ---- Auth (email + password). El login por ?admin= quedó desactivado.
		case norm == "/auth/register":
			if r.Method == http.MethodPost {
				h.Register(w, r)
			} else {
				methodNotAllowed()
			}
			return

		case norm == "/auth/login":
			if r.Method == http.MethodPost {
				h.Login(w, r)
			} else {
				methodNotAllowed()
			}
			return

		case norm == "/auth/me":
			if r.Method == http.MethodGet {
				h.Me(w, r)
			} else {
				methodNotAllowed()
			}
			return

		case norm == "/auth/refresh":
			if r.Method == http.MethodPost || r.Method == http.MethodGet {
				h.RefreshSession(w, r)
			} else {
				methodNotAllowed()
			}
			return

		case norm == "/auth/logout":
			if r.Method == http.MethodPost || r.Method == http.MethodGet {
				h.LogoutUser(w, r)
			} else {
				methodNotAllowed()
			}
			return

		// ---- CVs del usuario autenticado
		case norm == "/cvs/mine":
			if r.Method == http.MethodGet {
				h.ListMyCVs(w, r)
			} else {
				methodNotAllowed()
			}
			return

		case norm == "/cvs":
			if r.Method == http.MethodPost {
				h.CreateCV(w, r)
			} else {
				methodNotAllowed()
			}
			return

		case len(seg) == 3 && seg[0] == "cvs" && seg[2] == "duplicate":
			if r.Method == http.MethodPost {
				h.DuplicateCV(w, r, seg[1])
			} else {
				methodNotAllowed()
			}
			return

		case len(seg) == 2 && seg[0] == "cvs":
			id := seg[1]
			switch r.Method {
			case http.MethodGet:
				h.GetCV(w, r, id)
			case http.MethodPut, http.MethodPatch:
				h.UpdateCV(w, r, id)
			case http.MethodDelete:
				h.DeleteCV(w, r, id)
			default:
				methodNotAllowed()
			}
			return

		// ---- CV pública por slug: GET /api/cv/:slug (URL exacta)
		case len(seg) == 2 && seg[0] == "cv":
			if r.Method == http.MethodGet {
				h.GetPublicCV(w, r, seg[1])
			} else {
				methodNotAllowed()
			}
			return

		// ---- Admin
		case norm == "/admin/users":
			if r.Method == http.MethodGet {
				h.ListUsers(w, r)
			} else {
				methodNotAllowed()
			}
			return

		case len(seg) == 4 && seg[0] == "admin" && seg[1] == "users" && seg[3] == "role":
			if r.Method == http.MethodPatch || r.Method == http.MethodPut {
				h.SetUserRole(w, r, seg[2])
			} else {
				methodNotAllowed()
			}
			return

		case len(seg) == 3 && seg[0] == "admin" && seg[1] == "users":
			if r.Method == http.MethodDelete {
				h.DeleteUser(w, r, seg[2])
			} else {
				methodNotAllowed()
			}
			return

		case norm == "/admin/cvs":
			if r.Method == http.MethodGet {
				h.ListAllCVs(w, r)
			} else {
				methodNotAllowed()
			}
			return

		// ---- Legacy: portafolio único (GET público, POST solo admin)
		case norm == "/portfolio":
			switch r.Method {
			case http.MethodGet:
				h.GetPortfolio(w, r)
			case http.MethodPost, http.MethodPut:
				h.UpdatePortfolio(w, r)
			default:
				methodNotAllowed()
			}
			return

		default:
			http.NotFound(w, r)
		}
	})

	// Layer Middlewares
	var handler http.Handler = router
	handler = limiter.RateLimitMiddleware(handler)
	handler = middleware.MaxBytesReader(handler)
	handler = middleware.SecurityHeaders(handler)
	handler = middleware.CORS(cfg.AllowedOrigin, handler)

	return &App{
		Config:  cfg,
		DB:      db,
		Redis:   rc,
		Handler: handler,
	}, nil
}
