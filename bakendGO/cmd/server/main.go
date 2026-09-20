package main

import (
	"log"
	"net/http"

	"portfolio-backend/internal/app"
)

func main() {
	application, err := app.NewApp()
	if err != nil {
		log.Fatalf("Error initializing application: %v", err)
	}

	addr := ":" + application.Config.Port
	log.Printf("==================================================")
	log.Printf("  Portfolio Go Backend running on http://localhost%s", addr)
	log.Printf("  Connected to Neon PostgreSQL")
	log.Printf("  - GET  /api/portfolio       (Public)")
	log.Printf("  - POST /api/auth/verify     (Rate Limited)")
	log.Printf("  - POST /api/portfolio       (Protected Admin)")
	log.Printf("  - GET  /api/health          (Status)")
	log.Printf("==================================================")

	if err := http.ListenAndServe(addr, application.Handler); err != nil {
		log.Fatalf("Server stopped with error: %v", err)
	}
}
