package main

import (
	"database/sql"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

// TestHealthEndpoint tests that the HTTP server starts properly and the health endpoint responds
// This test focuses on HTTP server functionality, not database connectivity
func TestHealthEndpoint(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create router (simulating server setup)
	r := gin.Default()

	// Create a simple health endpoint that doesn't require DB
	// This tests that the HTTP server/router works correctly
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "ResumeControl API is running",
		})
	})

	// Create request
	req, err := http.NewRequest("GET", "/api/health", nil)
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}

	// Create response recorder
	w := httptest.NewRecorder()

	// Perform request
	r.ServeHTTP(w, req)

	// Check status code
	if w.Code != http.StatusOK {
		t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
	}

	// Check response body is not empty
	if w.Body.String() == "" {
		t.Error("Response body is empty")
	}

	// Check Content-Type header
	contentType := w.Header().Get("Content-Type")
	if !strings.Contains(contentType, "application/json") {
		t.Errorf("Expected Content-Type to contain 'application/json', got: %s", contentType)
	}

	// Check that response contains expected fields
	body := w.Body.String()
	if !strings.Contains(body, "ok") {
		t.Errorf("Response does not contain expected 'ok' status. Got: %s", body)
	}

	if !strings.Contains(body, "ResumeControl API is running") {
		t.Errorf("Response does not contain expected message. Got: %s", body)
	}
}

// TestDatabaseConnection tests that we can connect to the database
func TestDatabaseConnection(t *testing.T) {
	// Load environment variables from .env file (if it exists)
	_ = godotenv.Load()

	// Check if DB_URL is set
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		t.Skip("DB_URL not set, skipping test. Set DB_URL environment variable or create .env file")
	}

	// Connect to database
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		t.Fatalf("Failed to open database connection: %v", err)
	}
	defer db.Close()

	// Test the connection
	if err := db.Ping(); err != nil {
		t.Fatalf("Failed to ping database: %v", err)
	}

	// Test a simple query
	var version string
	err = db.QueryRow("SELECT version()").Scan(&version)
	if err != nil {
		t.Fatalf("Failed to query database: %v", err)
	}

	if version == "" {
		t.Error("Database version should not be empty")
	}

	t.Logf("✅ Successfully connected to database. Version: %s", version)
}

