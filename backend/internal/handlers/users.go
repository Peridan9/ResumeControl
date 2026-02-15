package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/peridan9/resumecontrol/backend/internal/auth"
	"github.com/peridan9/resumecontrol/backend/internal/database"
)

// UserHandler handles HTTP requests for user authentication
type UserHandler struct {
	queries *database.Queries
}

// NewUserHandler creates a new user handler
func NewUserHandler(queries *database.Queries) *UserHandler {
	return &UserHandler{
		queries: queries,
	}
}

// RegisterRequest represents the JSON body for user registration
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name" binding:"omitempty,max=255"`
}

// RegisterResponse represents the response after successful registration
type RegisterResponse struct {
	User struct {
		ID    int32  `json:"id"`
		Email string `json:"email"`
		Name  string `json:"name"`
	} `json:"user"`
	Message string `json:"message"`
}

// Register handles POST /api/auth/register
// Deprecated: sign-up is now via Clerk. Returns 410 Gone.
func (h *UserHandler) Register(c *gin.Context) {
	c.JSON(http.StatusGone, gin.H{
		"error":   "Use Clerk for sign-up",
		"message": "This endpoint is no longer available. Please use Clerk for sign-up.",
	})
}

// LoginRequest represents the JSON body for user login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Login handles POST /api/auth/login
// Deprecated: sign-in is now via Clerk. Returns 410 Gone.
func (h *UserHandler) Login(c *gin.Context) {
	c.JSON(http.StatusGone, gin.H{
		"error":   "Use Clerk for sign-in",
		"message": "This endpoint is no longer available. Please use Clerk for sign-in.",
	})
}

// RefreshRequest represents the JSON body for token refresh
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// Refresh handles POST /api/auth/refresh
// Deprecated: sessions are now managed by Clerk. Returns 410 Gone.
func (h *UserHandler) Refresh(c *gin.Context) {
	c.JSON(http.StatusGone, gin.H{
		"error":   "Use Clerk for sessions",
		"message": "This endpoint is no longer available. Sessions are managed by Clerk.",
	})
	return
}

// LogoutRequest represents the JSON body for logout
type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// Logout handles POST /api/auth/logout
// Revokes a refresh token
func (h *UserHandler) Logout(c *gin.Context) {
	// Parse JSON body
	var req LogoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request body", err.Error())
		return
	}

	ctx := c.Request.Context()

	// Hash the refresh token to look it up in database
	tokenHash := auth.HashRefreshToken(req.RefreshToken)

	// Get refresh token from database
	refreshToken, err := h.queries.GetRefreshTokenByHash(ctx, tokenHash)
	if err != nil {
		// Token not found - still return success for security (don't reveal if token exists)
		c.JSON(http.StatusOK, gin.H{
			"message": "Logged out successfully",
		})
		return
	}

	// Revoke the token
	err = h.queries.RevokeRefreshToken(ctx, refreshToken.ID)
	if err != nil {
		sendInternalError(c, "Failed to revoke token", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

// Me handles GET /api/auth/me
// Returns the current authenticated user's information
func (h *UserHandler) Me(c *gin.Context) {
	// Get user_id from context (set by auth middleware)
	userID, ok := requireAuth(c)
	if !ok {
		return // Error already sent
	}

	ctx := c.Request.Context()

	// Get user from database
	user, err := h.queries.GetUserByID(ctx, userID)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			sendError(c, http.StatusNotFound, "User not found")
			return
		}
		sendInternalError(c, "Failed to fetch user", err)
		return
	}

	// Return user info (without password_hash)
	var userResponse struct {
		ID    int32  `json:"id"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	userResponse.ID = user.ID
	userResponse.Email = user.Email
	if user.Name.Valid {
		userResponse.Name = user.Name.String
	} else {
		userResponse.Name = ""
	}

	c.JSON(http.StatusOK, userResponse)
}

// UpdateMeRequest represents the JSON body for updating user info
type UpdateMeRequest struct {
	Name string `json:"name" binding:"omitempty,max=255"`
}

// UpdateMe handles PUT /api/auth/me
// Updates the current authenticated user's information
func (h *UserHandler) UpdateMe(c *gin.Context) {
	// Get user_id from context (set by auth middleware)
	userID, ok := requireAuth(c)
	if !ok {
		return // Error already sent
	}

	// Parse JSON body
	var req UpdateMeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendValidationError(c, err)
		return
	}

	ctx := c.Request.Context()

	// Convert name to sql.NullString
	var name sql.NullString
	if strings.TrimSpace(req.Name) != "" {
		name = sql.NullString{
			String: strings.TrimSpace(req.Name),
			Valid:  true,
		}
	}

	// Update user
	user, err := h.queries.UpdateUser(ctx, database.UpdateUserParams{
		ID:   userID,
		Name: name,
	})
	if err != nil {
		sendInternalError(c, "Failed to update user", err)
		return
	}

	// Return updated user info
	var userResponse struct {
		ID    int32  `json:"id"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	userResponse.ID = user.ID
	userResponse.Email = user.Email
	if user.Name.Valid {
		userResponse.Name = user.Name.String
	} else {
		userResponse.Name = ""
	}

	c.JSON(http.StatusOK, userResponse)
}

// Helper functions

// generateTokens generates both access and refresh tokens and stores refresh token in database
func (h *UserHandler) generateTokens(userID int32) (accessToken string, refreshToken string, err error) {
	// Generate access token
	accessTokenExpiration := h.getAccessTokenExpiration()
	accessToken, err = auth.GenerateAccessToken(userID, accessTokenExpiration)
	if err != nil {
		return "", "", err
	}

	// Generate refresh token
	refreshToken, err = auth.GenerateRefreshToken()
	if err != nil {
		return "", "", err
	}

	// Hash refresh token for storage
	tokenHash := auth.HashRefreshToken(refreshToken)

	// Calculate expiration (7 days)
	refreshTokenExpiration := h.getRefreshTokenExpiration()
	expiresAt := time.Now().Add(refreshTokenExpiration)

	// Store refresh token in database
	ctx := context.Background()
	_, err = h.queries.CreateRefreshToken(ctx, database.CreateRefreshTokenParams{
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
	})
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

// getAccessTokenExpiration returns the access token expiration duration
func (h *UserHandler) getAccessTokenExpiration() time.Duration {
	expirationStr := os.Getenv("JWT_ACCESS_TOKEN_EXPIRATION")
	if expirationStr == "" {
		expirationStr = "15m" // Default: 15 minutes
	}

	duration, err := time.ParseDuration(expirationStr)
	if err != nil {
		return 15 * time.Minute // Default fallback
	}

	return duration
}

// getRefreshTokenExpiration returns the refresh token expiration duration
func (h *UserHandler) getRefreshTokenExpiration() time.Duration {
	expirationStr := os.Getenv("JWT_REFRESH_TOKEN_EXPIRATION")
	if expirationStr == "" {
		expirationStr = "168h" // Default: 7 days
	}

	duration, err := time.ParseDuration(expirationStr)
	if err != nil {
		return 168 * time.Hour // Default fallback: 7 days
	}

	return duration
}

