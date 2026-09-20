package middleware

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// Client represents an IP's rate limiting state
type Client struct {
	limiter        *rate.Limiter
	lastSeen       time.Time
	failedAuths    int
	lockoutUntil   time.Time
}

// RateLimiter manages rate limiting across IPs
type RateLimiter struct {
	mu      sync.Mutex
	clients map[string]*Client
}

func NewRateLimiter() *RateLimiter {
	rl := &RateLimiter{
		clients: make(map[string]*Client),
	}

	// Periodically clean up idle clients (every 5 minutes)
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			rl.mu.Lock()
			for ip, client := range rl.clients {
				if time.Since(client.lastSeen) > 15*time.Minute {
					delete(rl.clients, ip)
				}
			}
			rl.mu.Unlock()
		}
	}()

	return rl
}

// GetClient retrieves or creates a client for the given IP
func (rl *RateLimiter) GetClient(ip string) *Client {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	client, exists := rl.clients[ip]
	if !exists {
		// 1 request per second with burst of 30 for general traffic
		limiter := rate.NewLimiter(rate.Every(time.Second), 30)
		client = &Client{
			limiter:  limiter,
			lastSeen: time.Now(),
		}
		rl.clients[ip] = client
	}

	client.lastSeen = time.Now()
	return client
}

// CheckAuthAttempt checks if the IP is locked out or has exceeded failed attempts
func (rl *RateLimiter) CheckAuthAttempt(ip string) (bool, string) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	client, exists := rl.clients[ip]
	if !exists {
		return true, ""
	}

	if time.Now().Before(client.lockoutUntil) {
		remaining := time.Until(client.lockoutUntil).Round(time.Second)
		return false, "Demasiados intentos fallidos. IP bloqueada temporalmente por " + remaining.String()
	}

	return true, ""
}

// RecordAuthResult logs success or increment failure for brute-force defense
func (rl *RateLimiter) RecordAuthResult(ip string, success bool) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	client, exists := rl.clients[ip]
	if !exists {
		limiter := rate.NewLimiter(rate.Every(time.Second), 30)
		client = &Client{limiter: limiter, lastSeen: time.Now()}
		rl.clients[ip] = client
	}

	if success {
		client.failedAuths = 0
		client.lockoutUntil = time.Time{}
	} else {
		client.failedAuths++
		if client.failedAuths >= 5 {
			// Lock out IP for 10 minutes after 5 consecutive failures
			client.lockoutUntil = time.Now().Add(10 * time.Minute)
		}
	}
}

// GetClientIP extracts the real IP address
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

// RateLimitMiddleware applies general rate limiting per IP
func (rl *RateLimiter) RateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := GetClientIP(r)
		client := rl.GetClient(ip)

		if !client.limiter.Allow() {
			http.Error(w, `{"error":"Demasiadas peticiones. Límite excedido (Rate Limit)."}` , http.StatusTooManyRequests)
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

// CORS handles Cross-Origin Resource Sharing
func CORS(allowedOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && (allowedOrigin == "*" || origin == allowedOrigin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else if allowedOrigin == "*" {
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Key")
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
