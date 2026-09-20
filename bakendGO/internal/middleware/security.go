package middleware

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"portfolio-backend/internal/config"
	redisclient "portfolio-backend/internal/redis"
)

// RateLimiter manages rate limiting and auth protection via Redis
type RateLimiter struct {
	redis *redisclient.Client
	cfg   *config.Config
}

func NewRateLimiter(redisClient *redisclient.Client, cfg *config.Config) *RateLimiter {
	return &RateLimiter{
		redis: redisClient,
		cfg:   cfg,
	}
}

// CheckAuthAttempt checks if the IP is locked out
func (rl *RateLimiter) CheckAuthAttempt(ip string) (bool, string) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	locked, ttl, err := rl.redis.IsIPLocked(ctx, ip)
	if err != nil {
		return true, "" // fail open
	}

	if locked {
		remaining := ttl.Round(time.Second)
		return false, fmt.Sprintf("Demasiados intentos fallidos. IP bloqueada temporalmente por %s", remaining)
	}

	return true, ""
}

// RecordAuthResult logs success or increments failure in Redis
func (rl *RateLimiter) RecordAuthResult(ip string, success bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if success {
		rl.redis.ResetAuthFailures(ctx, ip)
	} else {
		rl.redis.RecordAuthFailure(ctx, ip)
	}
}

// GetClientIP extracts the real IP address from the request
func GetClientIP(r *http.Request) string {
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		ips := strings.Split(forwarded, ",")
		return strings.TrimSpace(ips[0])
	}

	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return strings.TrimSpace(realIP)
	}

	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}

// RateLimitMiddleware applies Redis-backed rate limiting per IP
func (rl *RateLimiter) RateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := GetClientIP(r)

		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		allowed, err := rl.redis.CheckRateLimit(ctx, ip)
		if err != nil {
			// fail open on Redis errors
			next.ServeHTTP(w, r)
			return
		}

		if !allowed {
			remaining := rl.redis.GetRateLimitRemaining(ctx, ip)
			w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
			w.Header().Set("Retry-After", fmt.Sprintf("%d", rl.cfg.RateLimitWindow))
			http.Error(w, `{"error":"Demasiadas peticiones. Límite excedido (Rate Limit)."}`, http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// SecurityHeaders applies protective HTTP headers
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

		next.ServeHTTP(w, r)
	})
}

// CORS handles Cross-Origin Resource Sharing (with credentials support for cookies)
func CORS(allowedOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if allowedOrigin == "*" && origin != "" {
			// When credentials are involved, cannot use wildcard — echo origin
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else if origin != "" && origin == allowedOrigin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else if allowedOrigin == "*" {
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Key")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "86400")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// MaxBytesReader limits incoming body size to 1MB
func MaxBytesReader(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Body != nil {
			r.Body = http.MaxBytesReader(w, r.Body, 1048576) // 1MB
		}
		next.ServeHTTP(w, r)
	})
}
