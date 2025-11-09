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

	// Create test company and job
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for Applications",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		CompanyID: company.ID,
		Title:     "Test Job for Applications",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Create a test application
	application, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		JobID:       job.ID,
		Status:      "applied",
		AppliedDate: time.Now(),
		Notes:       sql.NullString{String: "Test notes", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}
	defer queries.DeleteApplication(ctx, application.ID)

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

	// Create test company and job
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for Status Filter",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		CompanyID: company.ID,
		Title:     "Test Job",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Create applications with different statuses
	appliedApp, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		JobID:       job.ID,
		Status:      "applied",
		AppliedDate: time.Now(),
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}
	defer queries.DeleteApplication(ctx, appliedApp.ID)

	rejectedApp, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		JobID:       job.ID,
		Status:      "rejected",
		AppliedDate: time.Now(),
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}
	defer queries.DeleteApplication(ctx, rejectedApp.ID)

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

	// Create test company and job
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for GetApplicationByID",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		CompanyID: company.ID,
		Title:     "Test Job",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Create a test application
	application, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		JobID:       job.ID,
		Status:      "applied",
		AppliedDate: time.Now(),
		Notes:       sql.NullString{String: "Test notes", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}
	defer queries.DeleteApplication(ctx, application.ID)

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

// TestGetApplicationsByJobID tests GET /api/jobs/:id/applications
func TestGetApplicationsByJobID(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company and job
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for GetApplicationsByJobID",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		CompanyID: company.ID,
		Title:     "Test Job",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Create test applications for this job
	app1, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		JobID:       job.ID,
		Status:      "applied",
		AppliedDate: time.Now(),
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}
	defer queries.DeleteApplication(ctx, app1.ID)

	app2, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		JobID:       job.ID,
		Status:      "interview",
		AppliedDate: time.Now(),
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}
	defer queries.DeleteApplication(ctx, app2.ID)

	// Test successful retrieval
	req := httptest.NewRequest("GET", "/api/jobs/"+strconv.Itoa(int(job.ID))+"/applications", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var applications []database.Application
	if err := json.Unmarshal(w.Body.Bytes(), &applications); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(applications) < 2 {
		t.Errorf("Expected at least 2 applications, got %d", len(applications))
	}

	// Verify both applications are in the list
	found1, found2 := false, false
	for _, a := range applications {
		if a.ID == app1.ID {
			found1 = true
		}
		if a.ID == app2.ID {
			found2 = true
		}
	}
	if !found1 || !found2 {
		t.Error("Both created applications should be in the list")
	}
}

// TestCreateApplication tests POST /api/applications
func TestCreateApplication(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company and job
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for CreateApplication",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		CompanyID: company.ID,
		Title:     "Test Job",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Test successful creation
	appliedDate := time.Now().Format("2006-01-02")
	body := map[string]interface{}{
		"job_id":       job.ID,
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
	if created.JobID != job.ID {
		t.Errorf("Expected job_id %d, got %d", job.ID, created.JobID)
	}

	// Cleanup
	defer queries.DeleteApplication(ctx, created.ID)

	// Test validation error (missing status)
	invalidBody := map[string]interface{}{
		"job_id":       job.ID,
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
		"job_id":       job.ID,
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

	// Test job not found
	invalidBody = map[string]interface{}{
		"job_id":       99999,
		"status":       "applied",
		"applied_date": appliedDate,
	}
	jsonBody, _ = json.Marshal(invalidBody)

	req = httptest.NewRequest("POST", "/api/applications", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusNotFound, w.Code, w.Body.String())
	}
}

// TestUpdateApplication tests PUT /api/applications/:id
func TestUpdateApplication(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company and job
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for UpdateApplication",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		CompanyID: company.ID,
		Title:     "Test Job",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Create a test application
	application, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		JobID:       job.ID,
		Status:      "applied",
		AppliedDate: time.Now(),
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}
	defer queries.DeleteApplication(ctx, application.ID)

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

	// Create test company and job
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for DeleteApplication",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		CompanyID: company.ID,
		Title:     "Test Job",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Create a test application
	application, err := queries.CreateApplication(ctx, database.CreateApplicationParams{
		JobID:       job.ID,
		Status:      "applied",
		AppliedDate: time.Now(),
	})
	if err != nil {
		t.Fatalf("Failed to create test application: %v", err)
	}

	// Test successful deletion
	req := httptest.NewRequest("DELETE", "/api/applications/"+strconv.Itoa(int(application.ID)), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	// Verify it's deleted
	_, err = queries.GetApplicationByID(ctx, application.ID)
	if err == nil {
		t.Error("Application should be deleted")
	}

	// Test not found
	req = httptest.NewRequest("DELETE", "/api/applications/99999", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

