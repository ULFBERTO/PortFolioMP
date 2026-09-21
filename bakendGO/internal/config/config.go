package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL   string
	Port          string
	JWTSecret     string
	AllowedOrigin string

	// Redis
	RedisURL string

	// Token TTLs (in seconds)
	AccessTokenTTL  int // How long the access token lives in Redis
	SessionTokenTTL int // How long the session cookie lives in the browser

	// Rate Limiting
	RateLimitWindow int // Sliding window duration in seconds
	RateLimitMax    int // Max requests per window

	// Auth Brute-Force Protection
	AuthMaxAttempts int // Failed attempts before lockout
	AuthLockoutTTL  int // Lockout duration in seconds

	// CookieSecure=false solo para desarrollo local por http (prod siempre true)
	CookieSecure bool
}

func Load() *Config {
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

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "portfolio-super-secret-jwt-key-2024-change-in-production"
	}

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "*"
	}

	redisURL := os.Getenv("REDIS_URL")

	// Clean up dbURL channel_binding if present
	if strings.Contains(dbURL, "channel_binding=require") {
		dbURL = strings.Replace(dbURL, "&channel_binding=require", "", 1)
		dbURL = strings.Replace(dbURL, "channel_binding=require&", "", 1)
		dbURL = strings.Replace(dbURL, "?channel_binding=require", "?", 1)
	}

	cookieSecure := true
	if v := os.Getenv("COOKIE_SECURE"); strings.ToLower(strings.TrimSpace(v)) == "false" {
		cookieSecure = false
	}

	return &Config{
		DatabaseURL:   dbURL,
		Port:          port,
		JWTSecret:     jwtSecret,
		AllowedOrigin: allowedOrigin,

		RedisURL: redisURL,

		AccessTokenTTL:  envInt("ACCESS_TOKEN_TTL", 7200),  // 2 hours
		SessionTokenTTL: envInt("SESSION_TOKEN_TTL", 900),   // 15 minutes
		RateLimitWindow: envInt("RATE_LIMIT_WINDOW", 60),    // 1 minute
		RateLimitMax:    envInt("RATE_LIMIT_MAX", 60),       // 60 req/min
		AuthMaxAttempts: envInt("AUTH_MAX_ATTEMPTS", 5),      // 5 fails
		AuthLockoutTTL:  envInt("AUTH_LOCKOUT_TTL", 600),    // 10 minutes
		CookieSecure:    cookieSecure,
	}
}

func envInt(key string, fallback int) int {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	n, err := strconv.Atoi(val)
	if err != nil {
		return fallback
	}
	return n
}
