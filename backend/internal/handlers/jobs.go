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
// Returns all jobs
func (h *JobHandler) GetAllJobs(c *gin.Context) {
	ctx := c.Request.Context()
	jobs, err := h.queries.GetAllJobs(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch jobs",
			"details": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, jobs)
}

// GetJobByID handles GET /api/jobs/:id
// Returns a single job by ID
func (h *JobHandler) GetJobByID(c *gin.Context) {
	// Get ID from URL parameter
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid job ID",
			"details": "ID must be a number",
		})
		return
	}

	// Query database
	ctx := c.Request.Context()
	job, err := h.queries.GetJobByID(ctx, int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Job not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch job",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, job)
}

// GetJobsByCompanyID handles GET /api/companies/:companyId/jobs
// Returns all jobs for a specific company
func (h *JobHandler) GetJobsByCompanyID(c *gin.Context) {
	// Get company ID from URL parameter
	companyIDStr := c.Param("companyId")
	companyID, err := strconv.Atoi(companyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid company ID",
			"details": "ID must be a number",
		})
		return
	}

	// Query database
	ctx := c.Request.Context()
	jobs, err := h.queries.GetJobsByCompanyID(ctx, int32(companyID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch jobs",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, jobs)
}

// CreateJobRequest represents the JSON body for creating a job
type CreateJobRequest struct {
	CompanyID    int32  `json:"company_id" binding:"required"`
	Title        string `json:"title" binding:"required"`
	Description  string `json:"description"`
	Requirements string `json:"requirements"`
	Location     string `json:"location"`
}

// CreateJob handles POST /api/jobs
// Creates a new job
func (h *JobHandler) CreateJob(c *gin.Context) {
	// Parse JSON body
	var req CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Validate title is not empty
	if strings.TrimSpace(req.Title) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Job title is required",
		})
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Validate company exists
	_, err := h.queries.GetCompanyByID(ctx, req.CompanyID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Company not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to validate company",
			"details": err.Error(),
		})
		return
	}

	// Create job
	job, err := h.queries.CreateJob(ctx, database.CreateJobParams{
		CompanyID:    req.CompanyID,
		Title:        req.Title,
		Description:  sql.NullString{String: req.Description, Valid: req.Description != ""},
		Requirements: sql.NullString{String: req.Requirements, Valid: req.Requirements != ""},
		Location:     sql.NullString{String: req.Location, Valid: req.Location != ""},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create job",
			"details": err.Error(),
		})
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
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid job ID",
			"details": "ID must be a number",
		})
		return
	}

	// Parse JSON body
	var req UpdateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Validate title is not empty
	if strings.TrimSpace(req.Title) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Job title is required",
		})
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Check if job exists
	_, err = h.queries.GetJobByID(ctx, int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Job not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch job",
			"details": err.Error(),
		})
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
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update job",
			"details": err.Error(),
		})
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
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid job ID",
			"details": "ID must be a number",
		})
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Check if job exists
	_, err = h.queries.GetJobByID(ctx, int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Job not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch job",
			"details": err.Error(),
		})
		return
	}

	// Delete job
	err = h.queries.DeleteJob(ctx, int32(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete job",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Job deleted successfully",
		"id": id,
	})
}