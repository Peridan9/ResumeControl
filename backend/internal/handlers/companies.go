package handlers

import (
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
}

// NewCompanyHandler creates a new company handler
func NewCompanyHandler(queries *database.Queries) *CompanyHandler {
	return &CompanyHandler{
		queries: queries,
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
// Returns all companies or paginated companies if page/limit query params are provided
// Query params: ?page=1&limit=10 (optional, backward compatible)
func (h *CompanyHandler) GetAllCompanies(c *gin.Context) {
	// Get user_id from context (set by AuthMiddleware)
	userID, ok := requireAuth(c)
	if !ok {
		return
	}

	ctx := c.Request.Context()

	// Check if pagination parameters are provided
	pageStr := c.Query("page")
	limitStr := c.Query("limit")

	// If no pagination params, return all (backward compatible)
	if pageStr == "" && limitStr == "" {
		companies, err := h.queries.GetCompaniesByUserID(ctx, userID)
		if err != nil {
			sendInternalError(c, "Failed to fetch companies", err)
			return
		}
		c.JSON(http.StatusOK, companies)
		return
	}

	// Parse pagination parameters
	params := ParsePaginationParams(c)
	offset := CalculateOffset(params.Page, params.Limit)

	// Fetch paginated companies
	companies, err := h.queries.GetCompaniesByUserIDPaginated(ctx, database.GetCompaniesByUserIDPaginatedParams{
		UserID: userID,
		Limit:  params.Limit,
		Offset: offset,
	})
	if err != nil {
		sendInternalError(c, "Failed to fetch companies", err)
		return
	}

	// Fetch total count
	totalCount, err := h.queries.CountCompaniesByUserID(ctx, userID)
	if err != nil {
		sendInternalError(c, "Failed to count companies", err)
		return
	}

	// Convert to interface{} for paginated response
	data := make([]interface{}, len(companies))
	for i, company := range companies {
		data[i] = company
	}

	// Return paginated response
	c.JSON(http.StatusOK, PaginatedResponse{
		Data: data,
		Meta: PaginationMeta{
			Page:       params.Page,
			Limit:      params.Limit,
			TotalCount: totalCount,
			TotalPages: CalculateTotalPages(totalCount, params.Limit),
		},
	})
}

// GetCompanyByID handles GET /api/companies/:id
// Returns a single company by ID (verifies ownership)
func (h *CompanyHandler) GetCompanyByID(c *gin.Context) {
	// Get user_id from context (set by AuthMiddleware)
	userID, ok := requireAuth(c)
	if !ok {
		return
	}

	// Get ID from URL parameter
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		sendBadRequest(c, "Invalid company ID", "ID must be a number")
		return
	}

	// Query database (verifies ownership via user_id)
	ctx := c.Request.Context()
	company, err := h.queries.GetCompanyByIDAndUserID(ctx, database.GetCompanyByIDAndUserIDParams{
		ID:     int32(id),
		UserID: userID,
	})
	if handleDatabaseError(c, err, "Company") {
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
		sendBadRequest(c, "Invalid request body", err.Error())
		return
	}

	// Validate name is not empty (binding:"required" should handle this, but double-check)
	if strings.TrimSpace(req.Name) == "" {
		sendBadRequest(c, "Company name is required")
		return
	}

	// Normalize company name
	normalizedName := normalizeCompanyName(req.Name)

	// Get user_id from context (set by AuthMiddleware)
	userID, ok := requireAuth(c)
	if !ok {
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Check if company with this normalized name already exists for this user
	existingCompany, err := h.queries.GetCompanyByNameAndUserID(ctx, database.GetCompanyByNameAndUserIDParams{
		Btrim:  normalizedName,
		UserID: userID,
	})
	if err == nil {
		// Company exists - return it (get-or-create pattern)
		c.JSON(http.StatusOK, existingCompany)
		return
	}
	// If error is not "no rows", it's a real database error
	if err != nil && err != sql.ErrNoRows {
		sendInternalError(c, "Failed to check for existing company", err)
		return
	}

	// Company doesn't exist - create it
	company, err := h.queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name:    normalizedName,
		Website: sql.NullString{String: req.Website, Valid: req.Website != ""},
		UserID:  userID,
	})
	if err != nil {
		// Check for race condition (another request created it between our check and create)
		errStr := strings.ToLower(err.Error())
		if strings.Contains(errStr, "duplicate") || strings.Contains(errStr, "unique") {
			// Fetch the company that was just created by another request
			existingCompany, fetchErr := h.queries.GetCompanyByNameAndUserID(ctx, database.GetCompanyByNameAndUserIDParams{
				Btrim:  normalizedName,
				UserID: userID,
			})
			if fetchErr == nil {
				c.JSON(http.StatusOK, existingCompany)
				return
			}
		}
		if handleDatabaseError(c, err, "Company") {
			return
		}
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
		sendBadRequest(c, "Invalid company ID", "ID must be a number")
		return
	}

	// Parse JSON body
	var req UpdateCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request body", err.Error())
		return
	}

	// Validate name is not empty
	if strings.TrimSpace(req.Name) == "" {
		sendBadRequest(c, "Company name is required")
		return
	}

	// Get user_id from context (set by AuthMiddleware)
	userID, ok := requireAuth(c)
	if !ok {
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Check if company exists and belongs to user
	_, err = h.queries.GetCompanyByIDAndUserID(ctx, database.GetCompanyByIDAndUserIDParams{
		ID:     int32(id),
		UserID: userID,
	})
	if handleDatabaseError(c, err, "Company") {
		return
	}

	// Normalize company name
	normalizedName := normalizeCompanyName(req.Name)

	// Check if another company with this normalized name already exists for this user
	existingCompany, err := h.queries.GetCompanyByNameAndUserID(ctx, database.GetCompanyByNameAndUserIDParams{
		Btrim:  normalizedName,
		UserID: userID,
	})
	if err == nil && existingCompany.ID != int32(id) {
		// Another company with this name exists for this user
		sendError(c, http.StatusConflict, "Company name already exists")
		return
	}
	// If error is not "no rows", it's a real error (but not the same company)
	if err != nil && err != sql.ErrNoRows {
		sendInternalError(c, "Failed to check for existing company", err)
		return
	}

	// Update company with normalized name (verifies ownership via user_id)
	company, err := h.queries.UpdateCompany(ctx, database.UpdateCompanyParams{
		ID:      int32(id),
		Name:    normalizedName,
		Website: sql.NullString{String: req.Website, Valid: req.Website != ""},
		UserID:  userID,
	})
	if handleDatabaseError(c, err, "Company") {
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
		sendBadRequest(c, "Invalid company ID", "ID must be a number")
		return
	}

	// Get user_id from context (set by AuthMiddleware)
	userID, ok := requireAuth(c)
	if !ok {
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Check if company exists and belongs to user
	_, err = h.queries.GetCompanyByIDAndUserID(ctx, database.GetCompanyByIDAndUserIDParams{
		ID:     int32(id),
		UserID: userID,
	})
	if handleDatabaseError(c, err, "Company") {
		return
	}

	// Delete company (verifies ownership via user_id)
	err = h.queries.DeleteCompany(ctx, database.DeleteCompanyParams{
		ID:     int32(id),
		UserID: userID,
	})
	if handleDatabaseError(c, err, "Company") {
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Company deleted successfully",
		"id": id,
	})
}

