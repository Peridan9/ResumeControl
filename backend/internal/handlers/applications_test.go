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
	"time"

	"github.com/peridan9/resumecontrol/backend/internal/database"
)

// TestGetAllApplications tests GET /api/applications
func TestGetAllApplications(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for Applications",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Create a test application first (jobs now belong to applications)
	application, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		Status:      "applied",
		AppliedDate: time.Now(),
		Notes:       sql.NullString{String: "Test notes", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}
	defer queries.DeleteApplication(ctx, application.ID)

	// Create job with application_id
	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		ApplicationID: application.ID,
		CompanyID:     company.ID,
		Title:         "Test Job for Applications",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Make request
	req := httptest.NewRequest("GET", "/api/applications", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var applications []database.Application
	if err := json.Unmarshal(w.Body.Bytes(), &applications); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(applications) == 0 {
		t.Error("Expected at least one application")
	}

	// Verify our test application is in the list
	found := false
	for _, a := range applications {
		if a.ID == application.ID {
			found = true
			break
		}
	}
	if !found {
		t.Error("Created application should be in the list")
	}
}

// TestGetAllApplications_WithStatusFilter tests GET /api/applications?status=applied
func TestGetAllApplications_WithStatusFilter(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for Status Filter",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Create applications with different statuses first
	appliedApp, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		Status:      "applied",
		AppliedDate: time.Now(),
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}
	defer queries.DeleteApplication(ctx, appliedApp.ID)

	rejectedApp, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		Status:      "rejected",
		AppliedDate: time.Now(),
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}
	defer queries.DeleteApplication(ctx, rejectedApp.ID)

	// Create jobs for each application
	job1, err := queries.CreateJob(ctx, database.CreateJobParams{
		ApplicationID: appliedApp.ID,
		CompanyID:     company.ID,
		Title:         "Test Job",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job1.ID)

	job2, err := queries.CreateJob(ctx, database.CreateJobParams{
		ApplicationID: rejectedApp.ID,
		CompanyID:     company.ID,
		Title:         "Test Job 2",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job2.ID)

	// Test filtering by status
	req := httptest.NewRequest("GET", "/api/applications?status=applied", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var applications []database.Application
	if err := json.Unmarshal(w.Body.Bytes(), &applications); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Verify all returned applications have status "applied"
	for _, a := range applications {
		if a.Status != "applied" {
			t.Errorf("Expected all applications to have status 'applied', got %s", a.Status)
		}
	}
}

// TestGetApplicationByID tests GET /api/applications/:id
func TestGetApplicationByID(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for GetApplicationByID",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Create a test application first
	application, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		Status:      "applied",
		AppliedDate: time.Now(),
		Notes:       sql.NullString{String: "Test notes", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}
	defer queries.DeleteApplication(ctx, application.ID)

	// Create job with application_id
	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		ApplicationID: application.ID,
		CompanyID:     company.ID,
		Title:         "Test Job",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Test successful retrieval
	req := httptest.NewRequest("GET", "/api/applications/"+strconv.Itoa(int(application.ID)), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var retrieved database.Application
	if err := json.Unmarshal(w.Body.Bytes(), &retrieved); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if retrieved.ID != application.ID {
		t.Errorf("Expected ID %d, got %d", application.ID, retrieved.ID)
	}
	if retrieved.Status != application.Status {
		t.Errorf("Expected status %s, got %s", application.Status, retrieved.Status)
	}

	// Test not found
	req = httptest.NewRequest("GET", "/api/applications/99999", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}

	// Test invalid ID
	req = httptest.NewRequest("GET", "/api/applications/abc", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestGetJobByApplicationID tests GET /api/applications/:id/job
func TestGetJobByApplicationID(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for GetJobByApplicationID",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Create test application first
	application, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		Status:      "applied",
		AppliedDate: time.Now(),
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}
	defer queries.DeleteApplication(ctx, application.ID)

	// Create job with application_id
	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		ApplicationID: application.ID,
		CompanyID:     company.ID,
		Title:         "Test Job",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Test successful retrieval
	req := httptest.NewRequest("GET", "/api/applications/"+strconv.Itoa(int(application.ID))+"/job", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var retrievedJob database.Job
	if err := json.Unmarshal(w.Body.Bytes(), &retrievedJob); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if retrievedJob.ID != job.ID {
		t.Errorf("Expected job ID %d, got %d", job.ID, retrievedJob.ID)
	}
	if retrievedJob.ApplicationID != application.ID {
		t.Errorf("Expected application_id %d, got %d", application.ID, retrievedJob.ApplicationID)
	}
}

// TestCreateApplication tests POST /api/applications
func TestCreateApplication(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Test successful creation (applications no longer require job_id)
	appliedDate := time.Now().Format("2006-01-02")
	body := map[string]interface{}{
		"status":       "applied",
		"applied_date": appliedDate,
		"notes":        "Test application notes",
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/applications", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusCreated, w.Code, w.Body.String())
	}

	var created database.Application
	if err := json.Unmarshal(w.Body.Bytes(), &created); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if created.ID == 0 {
		t.Error("Created application should have an ID")
	}
	if created.Status != "applied" {
		t.Errorf("Expected status 'applied', got %s", created.Status)
	}

	// Cleanup
	defer queries.DeleteApplication(ctx, created.ID)

	// Test validation error (missing status)
	invalidBody := map[string]interface{}{
		"applied_date": appliedDate,
	}
	jsonBody, _ = json.Marshal(invalidBody)

	req = httptest.NewRequest("POST", "/api/applications", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	// Test invalid date format
	invalidBody = map[string]interface{}{
		"status":       "applied",
		"applied_date": "invalid-date",
	}
	jsonBody, _ = json.Marshal(invalidBody)

	req = httptest.NewRequest("POST", "/api/applications", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusBadRequest, w.Code, w.Body.String())
	}
}

// TestUpdateApplication tests PUT /api/applications/:id
func TestUpdateApplication(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for UpdateApplication",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Create a test application first
	application, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		Status:      "applied",
		AppliedDate: time.Now(),
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}
	defer queries.DeleteApplication(ctx, application.ID)

	// Create job with application_id
	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		ApplicationID: application.ID,
		CompanyID:     company.ID,
		Title:         "Test Job",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Test successful update
	appliedDate := time.Now().Format("2006-01-02")
	body := map[string]interface{}{
		"status":       "interview",
		"applied_date": appliedDate,
		"notes":        "Updated notes",
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("PUT", "/api/applications/"+strconv.Itoa(int(application.ID)), bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var updated database.Application
	if err := json.Unmarshal(w.Body.Bytes(), &updated); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if updated.Status != "interview" {
		t.Errorf("Expected status 'interview', got %s", updated.Status)
	}

	// Test not found
	req = httptest.NewRequest("PUT", "/api/applications/99999", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

// TestDeleteApplication tests DELETE /api/applications/:id
func TestDeleteApplication(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for DeleteApplication",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Create a test application first
	application, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		Status:      "applied",
		AppliedDate: time.Now(),
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}

	// Create job with application_id (will be cascade deleted when application is deleted)
	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		ApplicationID: application.ID,
		CompanyID:     company.ID,
		Title:         "Test Job",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}

	// Test successful deletion
	req := httptest.NewRequest("DELETE", "/api/applications/"+strconv.Itoa(int(application.ID)), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	// Verify application is deleted
	_, err = queries.GetApplicationByID(ctx, application.ID)
	if err == nil {
		t.Error("Application should be deleted")
	}

	// Verify job is also cascade deleted
	_, err = queries.GetJobByID(ctx, job.ID)
	if err == nil {
		t.Error("Job should be cascade deleted when application is deleted")
	}

	// Test not found
	req = httptest.NewRequest("DELETE", "/api/applications/99999", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

// TestGetAllApplications_WithPagination tests GET /api/applications with pagination
func TestGetAllApplications_WithPagination(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for Application Pagination",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Create multiple test applications first
	var createdApplications []database.Application
	for i := 0; i < 15; i++ {
		application, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
			Status:      "applied",
			AppliedDate: time.Now(),
			Notes:       sql.NullString{String: "Test notes " + strconv.Itoa(i+1), Valid: true},
		})
		if err != nil {
			t.Fatalf("Failed to create test application: %v", err)
		}
		createdApplications = append(createdApplications, application)
		defer queries.DeleteApplication(ctx, application.ID)

		// Create job for each application
		job, err := queries.CreateJob(ctx, database.CreateJobParams{
			ApplicationID: application.ID,
			CompanyID:     company.ID,
			Title:         "Test Job for Application Pagination " + strconv.Itoa(i+1),
		})
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}
		defer queries.DeleteJob(ctx, job.ID)
	}

	// Test pagination: page 1, limit 10
	req := httptest.NewRequest("GET", "/api/applications?page=1&limit=10", nil)
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
	req = httptest.NewRequest("GET", "/api/applications?page=2&limit=10", nil)
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

// TestGetAllApplications_WithPaginationAndStatus tests pagination with status filter
func TestGetAllApplications_WithPaginationAndStatus(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for Status Pagination",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Create multiple test applications with different statuses first
	var createdApplications []database.Application
	for i := 0; i < 10; i++ {
		status := "applied"
		if i%2 == 0 {
			status = "interview"
		}
		application, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
			Status:      status,
			AppliedDate: time.Now(),
		})
		if err != nil {
			t.Fatalf("Failed to create test application: %v", err)
		}
		createdApplications = append(createdApplications, application)
		defer queries.DeleteApplication(ctx, application.ID)

		// Create job for each application
		job, err := queries.CreateJob(ctx, database.CreateJobParams{
			ApplicationID: application.ID,
			CompanyID:     company.ID,
			Title:         "Test Job for Status Pagination " + strconv.Itoa(i+1),
		})
		if err != nil {
			t.Fatalf("Failed to create test job: %v", err)
		}
		defer queries.DeleteJob(ctx, job.ID)
	}

	// Test pagination with status filter: page 1, limit 5
	req := httptest.NewRequest("GET", "/api/applications?status=applied&page=1&limit=5", nil)
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
	if response.Meta.Limit != 5 {
		t.Errorf("Expected limit 5, got %d", response.Meta.Limit)
	}
	if len(response.Data) > 5 {
		t.Errorf("Expected <= 5 items in page 1, got %d", len(response.Data))
	}
}

// TestGetAllApplications_PaginationEdgeCases tests edge cases for pagination
func TestGetAllApplications_PaginationEdgeCases(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for Application Edge Cases",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Create a test application first
	application, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		Status:      "applied",
		AppliedDate: time.Now(),
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}
	defer queries.DeleteApplication(ctx, application.ID)

	// Create job with application_id
	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		ApplicationID: application.ID,
		CompanyID:     company.ID,
		Title:         "Test Job for Application Edge Cases",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Test: Page beyond total pages (should return empty data)
	req := httptest.NewRequest("GET", "/api/applications?page=999&limit=10", nil)
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

	// Test: Maximum limit enforcement
	req = httptest.NewRequest("GET", "/api/applications?page=1&limit=200", nil)
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
}

