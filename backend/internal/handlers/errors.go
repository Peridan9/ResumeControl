package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// ErrorResponse represents a standardized error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Details string `json:"details,omitempty"`
}

// sendError sends a standardized error response
func sendError(c *gin.Context, statusCode int, errorMsg string, details ...string) {
	response := ErrorResponse{
		Error: errorMsg,
	}

	if len(details) > 0 && details[0] != "" {
		response.Details = details[0]
	}

	// Log error for debugging (except 4xx client errors)
	if statusCode >= 500 {
		log.Printf("ERROR [%d]: %s - %s", statusCode, errorMsg, response.Details)
	}

	c.JSON(statusCode, response)
}

// sendBadRequest sends a 400 Bad Request error
func sendBadRequest(c *gin.Context, message string, details ...string) {
	sendError(c, http.StatusBadRequest, message, details...)
}

// sendNotFound sends a 404 Not Found error
func sendNotFound(c *gin.Context, resource string) {
	sendError(c, http.StatusNotFound, resource+" not found")
}

// sendInternalError sends a 500 Internal Server Error
func sendInternalError(c *gin.Context, message string, err error) {
	details := ""
	if err != nil {
		details = err.Error()
	}
	sendError(c, http.StatusInternalServerError, message, details)
}

// handleDatabaseError handles common database errors and returns appropriate HTTP status
func handleDatabaseError(c *gin.Context, err error, resource string) bool {
	if err == nil {
		return false
	}

	if err == sql.ErrNoRows {
		sendNotFound(c, resource)
		return true
	}

	// Check for common database constraint errors
	errStr := strings.ToLower(err.Error())
	if strings.Contains(errStr, "duplicate") || strings.Contains(errStr, "unique") {
		sendBadRequest(c, "Resource already exists", err.Error())
		return true
	}

	if strings.Contains(errStr, "foreign key") || strings.Contains(errStr, "constraint") {
		sendBadRequest(c, "Invalid reference", err.Error())
		return true
	}

	// Generic database error
	sendInternalError(c, "Database operation failed", err)
	return true
}

