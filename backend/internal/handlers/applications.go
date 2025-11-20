package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/peridan9/resumecontrol/backend/internal/database"
)

type ApplicationHandler struct {
	queries *database.Queries
}

func NewApplicationHandler(queries *database.Queries) *ApplicationHandler {
	return &ApplicationHandler{
		queries: queries,
	}
}

// GetAllApplications handles GET /api/applications
// Returns all applications, or filters by status if ?status= query parameter is provided
// Supports pagination with ?page=1&limit=10 (optional, backward compatible)
// Note: Status filter and pagination can be combined
func (h *ApplicationHandler) GetAllApplications(c *gin.Context) {
	ctx := c.Request.Context()

	// Check if status filter is provided
	status := c.Query("status")
	pageStr := c.Query("page")
	limitStr := c.Query("limit")

	// If status is provided but no pagination, return all filtered (backward compatible)
	if status != "" && pageStr == "" && limitStr == "" {
		applications, err := h.queries.GetApplicationsByStatus(ctx, status)
		if err != nil {
			sendInternalError(c, "Failed to fetch applications", err)
			return
		}
		c.JSON(http.StatusOK, applications)
		return
	}

	// If no pagination params and no status, return all (backward compatible)
	if pageStr == "" && limitStr == "" && status == "" {
		applications, err := h.queries.GetAllApplications(ctx)
		if err != nil {
			sendInternalError(c, "Failed to fetch applications", err)
			return
		}
		c.JSON(http.StatusOK, applications)
		return
	}

	// Parse pagination parameters
	params := ParsePaginationParams(c)
	offset := CalculateOffset(params.Page, params.Limit)

	// If status is provided with pagination, use database-level pagination (efficient!)
	if status != "" {
		// Fetch paginated applications with status filter (database handles pagination)
		applications, err := h.queries.GetApplicationsByStatusPaginated(ctx, database.GetApplicationsByStatusPaginatedParams{
			Status: status,
			Limit:  params.Limit,
			Offset: offset,
		})
		if err != nil {
			sendInternalError(c, "Failed to fetch applications", err)
			return
		}

		// Fetch total count for pagination metadata
		totalCount, err := h.queries.CountApplicationsByStatus(ctx, status)
		if err != nil {
			sendInternalError(c, "Failed to count applications", err)
			return
		}

		// Convert to interface{} for paginated response
		data := make([]interface{}, len(applications))
		for i, app := range applications {
			data[i] = app
		}

		c.JSON(http.StatusOK, PaginatedResponse{
			Data: data,
			Meta: PaginationMeta{
				Page:       params.Page,
				Limit:      params.Limit,
				TotalCount: totalCount,
				TotalPages: CalculateTotalPages(totalCount, params.Limit),
			},
		})
		return
	}

	// Fetch paginated applications (no status filter)
	applications, err := h.queries.GetAllApplicationsPaginated(ctx, database.GetAllApplicationsPaginatedParams{
		Limit:  params.Limit,
		Offset: offset,
	})
	if err != nil {
		sendInternalError(c, "Failed to fetch applications", err)
		return
	}

	// Fetch total count
	totalCount, err := h.queries.CountApplications(ctx)
	if err != nil {
		sendInternalError(c, "Failed to count applications", err)
		return
	}

	// Convert to interface{} for paginated response
	data := make([]interface{}, len(applications))
	for i, app := range applications {
		data[i] = app
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

// GetApplicationByID handles GET /api/applications/:id
// Returns a single application by ID
func (h *ApplicationHandler) GetApplicationByID(c *gin.Context) {
	// Get ID from URL parameter
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		sendBadRequest(c, "Invalid application ID", "ID must be a number")
		return
	}

	// Query database
	ctx := c.Request.Context()
	application, err := h.queries.GetApplicationByID(ctx, int32(id))
	if handleDatabaseError(c, err, "Application") {
		return
	}

	c.JSON(http.StatusOK, application)
}

// GetJobByApplicationID handles GET /api/applications/:id/job
// Returns the job for a specific application
func (h *ApplicationHandler) GetJobByApplicationID(c *gin.Context) {
	// Get application ID from URL parameter
	applicationIDStr := c.Param("id")
	applicationID, err := strconv.Atoi(applicationIDStr)
	if err != nil {
		sendBadRequest(c, "Invalid application ID", "ID must be a number")
		return
	}

	// Query database
	ctx := c.Request.Context()
	job, err := h.queries.GetJobByApplicationID(ctx, int32(applicationID))
	if err != nil {
		if err == sql.ErrNoRows {
			sendNotFound(c, "Job")
			return
		}
		sendInternalError(c, "Failed to fetch job", err)
		return
	}

	c.JSON(http.StatusOK, job)
}


// CreateApplicationRequest represents the JSON body for creating an application
// Note: job_id is no longer required - jobs will be created after applications
type CreateApplicationRequest struct {
	Status      string `json:"status" binding:"required"`
	AppliedDate string `json:"applied_date" binding:"required"` // ISO 8601 format: "2006-01-02"
	ContactID   *int   `json:"contact_id"`                      // Optional contact ID
	Notes       string `json:"notes"`
}

// CreateApplication handles POST /api/applications
// Creates a new application
func (h *ApplicationHandler) CreateApplication(c *gin.Context) {
	// Parse JSON body
	var req CreateApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request body", err.Error())
		return
	}

	// Validate status is not empty
	if req.Status == "" {
		sendBadRequest(c, "Status is required")
		return
	}

	// Parse applied_date
	appliedDate, err := time.Parse("2006-01-02", req.AppliedDate)
	if err != nil {
		sendBadRequest(c, "Invalid applied_date format", "Date must be in YYYY-MM-DD format (e.g., 2024-01-15)")
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Validate contact_id if provided
	var contactID sql.NullInt32
	if req.ContactID != nil {
		// Check if contact exists
		_, err := h.queries.GetContactByID(ctx, int32(*req.ContactID))
		if err != nil {
			if err == sql.ErrNoRows {
				sendBadRequest(c, "Contact not found", "The specified contact ID does not exist")
				return
			}
			sendInternalError(c, "Failed to validate contact", err)
			return
		}
		contactID = sql.NullInt32{Int32: int32(*req.ContactID), Valid: true}
	}

	// Create application (no job_id needed - jobs will reference applications)
	application, err := h.queries.CreateApplication(ctx, database.CreateApplicationParams{
		Status:      req.Status,
		AppliedDate: appliedDate,
		Notes:       sql.NullString{String: req.Notes, Valid: req.Notes != ""},
		ContactID:   contactID,
	})
	if handleDatabaseError(c, err, "Application") {
		return
	}

	c.JSON(http.StatusCreated, application)
}

// UpdateApplicationRequest represents the JSON body for updating an application
type UpdateApplicationRequest struct {
	Status      string `json:"status" binding:"required"`
	AppliedDate string `json:"applied_date" binding:"required"` // ISO 8601 format: "2006-01-02"
	ContactID   *int   `json:"contact_id"`                      // Optional contact ID (null to remove)
	Notes       string `json:"notes"`
}

// UpdateApplication handles PUT /api/applications/:id
// Updates an existing application
func (h *ApplicationHandler) UpdateApplication(c *gin.Context) {
	// Get ID from URL parameter
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		sendBadRequest(c, "Invalid application ID", "ID must be a number")
		return
	}

	// Parse JSON body
	var req UpdateApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request body", err.Error())
		return
	}

	// Validate status is not empty
	if req.Status == "" {
		sendBadRequest(c, "Status is required")
		return
	}

	// Parse applied_date
	appliedDate, err := time.Parse("2006-01-02", req.AppliedDate)
	if err != nil {
		sendBadRequest(c, "Invalid applied_date format", "Date must be in YYYY-MM-DD format (e.g., 2024-01-15)")
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Check if application exists
	_, err = h.queries.GetApplicationByID(ctx, int32(id))
	if handleDatabaseError(c, err, "Application") {
		return
	}

	// Validate contact_id if provided
	var contactID sql.NullInt32
	if req.ContactID != nil {
		// Check if contact exists
		_, err := h.queries.GetContactByID(ctx, int32(*req.ContactID))
		if err != nil {
			if err == sql.ErrNoRows {
				sendBadRequest(c, "Contact not found", "The specified contact ID does not exist")
				return
			}
			sendInternalError(c, "Failed to validate contact", err)
			return
		}
		contactID = sql.NullInt32{Int32: int32(*req.ContactID), Valid: true}
	}

	// Update application
	application, err := h.queries.UpdateApplication(ctx, database.UpdateApplicationParams{
		ID:          int32(id),
		Status:      req.Status,
		AppliedDate: appliedDate,
		Notes:       sql.NullString{String: req.Notes, Valid: req.Notes != ""},
		ContactID:   contactID,
	})
	if handleDatabaseError(c, err, "Application") {
		return
	}

	c.JSON(http.StatusOK, application)
}

// DeleteApplication handles DELETE /api/applications/:id
// Deletes an application by ID
func (h *ApplicationHandler) DeleteApplication(c *gin.Context) {
	// Get ID from URL parameter
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		sendBadRequest(c, "Invalid application ID", "ID must be a number")
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Check if application exists
	_, err = h.queries.GetApplicationByID(ctx, int32(id))
	if handleDatabaseError(c, err, "Application") {
		return
	}

	// Delete application
	err = h.queries.DeleteApplication(ctx, int32(id))
	if handleDatabaseError(c, err, "Application") {
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Application deleted successfully",
		"id": id,
	})
}

