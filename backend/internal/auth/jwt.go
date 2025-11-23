package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims represents the JWT token claims
type Claims struct {
	UserID int32 `json:"user_id"`
	jwt.RegisteredClaims
}

var jwtSecret []byte

// InitJWT initializes the JWT secret from environment variable
// Should be called at application startup
func InitJWT() error {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return errors.New("JWT_SECRET environment variable is not set")
	}
	if len(secret) < 32 {
		return errors.New("JWT_SECRET must be at least 32 characters long")
	}
	jwtSecret = []byte(secret)
	return nil
}

// GetJWTSecret returns the JWT secret (for testing purposes)
func GetJWTSecret() []byte {
	return jwtSecret
}

// GenerateAccessToken generates a short-lived JWT access token
func GenerateAccessToken(userID int32, expiration time.Duration) (string, error) {
	if len(jwtSecret) == 0 {
		return "", errors.New("JWT secret not initialized. Call InitJWT() first")
	}

	now := time.Now()
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(expiration)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateAccessToken validates and parses a JWT access token
func ValidateAccessToken(tokenString string) (*Claims, error) {
	if len(jwtSecret) == 0 {
		return nil, errors.New("JWT secret not initialized. Call InitJWT() first")
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// GenerateRefreshToken generates a secure random token for refresh tokens
// Uses crypto/rand for cryptographically secure random token generation
func GenerateRefreshToken() (string, error) {
	// Generate 32 random bytes (256 bits)
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	// Encode to base64 URL-safe string
	token := base64.URLEncoding.EncodeToString(bytes)
	return token, nil
}

// HashRefreshToken hashes a refresh token for storage in the database
// Uses SHA256 for hashing (fast and secure for this use case)
// Note: We store the hash, not the plain token, for security
func HashRefreshToken(token string) string {
	// Use SHA256 to hash the token before storing
	// This prevents rainbow table attacks while keeping lookups fast
	hash := sha256.Sum256([]byte(token))
	return base64.URLEncoding.EncodeToString(hash[:])
}

