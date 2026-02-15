package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// TestRegister tests POST /api/auth/register (deprecated; returns 410 Gone)
func TestRegister(t *testing.T) {
	router, _, db := setupTestRouter(t)
	defer db.Close()

	body := map[string]interface{}{
		"email":    "test-register@example.com",
		"password": "test-password-123",
		"name":     "Test User",
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusGone {
		t.Errorf("Expected status %d (deprecated), got %d. Body: %s", http.StatusGone, w.Code, w.Body.String())
	}
}

// TestLogin tests POST /api/auth/login (deprecated; returns 410 Gone)
func TestLogin(t *testing.T) {
	router, _, db := setupTestRouter(t)
	defer db.Close()

	body := map[string]interface{}{
		"email":    "test@example.com",
		"password": "test-password-123",
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusGone {
		t.Errorf("Expected status %d (deprecated), got %d. Body: %s", http.StatusGone, w.Code, w.Body.String())
	}
}

// TestRefresh tests POST /api/auth/refresh (deprecated; returns 410 Gone)
func TestRefresh(t *testing.T) {
	router, _, db := setupTestRouter(t)
	defer db.Close()

	body := map[string]interface{}{
		"refresh_token": "test-refresh-token",
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/auth/refresh", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusGone {
		t.Errorf("Expected status %d (deprecated), got %d. Body: %s", http.StatusGone, w.Code, w.Body.String())
	}
}

// TestLogout tests POST /api/auth/logout (no-op with Clerk; returns 200 with valid auth)
func TestLogout(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	email := fmt.Sprintf("test-logout-%d@example.com", time.Now().UnixNano())
	testUser, cleanup := createTestUser(t, queries, db, email)
	defer cleanup()

	req := httptest.NewRequest("POST", "/api/auth/logout", bytes.NewBuffer([]byte("{}")))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+testUser.Token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}
}

// TestMe tests GET /api/auth/me (get current user)
func TestMe(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	// Create a test user
	email := fmt.Sprintf("test-me-%d@example.com", time.Now().UnixNano())
	testUser, cleanup := createTestUser(t, queries, db, email)
	defer cleanup()

	// Test successful get current user
	req := httptest.NewRequest("GET", "/api/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+testUser.Token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var userResponse map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &userResponse); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if int32(userResponse["id"].(float64)) != testUser.ID {
		t.Errorf("Expected user ID %d, got %d", testUser.ID, int32(userResponse["id"].(float64)))
	}
	if userResponse["email"].(string) != testUser.Email {
		t.Errorf("Expected email %s, got %s", testUser.Email, userResponse["email"].(string))
	}

	// Test without authentication (should return 401)
	req = httptest.NewRequest("GET", "/api/auth/me", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d for unauthenticated request, got %d", http.StatusUnauthorized, w.Code)
	}

	// Test with invalid token
	req = httptest.NewRequest("GET", "/api/auth/me", nil)
	req.Header.Set("Authorization", "Bearer invalid-token-12345")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d for invalid token, got %d", http.StatusUnauthorized, w.Code)
	}
}

// TestUpdateMe tests PUT /api/auth/me (update current user)
func TestUpdateMe(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	// Create a test user
	email := fmt.Sprintf("test-update-%d@example.com", time.Now().UnixNano())
	testUser, cleanup := createTestUser(t, queries, db, email)
	defer cleanup()

	// Test successful update
	updateBody := map[string]interface{}{
		"name": "Updated Name",
	}
	jsonBody, _ := json.Marshal(updateBody)

	req := httptest.NewRequest("PUT", "/api/auth/me", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+testUser.Token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var userResponse map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &userResponse); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if userResponse["name"].(string) != "Updated Name" {
		t.Errorf("Expected name 'Updated Name', got %s", userResponse["name"].(string))
	}
}

// TestProtectedEndpointsWithoutAuth tests that protected endpoints return 401 without authentication
func TestProtectedEndpointsWithoutAuth(t *testing.T) {
	router, _, db := setupTestRouter(t)
	defer db.Close()

	protectedEndpoints := []struct {
		method string
		path   string
		body   []byte
	}{
		{"GET", "/api/companies", nil},
		{"GET", "/api/companies/1", nil},
		{"POST", "/api/companies", []byte(`{"name":"Test"}`)},
		{"PUT", "/api/companies/1", []byte(`{"name":"Test"}`)},
		{"DELETE", "/api/companies/1", nil},
		{"GET", "/api/contacts", nil},
		{"GET", "/api/applications", nil},
		{"GET", "/api/jobs", nil},
		{"GET", "/api/auth/me", nil},
		{"PUT", "/api/auth/me", []byte(`{"name":"Test"}`)},
		{"POST", "/api/auth/logout", []byte(`{}`)},
	}

	for _, endpoint := range protectedEndpoints {
		t.Run(endpoint.method+" "+endpoint.path, func(t *testing.T) {
			var req *http.Request
			if endpoint.body != nil {
				req = httptest.NewRequest(endpoint.method, endpoint.path, bytes.NewBuffer(endpoint.body))
				req.Header.Set("Content-Type", "application/json")
			} else {
				req = httptest.NewRequest(endpoint.method, endpoint.path, nil)
			}
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != http.StatusUnauthorized {
				t.Errorf("Expected status %d for %s %s without auth, got %d. Body: %s",
					http.StatusUnauthorized, endpoint.method, endpoint.path, w.Code, w.Body.String())
			}
		})
	}
}

// TestPublicEndpointsWithoutAuth tests that public endpoints work without authentication
func TestPublicEndpointsWithoutAuth(t *testing.T) {
	router, _, db := setupTestRouter(t)
	defer db.Close()

	publicEndpoints := []struct {
		method string
		path   string
		body   []byte
	}{
		{"GET", "/api/health", nil},
		{"POST", "/api/auth/register", []byte(`{"email":"test@example.com","password":"test123456"}`)},
		{"POST", "/api/auth/login", []byte(`{"email":"test@example.com","password":"test123456"}`)},
		{"POST", "/api/auth/refresh", []byte(`{"refresh_token":"test"}`)},
	}

	for _, endpoint := range publicEndpoints {
		t.Run(endpoint.method+" "+endpoint.path, func(t *testing.T) {
			var req *http.Request
			if endpoint.body != nil {
				req = httptest.NewRequest(endpoint.method, endpoint.path, bytes.NewBuffer(endpoint.body))
				req.Header.Set("Content-Type", "application/json")
			} else {
				req = httptest.NewRequest(endpoint.method, endpoint.path, nil)
			}
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Register, login, refresh are deprecated and return 410 Gone (no auth required).
			// Health is public. So we only require that these do not return 401 for missing auth.
			if endpoint.path == "/api/auth/register" || endpoint.path == "/api/auth/login" || endpoint.path == "/api/auth/refresh" {
				if w.Code != http.StatusGone {
					t.Errorf("Deprecated auth endpoint %s %s should return 410 Gone. Got %d. Body: %s",
						endpoint.method, endpoint.path, w.Code, w.Body.String())
				}
				return
			}

			// Health and other public endpoints should not return 401
			if w.Code == http.StatusUnauthorized {
				t.Errorf("Public endpoint %s %s should not return 401. Got %d. Body: %s",
					endpoint.method, endpoint.path, w.Code, w.Body.String())
			}
		})
	}
}

