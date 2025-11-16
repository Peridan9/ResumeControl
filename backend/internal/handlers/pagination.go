package handlers

import (
	"math"
	"strconv"

	"github.com/gin-gonic/gin"
)

const (
	// DefaultPageSize is the default number of items per page
	DefaultPageSize = 10
	// MaxPageSize is the maximum number of items per page
	MaxPageSize = 100
	// DefaultPage is the default page number
	DefaultPage = 1
)

// PaginationParams holds pagination query parameters
type PaginationParams struct {
	Page  int32
	Limit int32
}

// PaginationMeta contains pagination metadata
type PaginationMeta struct {
	Page       int32 `json:"page"`
	Limit      int32 `json:"limit"`
	TotalCount int64 `json:"total_count"`
	TotalPages int32 `json:"total_pages"`
}

// PaginatedResponse wraps data with pagination metadata
type PaginatedResponse struct {
	Data []interface{}   `json:"data"`
	Meta PaginationMeta  `json:"meta"`
}

// ParsePaginationParams parses page and limit from query parameters
// Returns default values if not provided or invalid
func ParsePaginationParams(c *gin.Context) PaginationParams {
	page := DefaultPage
	limit := DefaultPageSize

	// Parse page parameter
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	// Parse limit parameter
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
			// Enforce maximum limit
			if limit > MaxPageSize {
				limit = MaxPageSize
			}
		}
	}

	return PaginationParams{
		Page:  int32(page),
		Limit: int32(limit),
	}
}

// CalculateOffset calculates the offset for SQL queries
func CalculateOffset(page, limit int32) int32 {
	if page < 1 {
		page = 1
	}
	return (page - 1) * limit
}

// CalculateTotalPages calculates the total number of pages
func CalculateTotalPages(totalCount int64, limit int32) int32 {
	if limit <= 0 {
		return 1
	}
	return int32(math.Ceil(float64(totalCount) / float64(limit)))
}

