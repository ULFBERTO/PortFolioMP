package app

import (
	"fmt"
	"net/http"
	"strings"

	"portfolio-backend/internal/config"
	"portfolio-backend/internal/database"
	"portfolio-backend/internal/handlers"
	"portfolio-backend/internal/middleware"
)

type App struct {
	Config  *config.Config
	DB      *database.DB
	Handler http.Handler
}

func NewApp() (*App, error) {
	cfg := config.Load()

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize database: %w", err)
	}

	limiter := middleware.NewRateLimiter()
	h := handlers.NewHandler(cfg, db, limiter)

	// Handler dispatcher function that matches routes flexibly
	router := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// Strip trailing slash if present (except root)
		if len(path) > 1 && strings.HasSuffix(path, "/") {
			path = strings.TrimSuffix(path, "/")
		}

		switch {
		case path == "/api/health" || path == "/health":
			if r.Method == http.MethodGet {
				h.HealthCheck(w, r)
			} else {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		case path == "/api/portfolio" || path == "/portfolio":
			switch r.Method {
			case http.MethodGet:
				h.GetPortfolio(w, r)
			case http.MethodPost, http.MethodPut:
				h.UpdatePortfolio(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		case path == "/api/auth/verify" || path == "/auth/verify":
			if r.Method == http.MethodPost || r.Method == http.MethodGet {
				h.VerifyAuth(w, r)
			} else {
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
		Handler: handler,
	}, nil
}
