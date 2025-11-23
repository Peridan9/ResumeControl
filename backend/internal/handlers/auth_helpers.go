package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// getUserIDFromContext extracts user_id from Gin context
// Returns (userID, true) if found, (0, false) if not authenticated
func getUserIDFromContext(c *gin.Context) (int32, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}

	// Type assertion
	userIDInt32, ok := userID.(int32)
	if !ok {
		return 0, false
	}

	return userIDInt32, true
}

// requireAuth is a helper that checks authentication and returns early if not authenticated
// Returns true if user is authenticated, false otherwise (and sends error response)
func requireAuth(c *gin.Context) (int32, bool) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		sendError(c, http.StatusUnauthorized, "User not authenticated")
		return 0, false
	}
	return userID, true
}

