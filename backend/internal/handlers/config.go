package handlers

import (
	"github.com/clerk/clerk-sdk-go/v2/jwks"
	"github.com/gin-gonic/gin"
	"github.com/peridan9/resumecontrol/backend/internal/database"
	"github.com/peridan9/resumecontrol/backend/internal/middleware"
)

// Config holds shared dependencies for all handlers
type Config struct {
	DB        *database.Queries
	ClerkJWKS *jwks.Client
}

// SetupRoutes registers all API routes with the Gin router
func (cfg *Config) SetupRoutes(r *gin.Engine) {
	// Initialize handlers
	companyHandler := NewCompanyHandler(cfg.DB)
	jobHandler := NewJobHandler(cfg.DB)
	applicationHandler := NewApplicationHandler(cfg.DB)
	contactHandler := NewContactHandler(cfg.DB)
	userHandler := NewUserHandler(cfg.DB)

	// API routes
	api := r.Group("/api")
	{
		// Auth routes (public - no authentication required)
		// Apply rate limiting to prevent brute force attacks
		// 5 requests per second, burst of 10 (allows short bursts)
		authPublic := api.Group("/auth")
		authPublic.Use(middleware.RateLimitMiddleware(5.0, 10))
		{
			authPublic.POST("/register", userHandler.Register)
			authPublic.POST("/login", userHandler.Login)
			authPublic.POST("/refresh", userHandler.Refresh)
		}

		// Auth routes (protected - require Clerk authentication)
		authProtected := api.Group("/auth")
		authProtected.Use(middleware.ClerkAuthMiddleware(cfg.DB, cfg.ClerkJWKS))
		{
			authProtected.POST("/logout", userHandler.Logout)
			authProtected.GET("/me", userHandler.Me)
			authProtected.PUT("/me", userHandler.UpdateMe)
		}

		// Protected routes (require Clerk authentication)
		protected := api.Group("")
		protected.Use(middleware.ClerkAuthMiddleware(cfg.DB, cfg.ClerkJWKS))
		{
				// Company routes
			protected.GET("/companies", companyHandler.GetAllCompanies)
			// Nested route: Get jobs by company (must be before /companies/:id)
			// Use :id instead of :companyId to avoid route conflict
			protected.GET("/companies/:id/jobs", jobHandler.GetJobsByCompanyID)
			protected.GET("/companies/:id", companyHandler.GetCompanyByID)
			protected.POST("/companies", companyHandler.CreateCompany)
			protected.PUT("/companies/:id", companyHandler.UpdateCompany)
			protected.DELETE("/companies/:id", companyHandler.DeleteCompany)

			// Job routes
			protected.GET("/jobs", jobHandler.GetAllJobs)
			protected.GET("/jobs/:id", jobHandler.GetJobByID)
			protected.POST("/jobs", jobHandler.CreateJob)
			protected.PUT("/jobs/:id", jobHandler.UpdateJob)
			protected.DELETE("/jobs/:id", jobHandler.DeleteJob)

			// Application routes
			protected.GET("/applications", applicationHandler.GetAllApplications)
			// Note: Get applications by status is handled via query parameter in GetAllApplications
			// Example: GET /api/applications?status=applied
			// Nested route: Get job by application (must be before /applications/:id)
			protected.GET("/applications/:id/job", applicationHandler.GetJobByApplicationID)
			protected.GET("/applications/:id", applicationHandler.GetApplicationByID)
			protected.POST("/applications", applicationHandler.CreateApplication)
			protected.PUT("/applications/:id", applicationHandler.UpdateApplication)
			protected.DELETE("/applications/:id", applicationHandler.DeleteApplication)

			// Contact routes
			protected.GET("/contacts", contactHandler.GetAllContacts)
			protected.GET("/contacts/:id", contactHandler.GetContactByID)
			protected.POST("/contacts", contactHandler.CreateContact)
			protected.PUT("/contacts/:id", contactHandler.UpdateContact)
			protected.DELETE("/contacts/:id", contactHandler.DeleteContact)
		}
	}
}

