package handler

import (
	"log"
	"net/http"
	"strings"
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

	// Restore original request path from query parameter (passed by vercel.json rewrite)
	if qPath := r.URL.Query().Get("path"); qPath != "" {
		if !strings.HasPrefix(qPath, "/") {
			qPath = "/" + qPath
		}
		r.URL.Path = qPath
	} else if matchedPath := r.Header.Get("X-Matched-Path"); matchedPath != "" {
		r.URL.Path = matchedPath
	} else if origPath := r.Header.Get("X-Forwarded-Uri"); origPath != "" {
		r.URL.Path = strings.Split(origPath, "?")[0]
	} else if invokePath := r.Header.Get("X-Invoke-Path"); invokePath != "" {
		r.URL.Path = invokePath
	}

	application.Handler.ServeHTTP(w, r)
}

