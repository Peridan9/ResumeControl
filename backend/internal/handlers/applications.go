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
func (h *ApplicationHandler) GetAllApplications(c *gin.Context) {
	ctx := c.Request.Context()

	// Check if status filter is provided
	status := c.Query("status")
	if status != "" {
		// Use status filter
		applications, err := h.queries.GetApplicationsByStatus(ctx, status)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch applications",
				"details": err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, applications)
		return
	}

	// Return all applications
	applications, err := h.queries.GetAllApplications(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch applications",
			"details": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, applications)
}

// GetApplicationByID handles GET /api/applications/:id
// Returns a single application by ID
func (h *ApplicationHandler) GetApplicationByID(c *gin.Context) {
	// Get ID from URL parameter
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid application ID",
			"details": "ID must be a number",
		})
		return
	}

	// Query database
	ctx := c.Request.Context()
	application, err := h.queries.GetApplicationByID(ctx, int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Application not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch application",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, application)
}

// GetApplicationsByJobID handles GET /api/jobs/:jobId/applications
// Returns all applications for a specific job
func (h *ApplicationHandler) GetApplicationsByJobID(c *gin.Context) {
	// Get job ID from URL parameter
	jobIDStr := c.Param("jobId")
	jobID, err := strconv.Atoi(jobIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid job ID",
			"details": "ID must be a number",
		})
		return
	}

	// Query database
	ctx := c.Request.Context()
	applications, err := h.queries.GetApplicationsByJobID(ctx, int32(jobID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch applications",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, applications)
}


// CreateApplicationRequest represents the JSON body for creating an application
type CreateApplicationRequest struct {
	JobID       int32  `json:"job_id" binding:"required"`
	Status      string `json:"status" binding:"required"`
	AppliedDate string `json:"applied_date" binding:"required"` // ISO 8601 format: "2006-01-02"
	Notes       string `json:"notes"`
}

// CreateApplication handles POST /api/applications
// Creates a new application
func (h *ApplicationHandler) CreateApplication(c *gin.Context) {
	// Parse JSON body
	var req CreateApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Validate status is not empty
	if req.Status == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Status is required",
		})
		return
	}

	// Parse applied_date
	appliedDate, err := time.Parse("2006-01-02", req.AppliedDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid applied_date format",
			"details": "Date must be in YYYY-MM-DD format (e.g., 2024-01-15)",
		})
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Validate job exists
	_, err = h.queries.GetJobByID(ctx, req.JobID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Job not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to validate job",
			"details": err.Error(),
		})
		return
	}

	// Create application
	application, err := h.queries.CreateApplication(ctx, database.CreateApplicationParams{
		JobID:       req.JobID,
		Status:      req.Status,
		AppliedDate: appliedDate,
		Notes:       sql.NullString{String: req.Notes, Valid: req.Notes != ""},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create application",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, application)
}

// UpdateApplicationRequest represents the JSON body for updating an application
type UpdateApplicationRequest struct {
	Status      string `json:"status" binding:"required"`
	AppliedDate string `json:"applied_date" binding:"required"` // ISO 8601 format: "2006-01-02"
	Notes       string `json:"notes"`
}

// UpdateApplication handles PUT /api/applications/:id
// Updates an existing application
func (h *ApplicationHandler) UpdateApplication(c *gin.Context) {
	// Get ID from URL parameter
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid application ID",
			"details": "ID must be a number",
		})
		return
	}

	// Parse JSON body
	var req UpdateApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Validate status is not empty
	if req.Status == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Status is required",
		})
		return
	}

	// Parse applied_date
	appliedDate, err := time.Parse("2006-01-02", req.AppliedDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid applied_date format",
			"details": "Date must be in YYYY-MM-DD format (e.g., 2024-01-15)",
		})
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Check if application exists
	_, err = h.queries.GetApplicationByID(ctx, int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Application not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch application",
			"details": err.Error(),
		})
		return
	}

	// Update application
	application, err := h.queries.UpdateApplication(ctx, database.UpdateApplicationParams{
		ID:          int32(id),
		Status:      req.Status,
		AppliedDate: appliedDate,
		Notes:       sql.NullString{String: req.Notes, Valid: req.Notes != ""},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update application",
			"details": err.Error(),
		})
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
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid application ID",
			"details": "ID must be a number",
		})
		return
	}

	// Get request context
	ctx := c.Request.Context()

	// Check if application exists
	_, err = h.queries.GetApplicationByID(ctx, int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Application not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch application",
			"details": err.Error(),
		})
		return
	}

	// Delete application
	err = h.queries.DeleteApplication(ctx, int32(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete application",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Application deleted successfully",
		"id": id,
	})
}

