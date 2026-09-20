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

// VerifyAdminKey compares keys using constant time comparison to defeat timing attacks
func VerifyAdminKey(inputKey, expectedKey string) bool {
	if inputKey == "" || expectedKey == "" {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(inputKey), []byte(expectedKey)) == 1
}

// GenerateJWT creates a 2-hour session token for admin
func GenerateJWT(secret string) (string, int64, error) {
	expiresIn := int64(7200) // 2 hours in seconds
	expirationTime := time.Now().Add(time.Duration(expiresIn) * time.Second)

	claims := &AdminClaims{
		Role: "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   "admin",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", 0, err
	}

	return tokenString, expiresIn, nil
}

// ValidateJWT verifies the token signature and expiration
func ValidateJWT(tokenStr, secret string) bool {
	if tokenStr == "" {
		return false
	}

	token, err := jwt.ParseWithClaims(tokenStr, &AdminClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return false
	}

	return true
}
