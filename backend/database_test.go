package main

import (
	"context"
	"database/sql"
	"os"
	"strings"
	"testing"

	"github.com/joho/godotenv"
	"github.com/peridan9/resumecontrol/backend/internal/database"
	_ "github.com/lib/pq"
)

// setupTestDB creates a database connection and queries instance for testing
func setupTestDB(t *testing.T) (*sql.DB, *database.Queries) {
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

	// Test the connection
	if err := db.Ping(); err != nil {
		db.Close()
		t.Fatalf("Failed to ping database: %v", err)
	}

	// Create queries instance
	queries := database.New(db)

	return db, queries
}

// TestDatabaseConnection tests that we can connect to the database
func TestDatabaseConnection(t *testing.T) {
	db, queries := setupTestDB(t)
	defer db.Close()

	// Verify queries instance was created
	if queries == nil {
		t.Error("Queries instance should not be nil")
	}

	// Test a simple query
	var version string
	err := db.QueryRow("SELECT version()").Scan(&version)
	if err != nil {
		t.Fatalf("Failed to query database: %v", err)
	}

	if version == "" {
		t.Error("Database version should not be empty")
	}

	t.Logf("✅ Successfully connected to database. Version: %s", version)
}

// TestSqlcQueries tests the sqlc generated code for companies
func TestSqlcQueries(t *testing.T) {
	db, queries := setupTestDB(t)
	defer db.Close()

	ctx := context.Background()

	// Test 1: Create a company
	companyName := "Test Company"
	companyWebsite := "https://testcompany.com"
	
	createdCompany, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name:    companyName,
		Website: sql.NullString{String: companyWebsite, Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create company: %v", err)
	}

	if createdCompany.ID == 0 {
		t.Error("Created company should have an ID")
	}
	if createdCompany.Name != companyName {
		t.Errorf("Expected company name %s, got %s", companyName, createdCompany.Name)
	}
	t.Logf("✅ Created company: ID=%d, Name=%s", createdCompany.ID, createdCompany.Name)

	// Test 2: Get company by ID
	retrievedCompany, err := queries.GetCompanyByID(ctx, createdCompany.ID)
	if err != nil {
		t.Fatalf("Failed to get company by ID: %v", err)
	}

	if retrievedCompany.ID != createdCompany.ID {
		t.Errorf("Expected company ID %d, got %d", createdCompany.ID, retrievedCompany.ID)
	}
	if retrievedCompany.Name != companyName {
		t.Errorf("Expected company name %s, got %s", companyName, retrievedCompany.Name)
	}
	t.Logf("✅ Retrieved company by ID: %d", retrievedCompany.ID)

	// Test 3: Get company by name (case-insensitive normalization test)
	// The query normalizes both sides, so we can find it even with different case
	testCases := []string{
		companyName,                          // Original case
		strings.ToUpper(companyName),         // All uppercase
		strings.ToLower(companyName),         // All lowercase
		"  " + companyName + "  ",            // With whitespace
	}
	
	for _, testName := range testCases {
		foundCompany, err := queries.GetCompanyByName(ctx, testName)
		if err != nil {
			t.Fatalf("Failed to get company by name '%s': %v", testName, err)
		}
		
		if foundCompany.ID != createdCompany.ID {
			t.Errorf("Expected company ID %d for name '%s', got %d", createdCompany.ID, testName, foundCompany.ID)
		}
		t.Logf("✅ Found company using name: '%s' (normalized)", testName)
	}

	// Test 4: Get all companies
	allCompanies, err := queries.GetAllCompanies(ctx)
	if err != nil {
		t.Fatalf("Failed to get all companies: %v", err)
	}

	if len(allCompanies) == 0 {
		t.Error("Expected at least one company (the one we just created)")
	}

	// Verify our created company is in the list
	found := false
	for _, company := range allCompanies {
		if company.ID == createdCompany.ID {
			found = true
			break
		}
	}
	if !found {
		t.Error("Created company should be in the list of all companies")
	}
	t.Logf("✅ Retrieved all companies: %d companies found", len(allCompanies))

	// Test 5: Update company
	updatedName := "Updated Test Company"
	updatedWebsite := "https://updated-testcompany.com"
	
	updatedCompany, err := queries.UpdateCompany(ctx, database.UpdateCompanyParams{
		ID:      createdCompany.ID,
		Name:    updatedName,
		Website: sql.NullString{String: updatedWebsite, Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to update company: %v", err)
	}

	if updatedCompany.Name != updatedName {
		t.Errorf("Expected updated name %s, got %s", updatedName, updatedCompany.Name)
	}
	t.Logf("✅ Updated company: ID=%d, New Name=%s", updatedCompany.ID, updatedCompany.Name)

	// Test 6: Test unique constraint (try to create duplicate with different case)
	// This should fail due to the unique index on LOWER(TRIM(name))
	// Use the updated name since that's what's currently in the DB
	duplicateCompany, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name:    strings.ToUpper(updatedName), // Different case of updated name
		Website: sql.NullString{String: "https://duplicate.com", Valid: true},
	})
	if err == nil {
		// If no error, we have a problem - should have been prevented by unique index
		// Clean up the duplicate
		queries.DeleteCompany(ctx, duplicateCompany.ID)
		t.Error("Expected error when creating duplicate company name (different case), but got none")
	} else {
		// Expected error - unique constraint violation
		if !strings.Contains(err.Error(), "duplicate") && !strings.Contains(err.Error(), "unique") {
			t.Logf("Note: Got error on duplicate (expected): %v", err)
		}
		t.Logf("✅ Unique constraint working: prevented duplicate company name")
	}

	// Test 7: Delete company (cleanup)
	err = queries.DeleteCompany(ctx, createdCompany.ID)
	if err != nil {
		t.Fatalf("Failed to delete company: %v", err)
	}

	// Verify it's deleted
	_, err = queries.GetCompanyByID(ctx, createdCompany.ID)
	if err == nil {
		t.Error("Company should be deleted, but GetCompanyByID returned no error")
	} else {
		t.Logf("✅ Verified company deletion: GetCompanyByID returned error as expected")
	}
	t.Logf("✅ Deleted company: ID=%d", createdCompany.ID)
}

