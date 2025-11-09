package handlers

import (
	"database/sql"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/peridan9/resumecontrol/backend/internal/database"
	_ "github.com/lib/pq"
)

// setupTestRouter creates a Gin router with all handlers for testing
// This helper function is shared across all test files in the handlers package
func setupTestRouter(t *testing.T) (*gin.Engine, *database.Queries, *sql.DB) {
	// Load environment variables from .env file in backend directory
	// Try multiple paths to find .env file depending on where tests are run from
	_ = godotenv.Load()           // Current directory
	_ = godotenv.Load("../.env")  // Try backend/.env if running from handlers directory
	_ = godotenv.Load("../../.env") // Try backend/.env if running from internal/handlers

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		t.Fatalf("DB_URL not set. Please set DB_URL environment variable or create .env file in backend directory")
	}

	// Connect to database
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		t.Fatalf("Failed to open database connection: %v", err)
	}

	if err := db.Ping(); err != nil {
		db.Close()
		t.Fatalf("Failed to ping database: %v", err)
	}

	// Create queries instance
	queries := database.New(db)

	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create router and setup routes
	r := gin.New()
	cfg := Config{
		DB: queries,
	}
	cfg.SetupRoutes(r)

	return r, queries, db
}

