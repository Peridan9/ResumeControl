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
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCreateContact(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	tests := []struct {
		name           string
		body           map[string]interface{}
		expectedStatus int
		validateFunc   func(*testing.T, *httptest.ResponseRecorder)
	}{
		{
			name: "Create contact with all fields",
			body: map[string]interface{}{
				"name":     "John Doe",
				"email":    "john@example.com",
				"phone":    "+1234567890",
				"linkedin": "https://linkedin.com/in/johndoe",
			},
			expectedStatus: http.StatusCreated,
			validateFunc: func(t *testing.T, w *httptest.ResponseRecorder) {
				var contact database.Contact
				err := json.Unmarshal(w.Body.Bytes(), &contact)
				require.NoError(t, err)
				assert.Equal(t, "John Doe", contact.Name)
				assert.True(t, contact.Email.Valid)
				assert.Equal(t, "john@example.com", contact.Email.String)
				assert.True(t, contact.Phone.Valid)
				assert.Equal(t, "+1234567890", contact.Phone.String)
				assert.True(t, contact.Linkedin.Valid)
				assert.Equal(t, "https://linkedin.com/in/johndoe", contact.Linkedin.String)
			},
		},
		{
			name: "Create contact with only name",
			body: map[string]interface{}{
				"name": "Jane Smith",
			},
			expectedStatus: http.StatusCreated,
			validateFunc: func(t *testing.T, w *httptest.ResponseRecorder) {
				var contact database.Contact
				err := json.Unmarshal(w.Body.Bytes(), &contact)
				require.NoError(t, err)
				assert.Equal(t, "Jane Smith", contact.Name)
				assert.False(t, contact.Email.Valid)
				assert.False(t, contact.Phone.Valid)
				assert.False(t, contact.Linkedin.Valid)
			},
		},
		{
			name: "Create contact with missing name",
			body: map[string]interface{}{
				"email": "test@example.com",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Create contact with empty body",
			body:           map[string]interface{}{},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.body)
			req := httptest.NewRequest("POST", "/api/contacts", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			if tt.validateFunc != nil {
				tt.validateFunc(t, w)
				// Cleanup created contact
				if w.Code == http.StatusCreated {
					var contact database.Contact
					if err := json.Unmarshal(w.Body.Bytes(), &contact); err == nil {
						queries.DeleteContact(ctx, contact.ID)
					}
				}
			}
		})
	}
}

func TestGetAllContacts(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test contacts
	contact1, err := queries.CreateContact(ctx, database.CreateContactParams{
		Name:  "John Doe",
		Email: sql.NullString{String: "john@example.com", Valid: true},
	})
	require.NoError(t, err)

	contact2, err := queries.CreateContact(ctx, database.CreateContactParams{
		Name:  "Jane Smith",
		Phone: sql.NullString{String: "+1234567890", Valid: true},
	})
	require.NoError(t, err)
	defer queries.DeleteContact(ctx, contact1.ID)
	defer queries.DeleteContact(ctx, contact2.ID)

	req := httptest.NewRequest("GET", "/api/contacts", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var contacts []database.Contact
	err = json.Unmarshal(w.Body.Bytes(), &contacts)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(contacts), 2)
	// Verify our contacts are in the list
	found1, found2 := false, false
	for _, c := range contacts {
		if c.ID == contact1.ID {
			found1 = true
		}
		if c.ID == contact2.ID {
			found2 = true
		}
	}
	assert.True(t, found1, "Contact1 should be in the list")
	assert.True(t, found2, "Contact2 should be in the list")
}

func TestGetContactByID(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test contact
	contact, err := queries.CreateContact(ctx, database.CreateContactParams{
		Name:  "John Doe",
		Email: sql.NullString{String: "john@example.com", Valid: true},
	})
	require.NoError(t, err)
	defer queries.DeleteContact(ctx, contact.ID)

	tests := []struct {
		name           string
		contactID      string
		expectedStatus int
		validateFunc   func(*testing.T, *httptest.ResponseRecorder)
	}{
		{
			name:           "Get existing contact",
			contactID:      strconv.Itoa(int(contact.ID)),
			expectedStatus: http.StatusOK,
			validateFunc: func(t *testing.T, w *httptest.ResponseRecorder) {
				var result database.Contact
				err := json.Unmarshal(w.Body.Bytes(), &result)
				require.NoError(t, err)
				assert.Equal(t, contact.ID, result.ID)
				assert.Equal(t, "John Doe", result.Name)
			},
		},
		{
			name:           "Get non-existent contact",
			contactID:      "99999",
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "Get contact with invalid ID",
			contactID:      "invalid",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/contacts/"+tt.contactID, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			if tt.validateFunc != nil {
				tt.validateFunc(t, w)
			}
		})
	}
}

func TestUpdateContact(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	// Create test contact
	contact, err := queries.CreateContact(ctx, database.CreateContactParams{
		Name:  "John Doe",
		Email: sql.NullString{String: "john@example.com", Valid: true},
	})
	require.NoError(t, err)
	defer queries.DeleteContact(ctx, contact.ID)

	tests := []struct {
		name           string
		contactID      string
		body           map[string]interface{}
		expectedStatus int
		validateFunc   func(*testing.T, *httptest.ResponseRecorder)
	}{
		{
			name:      "Update contact with all fields",
			contactID: strconv.Itoa(int(contact.ID)),
			body: map[string]interface{}{
				"name":     "John Updated",
				"email":    "john.updated@example.com",
				"phone":    "+9876543210",
				"linkedin": "https://linkedin.com/in/johnupdated",
			},
			expectedStatus: http.StatusOK,
			validateFunc: func(t *testing.T, w *httptest.ResponseRecorder) {
				var result database.Contact
				err := json.Unmarshal(w.Body.Bytes(), &result)
				require.NoError(t, err)
				assert.Equal(t, "John Updated", result.Name)
				assert.True(t, result.Email.Valid)
				assert.Equal(t, "john.updated@example.com", result.Email.String)
				assert.True(t, result.Phone.Valid)
				assert.Equal(t, "+9876543210", result.Phone.String)
			},
		},
		{
			name:      "Update contact with missing name",
			contactID: strconv.Itoa(int(contact.ID)),
			body: map[string]interface{}{
				"email": "test@example.com",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Update non-existent contact",
			contactID:      "99999",
			body:           map[string]interface{}{"name": "Test"},
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.body)
			req := httptest.NewRequest("PUT", "/api/contacts/"+tt.contactID, bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			if tt.validateFunc != nil {
				tt.validateFunc(t, w)
			}
		})
	}
}

func TestDeleteContact(t *testing.T) {
	router, queries, db := setupTestRouter(t)
	defer db.Close()

	ctx := context.Background()

	tests := []struct {
		name           string
		setupFunc      func() int32
		contactID      string
		expectedStatus int
	}{
		{
			name: "Delete existing contact",
			setupFunc: func() int32 {
				contact, err := queries.CreateContact(ctx, database.CreateContactParams{
					Name: "John Doe",
				})
				require.NoError(t, err)
				return contact.ID
			},
			contactID:      "", // Will be set in test
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Delete non-existent contact",
			contactID:      "99999",
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "Delete contact with invalid ID",
			contactID:      "invalid",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var contactID int32
			if tt.setupFunc != nil {
				contactID = tt.setupFunc()
				tt.contactID = strconv.Itoa(int(contactID))
			}

			req := httptest.NewRequest("DELETE", "/api/contacts/"+tt.contactID, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			// Verify deletion for successful case
			if tt.expectedStatus == http.StatusOK && tt.setupFunc != nil {
				_, err := queries.GetContactByID(ctx, contactID)
				assert.Error(t, err) // Should not exist
			}
		})
	}
}

