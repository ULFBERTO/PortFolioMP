package handler

import (
	"log"
	"net/http"
	"sync"

	"portfolio-backend/internal/app"
)

var (
	application *app.App
	once        sync.Once
	initErr     error
)

func initApp() {
	application, initErr = app.NewApp()
	if initErr != nil {
		log.Printf("[Vercel] Failed to initialize app: %v", initErr)
	}
}

// Handler is the entrypoint for Vercel Serverless Functions
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(initApp)

	if initErr != nil {
		http.Error(w, `{"error":"Database or backend initialization failed: `+initErr.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	application.Handler.ServeHTTP(w, r)
}
