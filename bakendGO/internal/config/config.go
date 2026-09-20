package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL   string
	Port          string
	AdminKey      string
	JWTSecret     string
	AllowedOrigin string
}

func Load() *Config {
	// Attempt to load .env from current directory or parent directories
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://neondb_owner:npg_zNGjb9v4wVXg@ep-crimson-lab-b4nei89q-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	adminKey := os.Getenv("ADMIN_KEY")
	if adminKey == "" {
		adminKey = "mario2024"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "portfolio-super-secret-jwt-key-2024-change-in-production"
	}

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "*"
	}

	// Clean up dbURL channel_binding if present and causing issues
	if strings.Contains(dbURL, "channel_binding=require") {
		// Some drivers can have issues with channel_binding=require over poolers
		dbURL = strings.Replace(dbURL, "&channel_binding=require", "", 1)
		dbURL = strings.Replace(dbURL, "channel_binding=require&", "", 1)
		dbURL = strings.Replace(dbURL, "?channel_binding=require", "?", 1)
	}

	return &Config{
		DatabaseURL:   dbURL,
		Port:          port,
		AdminKey:      adminKey,
		JWTSecret:     jwtSecret,
		AllowedOrigin: allowedOrigin,
	}
}
