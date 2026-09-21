package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// SessionClaims for the short-lived session token (stored in cookie).
// It now carries the user identity + role for the multi-user platform.
type SessionClaims struct {
	SessionID string `json:"sid"`
	UserID    string `json:"uid,omitempty"`
	Role      string `json:"role"`
	jwt.RegisteredClaims
}

// UserAccessClaims for the long-lived access token stored in Redis.
type UserAccessClaims struct {
	UserID string `json:"uid"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// HashPassword hashes a plaintext password with bcrypt.
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// CheckPassword compares a bcrypt hash with a plaintext password.
func CheckPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

// GenerateUserAccessToken creates a long-lived JWT for a user (stored in Redis).
func GenerateUserAccessToken(secret, userID, role string, ttlSeconds int) (string, error) {
	expirationTime := time.Now().Add(time.Duration(ttlSeconds) * time.Second)
	claims := &UserAccessClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   "user-access",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ValidateUserAccessToken verifies a user access token and returns userID + role.
func ValidateUserAccessToken(tokenStr, secret string) (userID, role string, ok bool) {
	if tokenStr == "" {
		return "", "", false
	}
	token, err := jwt.ParseWithClaims(tokenStr, &UserAccessClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return "", "", false
	}
	claims, ok := token.Claims.(*UserAccessClaims)
	if !ok || claims.UserID == "" {
		return "", "", false
	}
	return claims.UserID, claims.Role, true
}

// GenerateUserSessionToken creates a short-lived session JWT for a user (cookie).
func GenerateUserSessionToken(secret, sessionID, userID, role string, ttlSeconds int) (string, int64, error) {
	expiresIn := int64(ttlSeconds)
	expirationTime := time.Now().Add(time.Duration(expiresIn) * time.Second)
	claims := &SessionClaims{
		SessionID: sessionID,
		UserID:    userID,
		Role:      role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   "user-session",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", 0, err
	}
	return tokenString, expiresIn, nil
}

// ValidateUserSessionToken verifies a session token and returns sessionID, userID, role.
func ValidateUserSessionToken(tokenStr, secret string) (sessionID, userID, role string, err error) {
	if tokenStr == "" {
		return "", "", "", errors.New("empty token")
	}
	token, err := jwt.ParseWithClaims(tokenStr, &SessionClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return "", "", "", errors.New("invalid or expired session token")
	}
	claims, ok := token.Claims.(*SessionClaims)
	if !ok || claims.SessionID == "" {
		return "", "", "", errors.New("invalid session claims")
	}
	return claims.SessionID, claims.UserID, claims.Role, nil
}
