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

	// Company routes
	api := r.Group("/api")
	{
		api.GET("/companies", companyHandler.GetAllCompanies)
		api.GET("/companies/:id", companyHandler.GetCompanyByID)
		api.POST("/companies", companyHandler.CreateCompany)
		api.PUT("/companies/:id", companyHandler.UpdateCompany)
		api.DELETE("/companies/:id", companyHandler.DeleteCompany)
	}
}

