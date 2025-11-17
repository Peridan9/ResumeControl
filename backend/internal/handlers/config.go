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
	contactHandler := NewContactHandler(cfg.DB)

	// API routes
	api := r.Group("/api")
	{
		// Company routes
		api.GET("/companies", companyHandler.GetAllCompanies)
		// Nested route: Get jobs by company (must be before /companies/:id)
		// Use :id instead of :companyId to avoid route conflict
		api.GET("/companies/:id/jobs", jobHandler.GetJobsByCompanyID)
		api.GET("/companies/:id", companyHandler.GetCompanyByID)
		api.POST("/companies", companyHandler.CreateCompany)
		api.PUT("/companies/:id", companyHandler.UpdateCompany)
		api.DELETE("/companies/:id", companyHandler.DeleteCompany)

		// Job routes
		api.GET("/jobs", jobHandler.GetAllJobs)
		api.GET("/jobs/:id", jobHandler.GetJobByID)
		api.POST("/jobs", jobHandler.CreateJob)
		api.PUT("/jobs/:id", jobHandler.UpdateJob)
		api.DELETE("/jobs/:id", jobHandler.DeleteJob)

		// Application routes
		api.GET("/applications", applicationHandler.GetAllApplications)
		// Note: Get applications by status is handled via query parameter in GetAllApplications
		// Example: GET /api/applications?status=applied
		// Nested route: Get job by application (must be before /applications/:id)
		api.GET("/applications/:id/job", applicationHandler.GetJobByApplicationID)
		api.GET("/applications/:id", applicationHandler.GetApplicationByID)
		api.POST("/applications", applicationHandler.CreateApplication)
		api.PUT("/applications/:id", applicationHandler.UpdateApplication)
		api.DELETE("/applications/:id", applicationHandler.DeleteApplication)

		// Contact routes
		api.GET("/contacts", contactHandler.GetAllContacts)
		api.GET("/contacts/:id", contactHandler.GetContactByID)
		api.POST("/contacts", contactHandler.CreateContact)
		api.PUT("/contacts/:id", contactHandler.UpdateContact)
		api.DELETE("/contacts/:id", contactHandler.DeleteContact)
	}
}

