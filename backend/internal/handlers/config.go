package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/peridan9/resumecontrol/backend/internal/database"
)

// Config holds shared dependencies for all handlers
type Config struct {
	DB *database.Queries
}

// SetupRoutes registers all API routes with the Gin router
func (cfg *Config) SetupRoutes(r *gin.Engine) {
	// Initialize handlers
	companyHandler := NewCompanyHandler(cfg.DB)
	jobHandler := NewJobHandler(cfg.DB)
	applicationHandler := NewApplicationHandler(cfg.DB)

	// API routes
	api := r.Group("/api")
	{
		// Company routes
		api.GET("/companies", companyHandler.GetAllCompanies)
		// Nested route: Get jobs by company (must be before /companies/:id)
		api.GET("/companies/:companyId/jobs", jobHandler.GetJobsByCompanyID)
		api.GET("/companies/:id", companyHandler.GetCompanyByID)
		api.POST("/companies", companyHandler.CreateCompany)
		api.PUT("/companies/:id", companyHandler.UpdateCompany)
		api.DELETE("/companies/:id", companyHandler.DeleteCompany)

		// Job routes
		api.GET("/jobs", jobHandler.GetAllJobs)
		// Nested route: Get applications by job (must be before /jobs/:id)
		api.GET("/jobs/:jobId/applications", applicationHandler.GetApplicationsByJobID)
		api.GET("/jobs/:id", jobHandler.GetJobByID)
		api.POST("/jobs", jobHandler.CreateJob)
		api.PUT("/jobs/:id", jobHandler.UpdateJob)
		api.DELETE("/jobs/:id", jobHandler.DeleteJob)

		// Application routes
		api.GET("/applications", applicationHandler.GetAllApplications)
		// Note: Get applications by status is handled via query parameter in GetAllApplications
		// Example: GET /api/applications?status=applied
		api.GET("/applications/:id", applicationHandler.GetApplicationByID)
		api.POST("/applications", applicationHandler.CreateApplication)
		api.PUT("/applications/:id", applicationHandler.UpdateApplication)
		api.DELETE("/applications/:id", applicationHandler.DeleteApplication)
	}
}

