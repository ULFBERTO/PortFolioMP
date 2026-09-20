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

	// Router setup
	mux := http.NewServeMux()

	// Register Routes
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			h.HealthCheck(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/portfolio", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h.GetPortfolio(w, r)
		case http.MethodPost, http.MethodPut:
			h.UpdatePortfolio(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/auth/verify", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost || r.Method == http.MethodGet {
			h.VerifyAuth(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Also support root fallback /
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" || r.URL.Path == "" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"service":"Portfolio Backend Go","status":"running","api":"/api/portfolio"}`))
			return
		}
		// Try routing without /api prefix if called directly on serverless path
		if strings.HasPrefix(r.URL.Path, "/portfolio") {
			r.URL.Path = "/api" + r.URL.Path
			mux.ServeHTTP(w, r)
			return
		}
		http.NotFound(w, r)
	})

	// Layer Middlewares
	var handler http.Handler = mux
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
