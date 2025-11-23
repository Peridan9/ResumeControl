package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/peridan9/resumecontrol/backend/internal/database"
)

// ContactHandler handles HTTP requests for contacts
type ContactHandler struct {
	queries *database.Queries
}

// NewContactHandler creates a new contact handler
func NewContactHandler(queries *database.Queries) *ContactHandler {
	return &ContactHandler{
		queries: queries,
	}
}

// GetAllContacts handles GET /api/contacts
// Returns all contacts for the authenticated user
func (h *ContactHandler) GetAllContacts(c *gin.Context) {
	// Get user_id from context (set by AuthMiddleware)
	userID, ok := requireAuth(c)
	if !ok {
		return
	}

	ctx := c.Request.Context()

	contacts, err := h.queries.GetContactsByUserID(ctx, userID)
	if err != nil {
		sendInternalError(c, "Failed to fetch contacts", err)
		return
	}

	c.JSON(http.StatusOK, contacts)
}

// GetContactByID handles GET /api/contacts/:id
// Returns a single contact by ID (verifies ownership)
func (h *ContactHandler) GetContactByID(c *gin.Context) {
	// Get user_id from context (set by AuthMiddleware)
	userID, ok := requireAuth(c)
	if !ok {
		return
	}

	ctx := c.Request.Context()

	contactID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		sendBadRequest(c, "Invalid contact ID", "Contact ID must be a number")
		return
	}

	contact, err := h.queries.GetContactByIDAndUserID(ctx, database.GetContactByIDAndUserIDParams{
		ID:     int32(contactID),
		UserID: userID,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			sendNotFound(c, "Contact")
			return
		}
		sendInternalError(c, "Failed to fetch contact", err)
		return
	}

	c.JSON(http.StatusOK, contact)
}

// CreateContactRequest represents the JSON body for creating a contact
type CreateContactRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Linkedin string `json:"linkedin"`
}

// CreateContact handles POST /api/contacts
// Creates a new contact
func (h *ContactHandler) CreateContact(c *gin.Context) {
	// Get user_id from context (set by AuthMiddleware)
	userID, ok := requireAuth(c)
	if !ok {
		return
	}

	ctx := c.Request.Context()

	var req CreateContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request body", err.Error())
		return
	}

	// Validate name is not empty
	if req.Name == "" {
		sendBadRequest(c, "Name is required", "Contact name cannot be empty")
		return
	}

	// Create contact
	contact, err := h.queries.CreateContact(ctx, database.CreateContactParams{
		Name:     req.Name,
		Email:    sql.NullString{String: req.Email, Valid: req.Email != ""},
		Phone:    sql.NullString{String: req.Phone, Valid: req.Phone != ""},
		Linkedin: sql.NullString{String: req.Linkedin, Valid: req.Linkedin != ""},
		UserID:   userID,
	})
	if err != nil {
		handleDatabaseError(c, err, "Contact")
		return
	}

	c.JSON(http.StatusCreated, contact)
}

// UpdateContactRequest represents the JSON body for updating a contact
type UpdateContactRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Linkedin string `json:"linkedin"`
}

// UpdateContact handles PUT /api/contacts/:id
// Updates an existing contact (verifies ownership)
func (h *ContactHandler) UpdateContact(c *gin.Context) {
	// Get user_id from context (set by AuthMiddleware)
	userID, ok := requireAuth(c)
	if !ok {
		return
	}

	ctx := c.Request.Context()

	contactID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		sendBadRequest(c, "Invalid contact ID", "Contact ID must be a number")
		return
	}

	var req UpdateContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request body", err.Error())
		return
	}

	// Validate name is not empty
	if req.Name == "" {
		sendBadRequest(c, "Name is required", "Contact name cannot be empty")
		return
	}

	// Update contact (verifies ownership via user_id)
	contact, err := h.queries.UpdateContact(ctx, database.UpdateContactParams{
		ID:       int32(contactID),
		Name:     req.Name,
		Email:    sql.NullString{String: req.Email, Valid: req.Email != ""},
		Phone:    sql.NullString{String: req.Phone, Valid: req.Phone != ""},
		Linkedin: sql.NullString{String: req.Linkedin, Valid: req.Linkedin != ""},
		UserID:   userID,
	})
	if err != nil {
		handleDatabaseError(c, err, "Contact")
		return
	}

	c.JSON(http.StatusOK, contact)
}

// DeleteContact handles DELETE /api/contacts/:id
// Deletes a contact by ID (verifies ownership)
func (h *ContactHandler) DeleteContact(c *gin.Context) {
	// Get user_id from context (set by AuthMiddleware)
	userID, ok := requireAuth(c)
	if !ok {
		return
	}

	ctx := c.Request.Context()

	contactID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		sendBadRequest(c, "Invalid contact ID", "Contact ID must be a number")
		return
	}

	// Check if contact exists and belongs to user
	_, err = h.queries.GetContactByIDAndUserID(ctx, database.GetContactByIDAndUserIDParams{
		ID:     int32(contactID),
		UserID: userID,
	})
	if handleDatabaseError(c, err, "Contact") {
		return
	}

	// Delete contact (verifies ownership via user_id)
	err = h.queries.DeleteContact(ctx, database.DeleteContactParams{
		ID:     int32(contactID),
		UserID: userID,
	})
	if err != nil {
		handleDatabaseError(c, err, "Contact")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Contact deleted successfully"})
}

