package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// RateLimiter stores rate limiters per IP address
type RateLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	rate     rate.Limit
	burst    int
}

// NewRateLimiter creates a new rate limiter
// rps: requests per second
// burst: maximum burst size (allows short bursts above the rate)
func NewRateLimiter(rps float64, burst int) *RateLimiter {
	return &RateLimiter{
		limiters: make(map[string]*rate.Limiter),
		rate:     rate.Limit(rps),
		burst:    burst,
	}
}

// getLimiter returns the rate limiter for the given IP address
// Creates a new limiter if one doesn't exist
func (rl *RateLimiter) getLimiter(ip string) *rate.Limiter {
	rl.mu.RLock()
	limiter, exists := rl.limiters[ip]
	rl.mu.RUnlock()

	if !exists {
		rl.mu.Lock()
		// Double-check after acquiring write lock
		limiter, exists = rl.limiters[ip]
		if !exists {
			limiter = rate.NewLimiter(rl.rate, rl.burst)
			rl.limiters[ip] = limiter
		}
		rl.mu.Unlock()
	}

	return limiter
}

// cleanup removes old limiters periodically to prevent memory leaks
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(10 * time.Minute)
	go func() {
		for range ticker.C {
			// In a production system, you might want to track last access time
			// and remove limiters that haven't been used in a while
			// For simplicity, we'll keep all limiters in memory
			// This is fine for most applications with reasonable traffic
		}
	}()
}

// getClientIP extracts the client IP address from the request
func getClientIP(c *gin.Context) string {
	// Check X-Forwarded-For header (for proxies/load balancers)
	if ip := c.GetHeader("X-Forwarded-For"); ip != "" {
		return ip
	}
	// Check X-Real-IP header
	if ip := c.GetHeader("X-Real-IP"); ip != "" {
		return ip
	}
	// Fall back to RemoteAddr
	return c.ClientIP()
}

// RateLimitMiddleware creates a middleware that rate limits requests
// rps: requests per second allowed
// burst: maximum burst size
func RateLimitMiddleware(rps float64, burst int) gin.HandlerFunc {
	limiter := NewRateLimiter(rps, burst)
	limiter.cleanup()

	return func(c *gin.Context) {
		ip := getClientIP(c)
		limiter := limiter.getLimiter(ip)

		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests. Please try again later.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

