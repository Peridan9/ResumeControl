package handlers

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
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
	Name     string `json:"name"`
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
		sendBadRequest(c, "Invalid request body", err.Error())
		return
	}

	// Validate email format (binding should handle this, but double-check)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		sendBadRequest(c, "Email is required")
		return
	}

	// Validate password strength
	if len(req.Password) < 8 {
		sendBadRequest(c, "Password must be at least 8 characters long")
		return
	}

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

	// Return user info (without password_hash)
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

	c.JSON(http.StatusCreated, response)
}

