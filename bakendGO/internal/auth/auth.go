package auth

import (
	"crypto/subtle"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type AdminClaims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

// SessionClaims for the short-lived session token (stored in cookie)
type SessionClaims struct {
	SessionID string `json:"sid"`
	Role      string `json:"role"`
	jwt.RegisteredClaims
}

// VerifyAdminKey compares keys using constant time comparison to defeat timing attacks
func VerifyAdminKey(inputKey, expectedKey string) bool {
	if inputKey == "" || expectedKey == "" {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(inputKey), []byte(expectedKey)) == 1
}

// GenerateAccessToken creates a long-lived JWT to be stored in Redis (never sent to browser)
func GenerateAccessToken(secret string, ttlSeconds int) (string, error) {
	expirationTime := time.Now().Add(time.Duration(ttlSeconds) * time.Second)

	claims := &AdminClaims{
		Role: "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   "admin-access",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// GenerateSessionToken creates a short-lived JWT containing the sessionID (sent as cookie)
func GenerateSessionToken(secret, sessionID string, ttlSeconds int) (string, int64, error) {
	expiresIn := int64(ttlSeconds)
	expirationTime := time.Now().Add(time.Duration(expiresIn) * time.Second)

	claims := &SessionClaims{
		SessionID: sessionID,
		Role:      "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   "admin-session",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", 0, err
	}

	return tokenString, expiresIn, nil
}

// ValidateSessionToken verifies the session token and returns the sessionID
func ValidateSessionToken(tokenStr, secret string) (string, error) {
	if tokenStr == "" {
		return "", errors.New("empty token")
	}

	token, err := jwt.ParseWithClaims(tokenStr, &SessionClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return "", errors.New("invalid or expired session token")
	}

	claims, ok := token.Claims.(*SessionClaims)
	if !ok || claims.SessionID == "" {
		return "", errors.New("invalid session claims")
	}

	return claims.SessionID, nil
}

// ValidateAccessToken verifies the access token signature and expiration
func ValidateAccessToken(tokenStr, secret string) bool {
	if tokenStr == "" {
		return false
	}

	token, err := jwt.ParseWithClaims(tokenStr, &AdminClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	return err == nil && token.Valid
}

// Legacy function kept for backward compatibility
func GenerateJWT(secret string) (string, int64, error) {
	return GenerateSessionToken(secret, "legacy", 7200)
}

// Legacy function kept for backward compatibility
func ValidateJWT(tokenStr, secret string) bool {
	return ValidateAccessToken(tokenStr, secret)
}
