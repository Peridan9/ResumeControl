package handlers

import (
	"context"
	"database/sql"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/peridan9/resumecontrol/backend/internal/auth"
	"github.com/peridan9/resumecontrol/backend/internal/database"
	_ "github.com/lib/pq"
)

// TestUser represents a test user created for testing (legacy JWT auth in tests).
type TestUser struct {
	ID    int32
	Email string
	Token string // Access token for authenticated requests
}

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

	// Initialize JWT for testing (use a test secret if JWT_SECRET is not set)
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		// Use a test secret for testing (32+ characters)
		jwtSecret = "test-secret-key-for-testing-purposes-only-min-32-chars"
		os.Setenv("JWT_SECRET", jwtSecret)
	}
	if err := auth.InitJWT(); err != nil {
		t.Fatalf("Failed to initialize JWT: %v", err)
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

	// Create router and setup routes (use legacy JWT auth for tests)
	r := gin.New()
	cfg := Config{
		DB:            queries,
		UseLegacyAuth: true,
	}
	cfg.SetupRoutes(r)

	return r, queries, db
}

// createTestUser creates a test user and returns a TestUser with an access token
// This helper is used by tests that need an authenticated user
// Returns the TestUser and a cleanup function that should be deferred
func createTestUser(t *testing.T, queries *database.Queries, db *sql.DB, email string) (*TestUser, func()) {
	ctx := context.Background()

	var userID int32

	// Check if user already exists
	existingUser, err := queries.GetUserByEmail(ctx, email)
	if err == nil {
		// User exists, generate token for it
		userID = existingUser.ID
		token, err := auth.GenerateAccessToken(existingUser.ID, 15*time.Minute)
		if err != nil {
			t.Fatalf("Failed to generate token for existing user: %v", err)
		}
		return &TestUser{
			ID:    existingUser.ID,
			Email: existingUser.Email,
			Token: token,
		}, func() {
			cleanupTestUser(t, db, userID)
		}
	}

	// Create new user (no password; tests use legacy JWT)
	user, err := queries.CreateUser(ctx, database.CreateUserParams{
		Email: email,
		Name:  sql.NullString{String: "Test User", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	userID = user.ID

	// Generate access token
	token, err := auth.GenerateAccessToken(user.ID, 15*time.Minute)
	if err != nil {
		t.Fatalf("Failed to generate access token: %v", err)
	}

	return &TestUser{
		ID:    user.ID,
		Email: user.Email,
		Token: token,
	}, func() {
		cleanupTestUser(t, db, userID)
	}
}

// cleanupTestUser deletes a test user and all related data (CASCADE delete)
// This should be called with defer in tests to clean up test data
// Pass the database connection to perform the deletion
func cleanupTestUser(t *testing.T, db *sql.DB, userID int32) {
	if userID == 0 {
		return // Skip cleanup if userID is invalid
	}

	ctx := context.Background()

	// Delete user using raw SQL (CASCADE will automatically delete all related data)
	// This includes: companies, applications, contacts, refresh_tokens
	_, err := db.ExecContext(ctx, "DELETE FROM users WHERE id = $1", userID)
	if err != nil {
		t.Logf("Warning: Failed to cleanup test user %d: %v", userID, err)
	}
}

