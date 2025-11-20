package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/peridan9/resumecontrol/backend/internal/database"
)

type JobHandler struct {
	queries *database.Queries
}

func NewJobHandler(queries *database.Queries) *JobHandler {
	return &JobHandler{
		queries: queries,
	}
}

// GetAllJobs handles GET /api/jobs
// Returns all jobs or paginated jobs if page/limit query params are provided
// Query params: ?page=1&limit=10 (optional, backward compatible)
func (h *JobHandler) GetAllJobs(c *gin.Context) {
	ctx := c.Request.Context()

	// Check if pagination parameters are provided
	pageStr := c.Query("page")
	limitStr := c.Query("limit")

	// If no pagination params, return all (backward compatible)
	if pageStr == "" && limitStr == "" {
		jobs, err := h.queries.GetAllJobs(ctx)
		if err != nil {
			sendInternalError(c, "Failed to fetch jobs", err)
			return
		}
		c.JSON(http.StatusOK, jobs)
		return
	}

	// Parse pagination parameters
	params := ParsePaginationParams(c)
	offset := CalculateOffset(params.Page, params.Limit)

	// Fetch paginated jobs
	jobs, err := h.queries.GetAllJobsPaginated(ctx, database.GetAllJobsPaginatedParams{
		Limit:  params.Limit,
		Offset: offset,
	})
	if err != nil {
		sendInternalError(c, "Failed to fetch jobs", err)
		return
	}

	// Fetch total count
	totalCount, err := h.queries.CountJobs(ctx)
	if err != nil {
		sendInternalError(c, "Failed to count jobs", err)
		return
	}

	// Convert to interface{} for paginated response
	data := make([]interface{}, len(jobs))
	for i, job := range jobs {
		data[i] = job
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

// GetJobByID handles GET /api/jobs/:id
// Returns a single job by ID
func (h *JobHandler) GetJobByID(c *gin.Context) {
	// Get ID from URL parameter
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		sendBadRequest(c, "Invalid job ID", "ID must be a number")
		return
	}

	// Query database
	ctx := c.Request.Context()
	job, err := h.queries.GetJobByID(ctx, int32(id))
	if handleDatabaseError(c, err, "Job") {
		return
	}

	c.JSON(http.StatusOK, job)
}

// GetJobsByCompanyID handles GET /api/companies/:id/jobs
// Returns all jobs for a specific company
func (h *JobHandler) GetJobsByCompanyID(c *gin.Context) {
	// Get company ID from URL parameter
	companyIDStr := c.Param("id")
	companyID, err := strconv.Atoi(companyIDStr)
	if err != nil {
		sendBadRequest(c, "Invalid company ID", "ID must be a number")
		return
	}

	// Query database
	ctx := c.Request.Context()
	jobs, err := h.queries.GetJobsByCompanyID(ctx, int32(companyID))
	if err != nil {
		sendInternalError(c, "Failed to fetch jobs", err)
		return
	}

	c.JSON(http.StatusOK, jobs)
}

// CreateJobRequest represents the JSON body for creating a job
// Jobs now belong to applications (application_id is required)
type CreateJobRequest struct {
	ApplicationID int32  `json:"application_id" binding:"required"`
	CompanyID     int32  `json:"company_id" binding:"required"`
	Title         string `json:"title" binding:"required"`
	Description   string `json:"description"`
	Requirements  string `json:"requirements"`
	Location      string `json:"location"`
}

// CreateJob handles POST /api/jobs
// Creates a new job
func (h *JobHandler) CreateJob(c *gin.Context) {
	// Parse JSON body
	var req CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request body", err.Error())
		return
	}

	// Validate title is not empty
	if strings.TrimSpace(req.Title) == "" {
		sendBadRequest(c, "Job title is required")
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Validate application exists
	_, err := h.queries.GetApplicationByID(ctx, req.ApplicationID)
	if handleDatabaseError(c, err, "Application") {
		return
	}

	// Validate company exists
	_, err = h.queries.GetCompanyByID(ctx, req.CompanyID)
	if handleDatabaseError(c, err, "Company") {
		return
	}

	// Create job (now requires application_id)
	job, err := h.queries.CreateJob(ctx, database.CreateJobParams{
		ApplicationID: req.ApplicationID,
		CompanyID:     req.CompanyID,
		Title:         req.Title,
		Description:   sql.NullString{String: req.Description, Valid: req.Description != ""},
		Requirements:  sql.NullString{String: req.Requirements, Valid: req.Requirements != ""},
		Location:      sql.NullString{String: req.Location, Valid: req.Location != ""},
	})
	if handleDatabaseError(c, err, "Job") {
		return
	}

	c.JSON(http.StatusCreated, job)
}

// UpdateJobRequest represents the JSON body for updating a job
type UpdateJobRequest struct {
	Title        string `json:"title" binding:"required"`
	Description  string `json:"description"`
	Requirements string `json:"requirements"`
	Location     string `json:"location"`
}

// UpdateJob handles PUT /api/jobs/:id
// Updates an existing job
func (h *JobHandler) UpdateJob(c *gin.Context) {
	// Get ID from URL parameter
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		sendBadRequest(c, "Invalid job ID", "ID must be a number")
		return
	}

	// Parse JSON body
	var req UpdateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendBadRequest(c, "Invalid request body", err.Error())
		return
	}

	// Validate title is not empty
	if strings.TrimSpace(req.Title) == "" {
		sendBadRequest(c, "Job title is required")
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Check if job exists
	_, err = h.queries.GetJobByID(ctx, int32(id))
	if handleDatabaseError(c, err, "Job") {
		return
	}

	// Update job
	job, err := h.queries.UpdateJob(ctx, database.UpdateJobParams{
		ID:           int32(id),
		Title:        req.Title,
		Description:  sql.NullString{String: req.Description, Valid: req.Description != ""},
		Requirements: sql.NullString{String: req.Requirements, Valid: req.Requirements != ""},
		Location:     sql.NullString{String: req.Location, Valid: req.Location != ""},
	})
	if handleDatabaseError(c, err, "Job") {
		return
	}

	c.JSON(http.StatusOK, job)
}

// DeleteJob handles DELETE /api/jobs/:id
// Deletes a job by ID
func (h *JobHandler) DeleteJob(c *gin.Context) {
	// Get ID from URL parameter
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		sendBadRequest(c, "Invalid job ID", "ID must be a number")
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Check if job exists
	_, err = h.queries.GetJobByID(ctx, int32(id))
	if handleDatabaseError(c, err, "Job") {
		return
	}

	// Delete job
	err = h.queries.DeleteJob(ctx, int32(id))
	if handleDatabaseError(c, err, "Job") {
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Job deleted successfully",
		"id": id,
	})
}