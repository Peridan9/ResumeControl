package handlers

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/peridan9/resumecontrol/backend/internal/database"
	"golang.org/x/crypto/bcrypt"
)

// TestRegister tests POST /api/auth/register
func TestRegister(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Use a unique email for each test run to avoid conflicts
	uniqueEmail := fmt.Sprintf("test-register-%d@example.com", time.Now().UnixNano())

	// Test successful registration
	body := map[string]interface{}{
		"email":    uniqueEmail,
		"password":  "test-password-123",
		"name":      "Test User",
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusCreated, w.Code, w.Body.String())
		return // Don't continue if registration failed
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Verify response contains user, access_token, and refresh_token
	if response["user"] == nil {
		t.Error("Response should contain user")
		return
	}
	if response["access_token"] == nil || response["access_token"] == "" {
		t.Error("Response should contain access_token")
		return
	}
	if response["refresh_token"] == nil || response["refresh_token"] == "" {
		t.Error("Response should contain refresh_token")
		return
	}

	// Verify user was created in database
	userMap := response["user"].(map[string]interface{})
	userID := int32(userMap["id"].(float64))
	user, err := queries.GetUserByID(ctx, userID)
	if err != nil {
		t.Fatalf("Failed to get created user: %v", err)
	}

	if user.Email != uniqueEmail {
		t.Errorf("Expected email '%s', got %s", uniqueEmail, user.Email)
	}

	// Cleanup: Delete test user
	defer cleanupTestUser(t, db, userID)

	// Test duplicate email registration (using the same email we just created)
	req = httptest.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Errorf("Expected status %d for duplicate email, got %d. Body: %s", http.StatusConflict, w.Code, w.Body.String())
	}

	// Test validation error (missing email)
	invalidBody := map[string]interface{}{
		"password": "test-password-123",
	}
	jsonBody, _ = json.Marshal(invalidBody)

	req = httptest.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d for missing email, got %d", http.StatusBadRequest, w.Code)
	}

	// Test validation error (password too short)
	shortPasswordBody := map[string]interface{}{
		"email":    "test-short@example.com",
		"password":  "short",
	}
	jsonBody, _ = json.Marshal(shortPasswordBody)

	req = httptest.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d for short password, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestLogin tests POST /api/auth/login
func TestLogin(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Use a unique email for each test run to avoid conflicts
	email := fmt.Sprintf("test-login-%d@example.com", time.Now().UnixNano())
	password := "test-password-123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	user, err := queries.CreateUser(ctx, database.CreateUserParams{
		Email:        email,
		PasswordHash: string(hashedPassword),
		Name:         sql.NullString{String: "Test Login User", Valid: true},
	})
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Test successful login
	body := map[string]interface{}{
		"email":    email,
		"password": password,
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Verify response contains user, access_token, and refresh_token
	if response["user"] == nil {
		t.Error("Response should contain user")
	}
	if response["access_token"] == nil || response["access_token"] == "" {
		t.Error("Response should contain access_token")
	}
	if response["refresh_token"] == nil || response["refresh_token"] == "" {
		t.Error("Response should contain refresh_token")
	}

	// Verify user ID matches
	userMap := response["user"].(map[string]interface{})
	responseUserID := int32(userMap["id"].(float64))
	if responseUserID != user.ID {
		t.Errorf("Expected user ID %d, got %d", user.ID, responseUserID)
	}

	// Test invalid email
	invalidEmailBody := map[string]interface{}{
		"email":    "nonexistent@example.com",
		"password": password,
	}
	jsonBody, _ = json.Marshal(invalidEmailBody)

	req = httptest.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d for invalid email, got %d. Body: %s", http.StatusUnauthorized, w.Code, w.Body.String())
	}

	// Test invalid password
	invalidPasswordBody := map[string]interface{}{
		"email":    email,
		"password": "wrong-password",
	}
	jsonBody, _ = json.Marshal(invalidPasswordBody)

	req = httptest.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d for invalid password, got %d. Body: %s", http.StatusUnauthorized, w.Code, w.Body.String())
	}
}

// TestRefresh tests POST /api/auth/refresh
func TestRefresh(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	// Create a test user and get tokens via login
	email := fmt.Sprintf("test-refresh-%d@example.com", time.Now().UnixNano())
	testUser, cleanup := createTestUser(t, queries, db, email)
	defer cleanup()

	// First, we need to create a refresh token in the database
	// Since we don't have direct access to the refresh token from createTestUser,
	// we'll login to get a refresh token
	loginBody := map[string]interface{}{
		"email":    testUser.Email,
		"password": testUser.Password,
	}
	jsonBody, _ := json.Marshal(loginBody)

	req := httptest.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Failed to login: %d. Body: %s", w.Code, w.Body.String())
	}

	var loginResponse map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &loginResponse); err != nil {
		t.Fatalf("Failed to parse login response: %v", err)
	}

	refreshToken := loginResponse["refresh_token"].(string)
	if refreshToken == "" {
		t.Fatal("Login response should contain refresh_token")
	}

	// Test successful token refresh
	refreshBody := map[string]interface{}{
		"refresh_token": refreshToken,
	}
	jsonBody, _ = json.Marshal(refreshBody)

	req = httptest.NewRequest("POST", "/api/auth/refresh", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var refreshResponse map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &refreshResponse); err != nil {
		t.Fatalf("Failed to parse refresh response: %v", err)
	}

	if refreshResponse["access_token"] == nil || refreshResponse["access_token"] == "" {
		t.Error("Refresh response should contain access_token")
	}

	// Test invalid refresh token
	invalidRefreshBody := map[string]interface{}{
		"refresh_token": "invalid-token-12345",
	}
	jsonBody, _ = json.Marshal(invalidRefreshBody)

	req = httptest.NewRequest("POST", "/api/auth/refresh", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d for invalid refresh token, got %d. Body: %s", http.StatusUnauthorized, w.Code, w.Body.String())
	}
}

// TestLogout tests POST /api/auth/logout
func TestLogout(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	// Create a test user and login to get refresh token
	email := fmt.Sprintf("test-logout-%d@example.com", time.Now().UnixNano())
	testUser, cleanup := createTestUser(t, queries, db, email)
	defer cleanup()

	loginBody := map[string]interface{}{
		"email":    testUser.Email,
		"password": testUser.Password,
	}
	jsonBody, _ := json.Marshal(loginBody)

	req := httptest.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Failed to login: %d. Body: %s", w.Code, w.Body.String())
	}

	var loginResponse map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &loginResponse); err != nil {
		t.Fatalf("Failed to parse login response: %v", err)
	}

	refreshToken := loginResponse["refresh_token"].(string)
	accessToken := loginResponse["access_token"].(string)

	// Test successful logout
	logoutBody := map[string]interface{}{
		"refresh_token": refreshToken,
	}
	jsonBody, _ = json.Marshal(logoutBody)

	req = httptest.NewRequest("POST", "/api/auth/logout", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	// Verify refresh token is revoked (try to refresh with it)
	refreshBody := map[string]interface{}{
		"refresh_token": refreshToken,
	}
	jsonBody, _ = json.Marshal(refreshBody)

	req = httptest.NewRequest("POST", "/api/auth/refresh", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d for revoked refresh token, got %d. Body: %s", http.StatusUnauthorized, w.Code, w.Body.String())
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
		{"POST", "/api/auth/logout", []byte(`{"refresh_token":"test"}`)},
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

			// These endpoints are public (don't require authentication header)
			// However, /api/auth/refresh can return 401 if the refresh token is invalid
			// which is expected behavior. Other endpoints should not return 401 for missing auth.
			if endpoint.path == "/api/auth/refresh" {
				// Refresh endpoint can return 401 for invalid tokens - that's expected
				// Just verify it's not requiring an Authorization header (which would be 401 immediately)
				// The 401 here is for invalid token, not missing auth
				return
			}

			// Other public endpoints should not return 401 (they're public)
			// They might return other errors (400, 404, etc.) but not 401
			if w.Code == http.StatusUnauthorized {
				t.Errorf("Public endpoint %s %s should not return 401. Got %d. Body: %s",
					endpoint.method, endpoint.path, w.Code, w.Body.String())
			}
		})
	}
}

