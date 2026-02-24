package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwks"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/peridan9/resumecontrol/backend/internal/database"
	"github.com/peridan9/resumecontrol/backend/internal/handlers"
	_ "github.com/lib/pq" // PostgreSQL driver (imported for side effects)
)

func main() {
	// Load environment variables from .env file
	// If .env doesn't exist, we'll use environment variables from the system
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Get database URL from environment
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	// Connect to database
	log.Println("🔌 Connecting to database...")
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("❌ Failed to open database connection: %v", err)
	}
	defer db.Close() // Close connection when main function exits

	// Configure connection pool settings
	// Optimized for RDS and production workloads
	// Get environment to adjust pool settings accordingly
	env := os.Getenv("ENV")
	if env == "production" {
		db.SetMaxOpenConns(25)              // Higher for RDS production workloads
		db.SetMaxIdleConns(5)               // Maintain some idle connections for performance
	} else {
		db.SetMaxOpenConns(10)              // Lower for dev/staging
		db.SetMaxIdleConns(2)               // Minimal idle connections
	}
	db.SetConnMaxIdleTime(5 * time.Minute)  // Close idle connections reasonably
	db.SetConnMaxLifetime(30 * time.Minute) // Reasonable upper bound to prevent stale connections

	// Test the connection with timeout to handle potential latency gracefully
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("❌ Failed to ping database: %v (check RDS security groups, credentials, and connectivity)", err)
	}
	log.Println("✅ Successfully connected to database!")

	// Initialize Clerk (for JWT verification and user resolution)
	clerkSecret := os.Getenv("CLERK_SECRET_KEY")
	if clerkSecret == "" {
		log.Fatal("CLERK_SECRET_KEY environment variable is not set")
	}
	clerk.SetKey(clerkSecret)
	clerkJWKS := jwks.NewClient(&clerk.ClientConfig{}) // uses key from clerk.SetKey()
	log.Println("✅ Clerk authentication initialized!")

	// Set Gin mode based on environment
	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create sqlc queries instance
	queries := database.New(db)

	// Initialize Gin router with default middleware (logger and recovery)
	r := gin.Default()

	// Configure CORS middleware
	// Allow frontend origin (default: http://localhost:3000)
	// Can be overridden with FRONTEND_URL environment variable
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	// In development, allow all origins to support different browsers/IDEs (like Cursor's browser)
	// In production, use specific origins for security
	corsConfig := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization", "accept", "origin", "Cache-Control", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		MaxAge:           12 * time.Hour,
	}

	if env == "production" {
		// Production: only allow specific frontend URL with credentials
		corsConfig.AllowOrigins = []string{frontendURL}
		corsConfig.AllowCredentials = true
	} else {
		// Development: allow all origins (including Cursor's browser, Chrome, etc.)
		// Use AllowOriginFunc to dynamically allow any origin in development
		corsConfig.AllowOriginFunc = func(origin string) bool {
			// Log the origin for debugging (can be removed later)
			if origin != "" {
				log.Printf("CORS: Allowing origin: %s", origin)
			} else {
				log.Printf("CORS: Allowing empty origin (likely Cursor browser or similar)")
			}
			// Allow all origins in development
			return true
		}
		corsConfig.AllowCredentials = true
	}

	r.Use(cors.New(corsConfig))

	// Health check endpoint (now includes DB status)
	// Support both GET and HEAD methods for health checks
	healthHandler := func(c *gin.Context) {
		// Use lightweight query with timeout for better cold start handling
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		var result int
		if err := db.QueryRowContext(ctx, "SELECT 1").Scan(&result); err != nil {
			c.JSON(500, gin.H{
				"status":  "error",
				"message": "Database connection failed",
				"error":   err.Error(),
			})
			return
		}

		c.JSON(200, gin.H{
			"status":   "ok",
			"message":  "ResumeControl API is running",
			"database": "connected",
		})
	}
	r.GET("/api/health", healthHandler)
	r.HEAD("/api/health", healthHandler)

	// Initialize handlers config and setup routes
	cfg := handlers.Config{
		DB:         queries,
		ClerkJWKS:  clerkJWKS,
	}
	cfg.SetupRoutes(r)

	// Get port from environment variable or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start the HTTP server
	log.Printf("🚀 Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
		os.Exit(1)
	}
}

