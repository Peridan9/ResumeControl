package middleware

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwks"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/gin-gonic/gin"
	"github.com/peridan9/resumecontrol/backend/internal/database"
)

// ClerkAuthMiddleware verifies Clerk session JWTs and resolves to internal user_id.
// Sets user_id in Gin context (same key as AuthMiddleware) so existing handlers work unchanged.
// If the Clerk user is not yet in the DB, creates a user row using Clerk's user API (email, name).
func ClerkAuthMiddleware(queries *database.Queries, jwksClient *jwks.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format. Expected: Bearer <token>"})
			c.Abort()
			return
		}

		tokenString := strings.TrimSpace(parts[1])
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing token"})
			c.Abort()
			return
		}

		ctx := c.Request.Context()

		claims, err := jwt.Verify(ctx, &jwt.VerifyParams{
			Token:       tokenString,
			JWKSClient:  jwksClient,
		})
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		clerkSub := claims.Subject
		if clerkSub == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Resolve to internal user: lookup by clerk_user_id
		u, err := queries.GetUserByClerkID(ctx, sql.NullString{String: clerkSub, Valid: true})
		if err == nil {
			c.Set("user_id", u.ID)
			c.Next()
			return
		}
		if !errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to look up user"})
			c.Abort()
			return
		}

		// User not in DB: fetch from Clerk and create
		clerkUser, err := user.Get(ctx, clerkSub)
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "User not found in application"})
			c.Abort()
			return
		}

		email := getEmailFromClerkUser(clerkUser)
		if email == "" {
			email = "user-" + clerkSub + "@clerk.invalid"
		}
		name := getNameFromClerkUser(clerkUser)

		newUser, err := queries.CreateUserWithClerkID(ctx, database.CreateUserWithClerkIDParams{
			ClerkUserID: sql.NullString{String: clerkSub, Valid: true},
			Email:       email,
			Name:        name,
		})
		if err != nil {
			// Race: another request may have created the user
			u, retryErr := queries.GetUserByClerkID(ctx, sql.NullString{String: clerkSub, Valid: true})
			if retryErr == nil {
				c.Set("user_id", u.ID)
				c.Next()
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			c.Abort()
			return
		}

		c.Set("user_id", newUser.ID)
		c.Next()
	}
}

// getEmailFromClerkUser returns the primary email from a Clerk user.
func getEmailFromClerkUser(u *clerk.User) string {
	if u == nil {
		return ""
	}
	if u.PrimaryEmailAddressID != nil && *u.PrimaryEmailAddressID != "" {
		for _, e := range u.EmailAddresses {
			if e != nil && e.ID == *u.PrimaryEmailAddressID && e.EmailAddress != "" {
				return e.EmailAddress
			}
		}
	}
	for _, e := range u.EmailAddresses {
		if e != nil && e.EmailAddress != "" {
			return e.EmailAddress
		}
	}
	return ""
}

// getNameFromClerkUser returns a display name from Clerk user (FirstName + LastName).
func getNameFromClerkUser(u *clerk.User) sql.NullString {
	if u == nil {
		return sql.NullString{}
	}
	var parts []string
	if u.FirstName != nil && *u.FirstName != "" {
		parts = append(parts, *u.FirstName)
	}
	if u.LastName != nil && *u.LastName != "" {
		parts = append(parts, *u.LastName)
	}
	if len(parts) == 0 {
		return sql.NullString{}
	}
	return sql.NullString{String: strings.TrimSpace(strings.Join(parts, " ")), Valid: true}
}
