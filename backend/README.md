# ResumeControl Backend

Go backend API for ResumeControl application - built from the bottom up for learning.

## Tech Stack

- **Language:** Go 1.21+
- **Framework:** Gin (web framework)
- **Database:** PostgreSQL
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

2. **Set up environment (optional):**
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults work fine for now)
   ```

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
