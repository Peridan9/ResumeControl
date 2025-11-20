package handlers

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/peridan9/resumecontrol/backend/internal/database"
)

// TestGetAllCompanies tests GET /api/companies
func TestGetAllCompanies(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	// Create a test company first
	ctx := context.Background()
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name:    "Test Company for GetAll",
		Website: sql.NullString{String: "https://test.com", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Make request
	req := httptest.NewRequest("GET", "/api/companies", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var companies []database.Company
	if err := json.Unmarshal(w.Body.Bytes(), &companies); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(companies) == 0 {
		t.Error("Expected at least one company")
	}

	// Verify our test company is in the list
	found := false
	for _, c := range companies {
		if c.ID == company.ID {
			found = true
			break
		}
	}
	if !found {
		t.Error("Created company should be in the list")
	}
}

// TestGetCompanyByID tests GET /api/companies/:id
func TestGetCompanyByID(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create a test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name:    "Test Company for GetByID",
		Website: sql.NullString{String: "https://test.com", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Test successful retrieval
	req := httptest.NewRequest("GET", "/api/companies/"+strconv.Itoa(int(company.ID)), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var retrieved database.Company
	if err := json.Unmarshal(w.Body.Bytes(), &retrieved); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if retrieved.ID != company.ID {
		t.Errorf("Expected ID %d, got %d", company.ID, retrieved.ID)
	}
	if retrieved.Name != company.Name {
		t.Errorf("Expected name %s, got %s", company.Name, retrieved.Name)
	}

	// Test not found
	req = httptest.NewRequest("GET", "/api/companies/99999", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}

	// Test invalid ID
	req = httptest.NewRequest("GET", "/api/companies/abc", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestCreateCompany tests POST /api/companies
func TestCreateCompany(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Test successful creation
	body := map[string]interface{}{
		"name":    "New Test Company",
		"website": "https://newtest.com",
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/companies", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusCreated, w.Code, w.Body.String())
	}

	var created database.Company
	if err := json.Unmarshal(w.Body.Bytes(), &created); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if created.ID == 0 {
		t.Error("Created company should have an ID")
	}
	if created.Name != "New Test Company" {
		t.Errorf("Expected name 'New Test Company', got %s", created.Name)
	}

	// Cleanup
	defer queries.DeleteCompany(ctx, created.ID)

	// Test get-or-create pattern (create same company again)
	req = httptest.NewRequest("POST", "/api/companies", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d (get-or-create), got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var existing database.Company
	if err := json.Unmarshal(w.Body.Bytes(), &existing); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if existing.ID != created.ID {
		t.Errorf("Expected same company ID %d, got %d", created.ID, existing.ID)
	}

	// Test validation error (missing name)
	invalidBody := map[string]interface{}{
		"website": "https://test.com",
	}
	jsonBody, _ = json.Marshal(invalidBody)

	req = httptest.NewRequest("POST", "/api/companies", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestUpdateCompany tests PUT /api/companies/:id
func TestUpdateCompany(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create a test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name:    "Original Company Name",
		Website: sql.NullString{String: "https://original.com", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Test successful update
	body := map[string]interface{}{
		"name":    "Updated Company Name",
		"website": "https://updated.com",
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("PUT", "/api/companies/"+strconv.Itoa(int(company.ID)), bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var updated database.Company
	if err := json.Unmarshal(w.Body.Bytes(), &updated); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if updated.Name != "Updated Company Name" {
		t.Errorf("Expected name 'Updated Company Name', got %s", updated.Name)
	}

	// Test not found
	req = httptest.NewRequest("PUT", "/api/companies/99999", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

// TestDeleteCompany tests DELETE /api/companies/:id
func TestDeleteCompany(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create a test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name:    "Company to Delete",
		Website: sql.NullString{String: "https://delete.com", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}

	// Test successful deletion
	req := httptest.NewRequest("DELETE", "/api/companies/"+strconv.Itoa(int(company.ID)), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	// Verify it's deleted
	_, err = queries.GetCompanyByID(ctx, company.ID)
	if err == nil {
		t.Error("Company should be deleted")
	}

	// Test not found
	req = httptest.NewRequest("DELETE", "/api/companies/99999", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

// TestGetAllCompanies_WithPagination tests GET /api/companies with pagination
func TestGetAllCompanies_WithPagination(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create multiple test companies
	var createdCompanies []database.Company
	for i := 0; i < 15; i++ {
		company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
			Name:    "Test Company " + strconv.Itoa(i+1),
			Website: sql.NullString{String: "https://test" + strconv.Itoa(i) + ".com", Valid: true},
		})
		if err != nil {
			t.Fatalf("Failed to create test company: %v", err)
		}
		createdCompanies = append(createdCompanies, company)
		defer queries.DeleteCompany(ctx, company.ID)
	}

	// Test pagination: page 1, limit 10
	req := httptest.NewRequest("GET", "/api/companies?page=1&limit=10", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var response PaginatedResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Verify pagination metadata
	if response.Meta.Page != 1 {
		t.Errorf("Expected page 1, got %d", response.Meta.Page)
	}
	if response.Meta.Limit != 10 {
		t.Errorf("Expected limit 10, got %d", response.Meta.Limit)
	}
	if response.Meta.TotalCount < 15 {
		t.Errorf("Expected total_count >= 15, got %d", response.Meta.TotalCount)
	}
	if len(response.Data) != 10 {
		t.Errorf("Expected 10 items in data, got %d", len(response.Data))
	}

	// Test pagination: page 2, limit 10
	req = httptest.NewRequest("GET", "/api/companies?page=2&limit=10", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var response2 PaginatedResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response2); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response2.Meta.Page != 2 {
		t.Errorf("Expected page 2, got %d", response2.Meta.Page)
	}
	if len(response2.Data) > 10 {
		t.Errorf("Expected <= 10 items in page 2, got %d", len(response2.Data))
	}
}

// TestGetAllCompanies_PaginationEdgeCases tests edge cases for pagination
func TestGetAllCompanies_PaginationEdgeCases(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create a test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for Edge Cases",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Test: Page beyond total pages (should return empty data)
	req := httptest.NewRequest("GET", "/api/companies?page=999&limit=10", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var response PaginatedResponse
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(response.Data) != 0 {
		t.Errorf("Expected empty data for page beyond total, got %d items", len(response.Data))
	}

	// Test: Invalid page (negative) - should use default
	req = httptest.NewRequest("GET", "/api/companies?page=-1&limit=10", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	// Test: Invalid limit (zero) - should use default
	req = httptest.NewRequest("GET", "/api/companies?page=1&limit=0", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	// Test: Maximum limit enforcement (limit > 100 should be capped at 100)
	req = httptest.NewRequest("GET", "/api/companies?page=1&limit=200", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var responseMax PaginatedResponse
	if err := json.Unmarshal(w.Body.Bytes(), &responseMax); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if responseMax.Meta.Limit != 100 {
		t.Errorf("Expected limit to be capped at 100, got %d", responseMax.Meta.Limit)
	}

	// Test: Non-numeric page parameter - should use default
	req = httptest.NewRequest("GET", "/api/companies?page=abc&limit=10", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	// Test: Non-numeric limit parameter - should use default
	req = httptest.NewRequest("GET", "/api/companies?page=1&limit=xyz", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}
}

