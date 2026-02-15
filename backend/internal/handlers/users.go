package handlers

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
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

// Refresh handles POST /api/auth/refresh
// Deprecated: sessions are now managed by Clerk. Returns 410 Gone.
func (h *UserHandler) Refresh(c *gin.Context) {
	c.JSON(http.StatusGone, gin.H{
		"error":   "Use Clerk for sessions",
		"message": "This endpoint is no longer available. Sessions are managed by Clerk.",
	})
	return
}

// Logout handles POST /api/auth/logout
// No-op for Clerk; session is ended on the frontend via signOut().
func (h *UserHandler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
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

	// Return user info
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


