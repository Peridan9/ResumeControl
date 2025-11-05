package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"strconv"
	"strings"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/peridan9/resumecontrol/backend/internal/database"
)

// CompanyHandler handles HTTP requests for companies
type CompanyHandler struct {
	queries *database.Queries
	ctx     context.Context
}

// NewCompanyHandler creates a new company handler
func NewCompanyHandler(queries *database.Queries) *CompanyHandler {
	return &CompanyHandler{
		queries: queries,
		ctx:     context.Background(),
	}
}

// normalizeCompanyName normalizes a company name:
// - Trims whitespace
// - Converts to lowercase
// - Capitalizes first letter of each word (smart capitalization)
func normalizeCompanyName(name string) string {
	// Trim whitespace
	name = strings.TrimSpace(name)
	if name == "" {
		return name
	}

	// Convert to lowercase first
	name = strings.ToLower(name)

	// Capitalize first letter of each word
	words := strings.Fields(name)
	for i, word := range words {
		if len(word) > 0 {
			runes := []rune(word)
			runes[0] = unicode.ToUpper(runes[0])
			words[i] = string(runes)
		}
	}

	return strings.Join(words, " ")
}

// GetAllCompanies handles GET /api/companies
// Returns all companies
func (h *CompanyHandler) GetAllCompanies(c *gin.Context) {
	companies, err := h.queries.GetAllCompanies(h.ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch companies",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, companies)
}

// GetCompanyByID handles GET /api/companies/:id
// Returns a single company by ID
func (h *CompanyHandler) GetCompanyByID(c *gin.Context) {
	// Get ID from URL parameter
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid company ID",
			"details": "ID must be a number",
		})
		return
	}

	// Query database
	company, err := h.queries.GetCompanyByID(h.ctx, int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Company not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch company",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, company)
}

// CreateCompanyRequest represents the JSON body for creating a company
type CreateCompanyRequest struct {
	Name    string `json:"name" binding:"required"`
	Website string `json:"website"`
}

// CreateCompany handles POST /api/companies
// Creates a new company if it doesn't exist, or returns existing one (get-or-create pattern)
func (h *CompanyHandler) CreateCompany(c *gin.Context) {
	// Parse JSON body
	var req CreateCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Validate name is not empty (binding:"required" should handle this, but double-check)
	if strings.TrimSpace(req.Name) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Company name is required",
		})
		return
	}

	// Normalize company name
	normalizedName := normalizeCompanyName(req.Name)

	// Check if company with this normalized name already exists
	existingCompany, err := h.queries.GetCompanyByName(h.ctx, normalizedName)
	if err == nil {
		// Company exists - return it (get-or-create pattern)
		c.JSON(http.StatusOK, existingCompany)
		return
	}
	// If error is not "no rows", it's a real database error
	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check for existing company",
			"details": err.Error(),
		})
		return
	}

	// Company doesn't exist - create it
	company, err := h.queries.CreateCompany(h.ctx, database.CreateCompanyParams{
		Name:    normalizedName,
		Website: sql.NullString{String: req.Website, Valid: req.Website != ""},
	})
	if err != nil {
		// Check for race condition (another request created it between our check and create)
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			// Fetch the company that was just created by another request
			existingCompany, fetchErr := h.queries.GetCompanyByName(h.ctx, normalizedName)
			if fetchErr == nil {
				c.JSON(http.StatusOK, existingCompany)
				return
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create company",
			"details": err.Error(),
		})
		return
	}

	// Return newly created company
	c.JSON(http.StatusCreated, company)
}

// UpdateCompanyRequest represents the JSON body for updating a company
type UpdateCompanyRequest struct {
	Name    string `json:"name" binding:"required"`
	Website string `json:"website"`
}

// UpdateCompany handles PUT /api/companies/:id
// Updates an existing company with name normalization
func (h *CompanyHandler) UpdateCompany(c *gin.Context) {
	// Get ID from URL parameter
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid company ID",
			"details": "ID must be a number",
		})
		return
	}

	// Parse JSON body
	var req UpdateCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Validate name is not empty
	if strings.TrimSpace(req.Name) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Company name is required",
		})
		return
	}

	// Check if company exists
	_, err = h.queries.GetCompanyByID(h.ctx, int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Company not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch company",
			"details": err.Error(),
		})
		return
	}

	// Normalize company name
	normalizedName := normalizeCompanyName(req.Name)

	// Check if another company with this normalized name already exists
	existingCompany, err := h.queries.GetCompanyByName(h.ctx, normalizedName)
	if err == nil && existingCompany.ID != int32(id) {
		// Another company with this name exists
		c.JSON(http.StatusConflict, gin.H{
			"error": "Company name already exists",
			"company": existingCompany,
		})
		return
	}
	// If error is not "no rows", it's a real error (but not the same company)
	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check for existing company",
			"details": err.Error(),
		})
		return
	}

	// Update company with normalized name
	company, err := h.queries.UpdateCompany(h.ctx, database.UpdateCompanyParams{
		ID:      int32(id),
		Name:    normalizedName,
		Website: sql.NullString{String: req.Website, Valid: req.Website != ""},
	})
	if err != nil {
		// Check if it's a unique constraint violation
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Company name already exists",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update company",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, company)
}

// DeleteCompany handles DELETE /api/companies/:id
// Deletes a company by ID
func (h *CompanyHandler) DeleteCompany(c *gin.Context) {
	// Get ID from URL parameter
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid company ID",
			"details": "ID must be a number",
		})
		return
	}

	// Check if company exists
	_, err = h.queries.GetCompanyByID(h.ctx, int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Company not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch company",
			"details": err.Error(),
		})
		return
	}

	// Delete company
	err = h.queries.DeleteCompany(h.ctx, int32(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete company",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Company deleted successfully",
		"id": id,
	})
}

