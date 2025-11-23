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
	"golang.org/x/crypto/bcrypt"
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
// Creates a new user account with email and password
func (h *UserHandler) Register(c *gin.Context) {
	// Parse JSON body
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendValidationError(c, err)
		return
	}

	// Normalize email (validation already handled by binding tags)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	// Check if user with this email already exists
	ctx := c.Request.Context()
	_, err := h.queries.GetUserByEmail(ctx, req.Email)
	if err == nil {
		// User already exists
		sendError(c, http.StatusConflict, "User with this email already exists")
		return
	}
	// If error is not "no rows", it's a real database error
	if err != nil && err.Error() != "sql: no rows in result set" {
		sendInternalError(c, "Failed to check for existing user", err)
		return
	}

	// Hash password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		sendInternalError(c, "Failed to hash password", err)
		return
	}

	// Convert name to sql.NullString (name is nullable in database)
	var name sql.NullString
	if strings.TrimSpace(req.Name) != "" {
		name = sql.NullString{
			String: strings.TrimSpace(req.Name),
			Valid:  true,
		}
	}

	// Create user
	user, err := h.queries.CreateUser(ctx, database.CreateUserParams{
		Email:        req.Email,
		PasswordHash: string(passwordHash),
		Name:         name,
	})
	if err != nil {
		// Check for duplicate email (race condition)
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			sendError(c, http.StatusConflict, "User with this email already exists")
			return
		}
		sendInternalError(c, "Failed to create user", err)
		return
	}

	// Generate tokens
	accessToken, refreshToken, err := h.generateTokens(user.ID)
	if err != nil {
		sendInternalError(c, "Failed to generate tokens", err)
		return
	}

	// Return user info with tokens
	var response RegisterResponse
	response.User.ID = user.ID
	response.User.Email = user.Email
	// Convert sql.NullString back to string for JSON response
	if user.Name.Valid {
		response.User.Name = user.Name.String
	} else {
		response.User.Name = ""
	}
	response.Message = "User registered successfully"

	c.JSON(http.StatusCreated, gin.H{
		"user":          response.User,
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"message":       response.Message,
	})
}

// LoginRequest represents the JSON body for user login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Login handles POST /api/auth/login
// Authenticates a user and returns access and refresh tokens
func (h *UserHandler) Login(c *gin.Context) {
	// Parse JSON body
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendValidationError(c, err)
		return
	}


	//test commit for coderabbit
	// Normalize email
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	// Get user by email
	ctx := c.Request.Context()
	user, err := h.queries.GetUserByEmail(ctx, req.Email)
	if err != nil {
		// User not found or database error
		if err.Error() == "sql: no rows in result set" {
			sendError(c, http.StatusUnauthorized, "Invalid email or password")
			return
		}
		sendInternalError(c, "Failed to fetch user", err)
		return
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		sendError(c, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Update last_login timestamp
	_ = h.queries.UpdateUserLastLogin(ctx, user.ID)

	// Generate tokens
	accessToken, refreshToken, err := h.generateTokens(user.ID)
	if err != nil {
		sendInternalError(c, "Failed to generate tokens", err)
		return
	}

	// Return user info with tokens
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

	c.JSON(http.StatusOK, gin.H{
		"user":          userResponse,
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"message":       "Login successful",
	})
}

// RefreshRequest represents the JSON body for token refresh
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// Refresh handles POST /api/auth/refresh
// Generates a new access token using a valid refresh token
func (h *UserHandler) Refresh(c *gin.Context) {
	// Parse JSON body
	var req RefreshRequest
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
		if err.Error() == "sql: no rows in result set" {
			sendError(c, http.StatusUnauthorized, "Invalid refresh token")
			return
		}
		sendInternalError(c, "Failed to fetch refresh token", err)
		return
	}

	// Check if token is revoked
	if refreshToken.RevokedAt.Valid {
		sendError(c, http.StatusUnauthorized, "Refresh token has been revoked")
		return
	}

	// Check if token is expired
	if refreshToken.ExpiresAt.Before(time.Now()) {
		sendError(c, http.StatusUnauthorized, "Refresh token has expired")
		return
	}

	// Generate new access token
	accessTokenExpiration := h.getAccessTokenExpiration()
	accessToken, err := auth.GenerateAccessToken(refreshToken.UserID, accessTokenExpiration)
	if err != nil {
		sendInternalError(c, "Failed to generate access token", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"message":      "Token refreshed successfully",
	})
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

