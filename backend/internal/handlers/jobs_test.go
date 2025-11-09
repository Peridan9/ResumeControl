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

// TestGetAllJobs tests GET /api/jobs
func TestGetAllJobs(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create a test company first
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name:    "Test Company for Jobs",
		Website: sql.NullString{String: "https://test.com", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Create a test job
	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		CompanyID:    company.ID,
		Title:        "Test Job for GetAll",
		Description:  sql.NullString{String: "Test description", Valid: true},
		Requirements: sql.NullString{String: "Test requirements", Valid: true},
		Location:     sql.NullString{String: "Remote", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Make request
	req := httptest.NewRequest("GET", "/api/jobs", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assertions
	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var jobs []database.Job
	if err := json.Unmarshal(w.Body.Bytes(), &jobs); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(jobs) == 0 {
		t.Error("Expected at least one job")
	}

	// Verify our test job is in the list
	found := false
	for _, j := range jobs {
		if j.ID == job.ID {
			found = true
			break
		}
	}
	if !found {
		t.Error("Created job should be in the list")
	}
}

// TestGetJobByID tests GET /api/jobs/:id
func TestGetJobByID(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for GetJobByID",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Create a test job
	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		CompanyID: company.ID,
		Title:     "Test Job for GetByID",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Test successful retrieval
	req := httptest.NewRequest("GET", "/api/jobs/"+strconv.Itoa(int(job.ID)), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var retrieved database.Job
	if err := json.Unmarshal(w.Body.Bytes(), &retrieved); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if retrieved.ID != job.ID {
		t.Errorf("Expected ID %d, got %d", job.ID, retrieved.ID)
	}
	if retrieved.Title != job.Title {
		t.Errorf("Expected title %s, got %s", job.Title, retrieved.Title)
	}

	// Test not found
	req = httptest.NewRequest("GET", "/api/jobs/99999", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}

	// Test invalid ID
	req = httptest.NewRequest("GET", "/api/jobs/abc", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestGetJobsByCompanyID tests GET /api/companies/:id/jobs
func TestGetJobsByCompanyID(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for GetJobsByCompany",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Create test jobs for this company
	job1, err := queries.CreateJob(ctx, database.CreateJobParams{
		CompanyID: company.ID,
		Title:     "Job 1",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job1.ID)

	job2, err := queries.CreateJob(ctx, database.CreateJobParams{
		CompanyID: company.ID,
		Title:     "Job 2",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job2.ID)

	// Test successful retrieval
	req := httptest.NewRequest("GET", "/api/companies/"+strconv.Itoa(int(company.ID))+"/jobs", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var jobs []database.Job
	if err := json.Unmarshal(w.Body.Bytes(), &jobs); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(jobs) < 2 {
		t.Errorf("Expected at least 2 jobs, got %d", len(jobs))
	}

	// Verify both jobs are in the list
	found1, found2 := false, false
	for _, j := range jobs {
		if j.ID == job1.ID {
			found1 = true
		}
		if j.ID == job2.ID {
			found2 = true
		}
	}
	if !found1 || !found2 {
		t.Error("Both created jobs should be in the list")
	}
}

// TestCreateJob tests POST /api/jobs
func TestCreateJob(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create a test company first
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for CreateJob",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Test successful creation
	body := map[string]interface{}{
		"company_id":  company.ID,
		"title":       "New Test Job",
		"description": "Test job description",
		"location":    "Remote",
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/jobs", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusCreated, w.Code, w.Body.String())
	}

	var created database.Job
	if err := json.Unmarshal(w.Body.Bytes(), &created); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if created.ID == 0 {
		t.Error("Created job should have an ID")
	}
	if created.Title != "New Test Job" {
		t.Errorf("Expected title 'New Test Job', got %s", created.Title)
	}
	if created.CompanyID != company.ID {
		t.Errorf("Expected company_id %d, got %d", company.ID, created.CompanyID)
	}

	// Cleanup
	defer queries.DeleteJob(ctx, created.ID)

	// Test validation error (missing title)
	invalidBody := map[string]interface{}{
		"company_id": company.ID,
	}
	jsonBody, _ = json.Marshal(invalidBody)

	req = httptest.NewRequest("POST", "/api/jobs", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	// Test company not found
	invalidBody = map[string]interface{}{
		"company_id": 99999,
		"title":      "Test Job",
	}
	jsonBody, _ = json.Marshal(invalidBody)

	req = httptest.NewRequest("POST", "/api/jobs", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusNotFound, w.Code, w.Body.String())
	}
}

// TestUpdateJob tests PUT /api/jobs/:id
func TestUpdateJob(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for UpdateJob",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Create a test job
	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		CompanyID: company.ID,
		Title:     "Original Job Title",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}
	defer queries.DeleteJob(ctx, job.ID)

	// Test successful update
	body := map[string]interface{}{
		"title":       "Updated Job Title",
		"description": "Updated description",
		"location":    "On-site",
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("PUT", "/api/jobs/"+strconv.Itoa(int(job.ID)), bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var updated database.Job
	if err := json.Unmarshal(w.Body.Bytes(), &updated); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if updated.Title != "Updated Job Title" {
		t.Errorf("Expected title 'Updated Job Title', got %s", updated.Title)
	}

	// Test not found
	req = httptest.NewRequest("PUT", "/api/jobs/99999", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

// TestDeleteJob tests DELETE /api/jobs/:id
func TestDeleteJob(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test company
	company, err := queries.CreateCompany(ctx, database.CreateCompanyParams{
		Name: "Test Company for DeleteJob",
	})
	if err != nil {
		t.Fatalf("Failed to create test company: %v", err)
	}
	defer queries.DeleteCompany(ctx, company.ID)

	// Create a test job
	job, err := queries.CreateJob(ctx, database.CreateJobParams{
		CompanyID: company.ID,
		Title:     "Job to Delete",
	})
	if err != nil {
		t.Fatalf("Failed to create test job: %v", err)
	}

	// Test successful deletion
	req := httptest.NewRequest("DELETE", "/api/jobs/"+strconv.Itoa(int(job.ID)), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	// Verify it's deleted
	_, err = queries.GetJobByID(ctx, job.ID)
	if err == nil {
		t.Error("Job should be deleted")
	}

	// Test not found
	req = httptest.NewRequest("DELETE", "/api/jobs/99999", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

