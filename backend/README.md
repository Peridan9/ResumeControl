# ResumeControl Backend

Go backend API for ResumeControl application - built from the bottom up for learning.

## Tech Stack

- **Language:** Go 1.21+
- **Framework:** Gin (web framework)
- **Database:** PostgreSQL (Neon serverless)
- **Migrations:** goose (will be added in Phase 2)
- **Query Tool:** sqlc (will be added in Step 4)

## Philosophy

This project is built **bottom-up** - we start simple and add complexity only when needed:
1. **Phase 1:** Everything in `main.go` - simple and understandable
2. **Phase 2:** Add database connection
3. **Phase 3:** Add SQL queries directly in code
4. **Phase 4:** Extract to sqlc for type safety
5. **Phase 5:** Extract handlers when main.go gets large
6. **Phase 6:** Add services only if needed

## Setup

### Prerequisites
- Go 1.21 or later

### Installation

1. **Install dependencies:**
   ```bash
   go mod download
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and set NEON_DB_URL with your Neon database connection string
   ```
   
   Required environment variables:
   - `NEON_DB_URL` - Neon database connection string (should include `-pooler` for pooled connections)
   
   Optional environment variables:
   - `ENV` - Environment mode (`production` or dev/staging, affects connection pool settings)
   - `PORT` - Server port (default: 8080)
   - `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

3. **Run the server:**
   ```bash
   go run main.go
   ```

4. **Test the health endpoint:**
   ```bash
   curl http://localhost:8080/api/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "message": "ResumeControl API is running"
   }
   ```

## Current Status

✅ **Phase 1 Complete:** Minimal server with health endpoint
✅ **Database Connection:** Added and tested

- Simple `main.go` with everything in one file
- Health check endpoint working
- Database connection implemented
- Tests created for health endpoint and database connection

## Project Structure (Current)

```
backend/
├── main.go              # Main application code
├── main_test.go         # Tests for health endpoint and DB connection
├── go.mod               # Go module and dependencies
├── .env.example         # Environment template
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

As we progress, we'll add:
- `migrations/` - Database migrations (Phase 2)
- `sql/queries/` - SQL query files (Phase 4)
- `internal/database/` - sqlc generated code (Phase 4, auto-generated)
- `internal/handler/` - Extracted handlers (Phase 5, only if needed)

**Note:** We start with NO internal folders. We add them only when we actually need them!

## Development

### Running the server:
```bash
go run main.go
```

### Building:
```bash
go build -o resumecontrol main.go
./resumecontrol
```

### Testing:
```bash
# Make sure DB_URL is set in .env file or environment
# Run all tests:
go test ./...

# Run with verbose output:
go test -v ./...

# Run specific test:
go test -v -run TestDatabaseConnection
go test -v -run TestHealthEndpoint
```

**Note:** Tests require `DB_URL` environment variable. Create a `.env` file with your database connection string.

## Neon Database Configuration

This application is optimized for Neon serverless Postgres. The connection handling is configured to minimize compute unit (CU) costs by reducing idle connections and enabling scale-to-zero.

### Connection Pooling

The application uses Neon's pooled connection (via PgBouncer) by default. The `NEON_DB_URL` should contain `-pooler` in the endpoint URL.

**Pooled Connection (Default):**
- Used for all application traffic
- Supports up to ~10,000 client connections
- Multiplexes to fewer backend Postgres connections
- Optimized for cost and scalability

**Direct Connection (Optional):**
- Use `NEON_DB_URL_DIRECT` for migrations or admin tasks if needed
- Required for operations that need session state persistence
- Not recommended for regular application traffic

### Connection Pool Settings

The application automatically adjusts connection pool settings based on the `ENV` environment variable:

**Production (`ENV=production`):**
- `MaxOpenConns`: 15
- `MaxIdleConns`: 3
- `ConnMaxIdleTime`: 2 minutes
- `ConnMaxLifetime`: 30 minutes

**Development/Staging (default):**
- `MaxOpenConns`: 10
- `MaxIdleConns`: 2
- `ConnMaxIdleTime`: 2 minutes
- `ConnMaxLifetime`: 30 minutes

These settings are optimized to:
- Reduce idle connections (enables scale-to-zero)
- Minimize compute unit costs
- Handle cold starts gracefully with timeout contexts
- Prevent connection exhaustion

### Cold Start Handling

The application includes timeout contexts for database operations to handle Neon's scale-to-zero cold starts gracefully:
- Initial connection: 10-second timeout
- Health check: 5-second timeout
- Uses lightweight queries instead of blocking operations

### Migration Considerations

When running database migrations (using goose), you may need to use a direct connection string if your migrations require session state:
- Use `NEON_DB_URL_DIRECT` if available
- Or use a non-pooled connection string for migrations
- Regular application queries should always use the pooled connection

## API Endpoints

- `GET /api/health` - Health check (includes database connection status)

More endpoints coming as we build the application step by step!

## Tests

The project includes basic tests:
- `TestDatabaseConnection` - Tests database connectivity
- `TestHealthEndpoint` - Tests health endpoint with database check

Run tests with: `go test ./...`

## Learning Path

See `TODO.md` in the project root for detailed step-by-step guide.
