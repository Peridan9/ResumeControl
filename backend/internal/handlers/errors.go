package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// ErrorResponse represents a standardized error response
type ErrorResponse struct {
	Error   string            `json:"error"`
	Message string            `json:"message,omitempty"`
	Details string            `json:"details,omitempty"`
	Fields  map[string]string `json:"fields,omitempty"`
}

// ValidationErrorResponse represents a validation error response with field-specific errors
type ValidationErrorResponse struct {
	Error   string            `json:"error"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
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

// sendValidationError sends a 400 Bad Request error with field-specific validation errors
func sendValidationError(c *gin.Context, err error) {
	var fields map[string]string
	var message string
	var errorTitle string

	// Check if it's a validator.ValidationErrors
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		fields = make(map[string]string)
		message = "Validation failed"
		errorTitle = "Validation failed"

		for _, fieldError := range validationErrors {
			fieldName := fieldError.Field()
			// Convert field name to lowercase for consistency
			if len(fieldName) > 0 {
				fieldName = strings.ToLower(fieldName[:1]) + fieldName[1:]
			}

			// Create user-friendly error message
			var errorMsg string
			switch fieldError.Tag() {
			case "required":
				errorMsg = fieldName + " is required"
			case "email":
				errorMsg = fieldName + " must be a valid email address"
			case "url":
				errorMsg = fieldName + " must be a valid URL"
			case "min":
				errorMsg = fieldName + " must be at least " + fieldError.Param() + " characters"
			case "max":
				errorMsg = fieldName + " must be at most " + fieldError.Param() + " characters"
			case "oneof":
				errorMsg = fieldName + " must be one of: " + strings.ReplaceAll(fieldError.Param(), " ", ", ")
			case "datetime":
				errorMsg = fieldName + " must be in format " + fieldError.Param()
			default:
				errorMsg = fieldName + " is invalid"
			}

			fields[fieldName] = errorMsg
		}
	} else {
		// Fallback for non-validator errors
		message = "Invalid request body"
		errorTitle = "Invalid request"
		fields = map[string]string{
			"general": err.Error(),
		}
	}

	response := ValidationErrorResponse{
		Error:   errorTitle,
		Message: message,
		Fields:  fields,
	}

	c.JSON(http.StatusBadRequest, response)
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

