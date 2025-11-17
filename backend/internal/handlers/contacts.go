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
// Returns all contacts
func (h *ContactHandler) GetAllContacts(c *gin.Context) {
	ctx := c.Request.Context()

	contacts, err := h.queries.GetAllContacts(ctx)
	if err != nil {
		sendInternalError(c, "Failed to fetch contacts", err)
		return
	}

	c.JSON(http.StatusOK, contacts)
}

// GetContactByID handles GET /api/contacts/:id
// Returns a single contact by ID
func (h *ContactHandler) GetContactByID(c *gin.Context) {
	ctx := c.Request.Context()

	contactID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		sendBadRequest(c, "Invalid contact ID", "Contact ID must be a number")
		return
	}

	contact, err := h.queries.GetContactByID(ctx, int32(contactID))
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
// Updates an existing contact
func (h *ContactHandler) UpdateContact(c *gin.Context) {
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

	// Check if contact exists
	_, err = h.queries.GetContactByID(ctx, int32(contactID))
	if err != nil {
		if err == sql.ErrNoRows {
			sendNotFound(c, "Contact")
			return
		}
		sendInternalError(c, "Failed to fetch contact", err)
		return
	}

	// Update contact
	contact, err := h.queries.UpdateContact(ctx, database.UpdateContactParams{
		ID:       int32(contactID),
		Name:     req.Name,
		Email:    sql.NullString{String: req.Email, Valid: req.Email != ""},
		Phone:    sql.NullString{String: req.Phone, Valid: req.Phone != ""},
		Linkedin: sql.NullString{String: req.Linkedin, Valid: req.Linkedin != ""},
	})
	if err != nil {
		handleDatabaseError(c, err, "Contact")
		return
	}

	c.JSON(http.StatusOK, contact)
}

// DeleteContact handles DELETE /api/contacts/:id
// Deletes a contact by ID
func (h *ContactHandler) DeleteContact(c *gin.Context) {
	ctx := c.Request.Context()

	contactID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		sendBadRequest(c, "Invalid contact ID", "Contact ID must be a number")
		return
	}

	// Check if contact exists
	_, err = h.queries.GetContactByID(ctx, int32(contactID))
	if err != nil {
		if err == sql.ErrNoRows {
			sendNotFound(c, "Contact")
			return
		}
		sendInternalError(c, "Failed to fetch contact", err)
		return
	}

	// Delete contact
	err = h.queries.DeleteContact(ctx, int32(contactID))
	if err != nil {
		handleDatabaseError(c, err, "Contact")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Contact deleted successfully"})
}

