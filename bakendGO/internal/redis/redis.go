package redis

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
	"portfolio-backend/internal/config"
)

type Client struct {
	rdb *redis.Client
	cfg *config.Config
}

// Connect initializes the Upstash Redis client
func Connect(cfg *config.Config) (*Client, error) {
	if cfg.RedisURL == "" {
		return nil, fmt.Errorf("REDIS_URL is not configured")
	}

	opts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse REDIS_URL: %w", err)
	}

	// Upstash-friendly settings
	opts.MaxRetries = 3
	opts.PoolSize = 5
	opts.MinIdleConns = 1
	opts.DialTimeout = 5 * time.Second
	opts.ReadTimeout = 3 * time.Second
	opts.WriteTimeout = 3 * time.Second

	rdb := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to ping Redis: %w", err)
	}

	log.Println("[Redis] Connected to Upstash Redis successfully")

	return &Client{rdb: rdb, cfg: cfg}, nil
}

// --- Session ID Generation ---

// GenerateSessionID creates a cryptographically random session identifier
func GenerateSessionID() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// --- Access Token Storage ---

func accessTokenKey(sessionID string) string {
	return "access_token:" + sessionID
}

// StoreAccessToken saves the access token in Redis with the configured TTL
func (c *Client) StoreAccessToken(ctx context.Context, sessionID, accessToken string) error {
	ttl := time.Duration(c.cfg.AccessTokenTTL) * time.Second
	return c.rdb.Set(ctx, accessTokenKey(sessionID), accessToken, ttl).Err()
}

// GetAccessToken retrieves the access token for a session
func (c *Client) GetAccessToken(ctx context.Context, sessionID string) (string, error) {
	val, err := c.rdb.Get(ctx, accessTokenKey(sessionID)).Result()
	if err == redis.Nil {
		return "", nil // expired or not found
	}
	return val, err
}

// RevokeAccessToken removes the access token from Redis
func (c *Client) RevokeAccessToken(ctx context.Context, sessionID string) error {
	return c.rdb.Del(ctx, accessTokenKey(sessionID)).Err()
}

// RefreshAccessToken extends the TTL of an existing access token
func (c *Client) RefreshAccessToken(ctx context.Context, sessionID string) (bool, error) {
	ttl := time.Duration(c.cfg.AccessTokenTTL) * time.Second
	return c.rdb.Expire(ctx, accessTokenKey(sessionID), ttl).Result()
}

// --- Rate Limiting (Sliding Window Counter) ---

func rateLimitKey(ip string) string {
	return "rate_limit:" + ip
}

// CheckRateLimit returns true if the request is allowed, false if rate limited
func (c *Client) CheckRateLimit(ctx context.Context, ip string) (bool, error) {
	key := rateLimitKey(ip)
	window := time.Duration(c.cfg.RateLimitWindow) * time.Second

	// Increment counter
	count, err := c.rdb.Incr(ctx, key).Result()
	if err != nil {
		return true, err // fail open
	}

	// Set expiry on first request in window
	if count == 1 {
		c.rdb.Expire(ctx, key, window)
	}

	return count <= int64(c.cfg.RateLimitMax), nil
}

// GetRateLimitRemaining returns how many requests remain in the current window
func (c *Client) GetRateLimitRemaining(ctx context.Context, ip string) int {
	count, err := c.rdb.Get(ctx, rateLimitKey(ip)).Int()
	if err != nil {
		return c.cfg.RateLimitMax
	}
	remaining := c.cfg.RateLimitMax - count
	if remaining < 0 {
		return 0
	}
	return remaining
}

// --- Auth Brute-Force Protection ---

func authFailKey(ip string) string {
	return "auth_fail:" + ip
}

func authLockKey(ip string) string {
	return "auth_lock:" + ip
}

// IsIPLocked checks if the IP is currently locked out
func (c *Client) IsIPLocked(ctx context.Context, ip string) (bool, time.Duration, error) {
	ttl, err := c.rdb.TTL(ctx, authLockKey(ip)).Result()
	if err != nil {
		return false, 0, err
	}
	// TTL returns -2 if key doesn't exist, -1 if no expiry
	if ttl > 0 {
		return true, ttl, nil
	}
	return false, 0, nil
}

// RecordAuthFailure increments failed auth attempts and locks if threshold reached
func (c *Client) RecordAuthFailure(ctx context.Context, ip string) (int, error) {
	key := authFailKey(ip)
	lockoutWindow := time.Duration(c.cfg.AuthLockoutTTL) * time.Second

	count, err := c.rdb.Incr(ctx, key).Result()
	if err != nil {
		return 0, err
	}

	// Set expiry so failed attempts auto-expire
	if count == 1 {
		c.rdb.Expire(ctx, key, lockoutWindow)
	}

	// Lock the IP if max attempts exceeded
	if int(count) >= c.cfg.AuthMaxAttempts {
		c.rdb.Set(ctx, authLockKey(ip), "locked", lockoutWindow)
		log.Printf("[Redis] IP %s locked for %v after %d failed attempts", ip, lockoutWindow, count)
	}

	return int(count), nil
}

// ResetAuthFailures clears failed attempts after successful login
func (c *Client) ResetAuthFailures(ctx context.Context, ip string) error {
	pipe := c.rdb.Pipeline()
	pipe.Del(ctx, authFailKey(ip))
	pipe.Del(ctx, authLockKey(ip))
	_, err := pipe.Exec(ctx)
	return err
}

// GetAuthFailures returns the current number of failed attempts
func (c *Client) GetAuthFailures(ctx context.Context, ip string) int {
	val, err := c.rdb.Get(ctx, authFailKey(ip)).Result()
	if err != nil {
		return 0
	}
	n, _ := strconv.Atoi(val)
	return n
}

// --- Health Check ---

// Ping checks if Redis is reachable
func (c *Client) Ping(ctx context.Context) error {
	return c.rdb.Ping(ctx).Err()
}
