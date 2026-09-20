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

		// Fallback check against r.RequestURI if path was overwritten with destination file
		if !strings.Contains(path, "health") && !strings.Contains(path, "auth") && !strings.Contains(path, "verify") && !strings.Contains(path, "portfolio") && !strings.Contains(path, "refresh") {
			reqURI := strings.ToLower(r.RequestURI)
			if strings.Contains(reqURI, "refresh") {
				path = "/api/auth/refresh"
			} else if strings.Contains(reqURI, "auth") || strings.Contains(reqURI, "verify") {
				path = "/api/auth/verify"
			} else if strings.Contains(reqURI, "portfolio") {
				path = "/api/portfolio"
			} else if strings.Contains(reqURI, "health") {
				path = "/api/health"
			}
		}

		// Strip trailing slash if present (except root)
		if len(path) > 1 && strings.HasSuffix(path, "/") {
			path = strings.TrimSuffix(path, "/")
		}

		switch {
		case strings.Contains(path, "health"):
			if r.Method == http.MethodGet {
				h.HealthCheck(w, r)
			} else {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		case strings.Contains(path, "refresh"):
			if r.Method == http.MethodPost || r.Method == http.MethodGet {
				h.RefreshSession(w, r)
			} else {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		case strings.Contains(path, "auth") || strings.Contains(path, "verify"):
			if r.Method == http.MethodPost || r.Method == http.MethodGet {
				h.VerifyAuth(w, r)
			} else {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		case strings.Contains(path, "portfolio"):
			switch r.Method {
			case http.MethodGet:
				h.GetPortfolio(w, r)
			case http.MethodPost, http.MethodPut:
				h.UpdatePortfolio(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		case path == "" || path == "/" || path == "/api" || path == "/api/index.go":
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"service":"Portfolio Backend Go","status":"running","api":"/api/portfolio"}`))

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
