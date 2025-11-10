# ResumeControl - Go Backend Implementation TODO

## Learning Path: Bottom-Up Approach 🏗️

**Philosophy:** Start simple, add complexity only when needed. Understand each component before moving to the next.

**Tech Stack:**
- Backend: Go + Gin (web framework)
- Database: PostgreSQL
- Migrations: goose
- Query Tool: sqlc (SQL-first, type-safe)
- Frontend: React + TypeScript (to be built after backend)

---

## Phase 1: Minimal Server ✅ (COMPLETE)

**Goal:** Get a simple server running with everything in one file

- [x] Create `main.go` in root (simple structure)
- [x] Add Gin dependency
- [x] Create health check endpoint
- [x] Set up basic server startup
- [x] Test that server runs

**Files Created:**
- `backend/main.go` - Everything in one file for now
- `backend/.env.example` - Environment template

**What You Learned:**
- Go package structure (`package main`)
- Gin router basics (`gin.Default()`, `r.GET()`, `r.Run()`)
- Simple HTTP handlers
- Environment variable loading with godotenv

**Test It:**
```bash
cd backend
go run main.go
# In another terminal:
curl http://localhost:8080/api/health
```

---

## Phase 2: Add Database Connection ✅ (COMPLETE)

**Goal:** Connect to PostgreSQL and set up migrations

- [x] Install PostgreSQL (if not already installed)
- [x] Create database
  ```bash
  createdb resumecontrol
  ```
- [x] Add database driver to go.mod
  ```bash
  go get github.com/lib/pq
  ```
- [x] Add database connection code to `main.go`
  - [x] Add DB_URL to `.env.example`
  - [x] Connect to database in `main.go`
  - [x] Test connection works
- [x] Create test file with database connection tests
  - [x] TestDatabaseConnection test
  - [x] TestHealthEndpoint test
- [x] Install goose
  ```bash
  go install github.com/pressly/goose/v3/cmd/goose@latest
  ```
- [x] Create first migration
  - [x] Create `sql/schema/` directory
  - [x] Create separate migration files for each table (combined up/down):
    - [x] `001_companies.sql` (with `-- +goose Up` and `-- +goose Down` sections)
    - [x] `002_jobs.sql` (with `-- +goose Up` and `-- +goose Down` sections)
    - [x] `003_applications.sql` (with `-- +goose Up` and `-- +goose Down` sections)
  - [x] Add goose tags (`-- +goose Up` and `-- +goose Down`)
  - [x] Add case-insensitive unique index for company names
- [x] Run migration
  ```bash
  goose -dir sql/schema postgres "$DB_URL" up
  ```

**What You'll Learn:**
- Database connection in Go
- Environment variables for secrets
- Database migrations with goose
- SQL schema design

**Files Created:**
- `backend/sql/schema/001_companies.sql` (combined up/down)
- `backend/sql/schema/002_jobs.sql` (combined up/down)
- `backend/sql/schema/003_applications.sql` (combined up/down)

**Files to Modify:**
- `backend/main.go` - Add database connection
- `backend/.env.example` - Add DB_URL

---

## Phase 3: Create HTTP Handlers ✅ (COMPLETE)

**Goal:** Create HTTP handlers using sqlc generated code

- [x] Create `internal/handlers` directory
- [x] Create `internal/handlers/companies.go` with CompanyHandler struct
- [x] Implement company name normalization (trim, lowercase, smart capitalization)
- [x] Create HTTP handlers for companies:
  - [x] GET /api/companies - GetAllCompanies
  - [x] GET /api/companies/:id - GetCompanyByID
  - [x] POST /api/companies - CreateCompany (with normalization)
  - [x] PUT /api/companies/:id - UpdateCompany (with normalization)
  - [x] DELETE /api/companies/:id - DeleteCompany
- [x] Update `main.go` to use handlers
- [x] Register routes in `main.go`
- [x] Create centralized route configuration (`internal/handlers/config.go`)
- [x] Test all endpoints with automated tests

**What You Learned:**
- Handler pattern in Go/Gin
- Using sqlc generated code in handlers
- Request/response handling (JSON parsing, validation)
- Error handling and HTTP status codes
- Company name normalization logic

**Files Created:**
- `backend/internal/handlers/companies.go` - Company handlers

**Files Modified:**
- `backend/main.go` - Added handler initialization and routes

---

## Phase 4: Set Up sqlc for Type Safety ✅ (COMPLETE)

**Goal:** Extract SQL to files and generate type-safe Go code

- [x] Install sqlc CLI
  ```bash
  go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
  ```
- [x] Create `sqlc.yaml` configuration
- [x] Create SQL queries with sqlc annotations:
  - [x] `sql/queries/companies.sql` - CRUD operations for companies
  - [x] `sql/queries/jobs.sql` - CRUD operations for jobs
  - [x] `sql/queries/applications.sql` - CRUD operations for applications
- [x] Generate Go code:
  ```bash
  sqlc generate
  ```
- [x] Update `main.go` to use generated code
  - [x] Create queries instance with `database.New(db)`
  - [x] Use generated types in handlers
  - [x] Create test file to verify sqlc code works

**What You'll Learn:**
- sqlc workflow (SQL → Go code)
- Type-safe database access
- Generated code structure

**Files to Create:**
- `backend/sqlc.yaml`
- `backend/sql/queries/companies.sql`
- `backend/sql/queries/jobs.sql`
- `backend/sql/queries/applications.sql`

**Files Generated (by sqlc):**
- `backend/internal/database/models.go`
- `backend/internal/database/companies.sql.go`
- etc.

---

## Phase 5: Create Handlers for Jobs and Applications ✅ (COMPLETE)

**Goal:** Create HTTP handlers for jobs and applications (similar to companies)

**Note:** Handlers are already extracted to `internal/handlers/` directory (done in Phase 3)

- [x] Create `internal/handlers/jobs.go` with JobHandler struct
  - [x] GET /api/jobs - GetAllJobs
  - [x] GET /api/jobs/:id - GetJobByID
  - [x] GET /api/companies/:id/jobs - GetJobsByCompanyID (nested route)
  - [x] POST /api/jobs - CreateJob
  - [x] PUT /api/jobs/:id - UpdateJob
  - [x] DELETE /api/jobs/:id - DeleteJob
- [x] Create `internal/handlers/applications.go` with ApplicationHandler struct
  - [x] GET /api/applications - GetAllApplications
  - [x] GET /api/applications/:id - GetApplicationByID
  - [x] GET /api/jobs/:id/applications - GetApplicationsByJobID (nested route)
  - [x] GET /api/applications?status=applied - Filter by status (query parameter)
  - [x] POST /api/applications - CreateApplication
  - [x] PUT /api/applications/:id - UpdateApplication
  - [x] DELETE /api/applications/:id - DeleteApplication
- [x] Register routes in `internal/handlers/config.go`
- [x] Create comprehensive automated tests for all handlers
  - [x] `companies_test.go` - Company handler tests
  - [x] `jobs_test.go` - Job handler tests
  - [x] `applications_test.go` - Application handler tests
  - [x] `test_helpers.go` - Shared test setup

**What You Learned:**
- Repeating patterns for different resources
- Relationship handling (company → jobs, job → applications)
- Query parameter filtering
- Nested routes in Gin
- Route parameter naming consistency
- Comprehensive test coverage

**Files Created:**
- `backend/internal/handlers/jobs.go` - Job handlers
- `backend/internal/handlers/applications.go` - Application handlers
- `backend/internal/handlers/config.go` - Centralized route configuration
- `backend/internal/handlers/companies_test.go` - Company tests
- `backend/internal/handlers/jobs_test.go` - Job tests
- `backend/internal/handlers/applications_test.go` - Application tests
- `backend/internal/handlers/test_helpers.go` - Test utilities

---

## Phase 6: Backend Polish & Production Readiness ⏳

**Goal:** Add essential middleware and improvements for frontend integration and production use

- [ ] Add CORS middleware for frontend integration
  - [ ] Install CORS package: `go get github.com/gin-contrib/cors`
  - [ ] Configure CORS in `main.go` to allow frontend origin
  - [ ] Test CORS headers in responses
- [ ] Add request validation middleware
  - [ ] Validate request body sizes
  - [ ] Add rate limiting (optional, for production)
- [ ] Improve error handling
  - [ ] Create consistent error response format
  - [ ] Add error logging middleware
  - [ ] Handle panics gracefully
- [ ] Add logging
  - [ ] Structured logging (e.g., using `logrus` or `zap`)
  - [ ] Request/response logging middleware
  - [ ] Log database query errors
- [ ] Add API documentation
  - [ ] Consider Swagger/OpenAPI documentation
  - [ ] Document all endpoints with examples
- [ ] Add pagination for list endpoints
  - [ ] Add `?page=1&limit=10` query parameters
  - [ ] Update GET endpoints to support pagination
  - [ ] Return pagination metadata in responses
- [ ] Add search/filtering capabilities
  - [ ] Search companies by name
  - [ ] Filter jobs by company, location, etc.
  - [ ] Advanced filtering for applications

**What You'll Learn:**
- Middleware in Gin
- CORS configuration
- Error handling patterns
- Logging best practices
- API pagination
- Search and filtering

**Optional Enhancements:**
- [ ] Add request ID middleware for tracing
- [ ] Add health check with database status
- [ ] Add metrics/monitoring endpoints
- [ ] Add graceful shutdown handling

---

## Phase 7: Add Services (only if needed) ⏳

**Goal:** Extract business logic if handlers get too complex

**Only do this if:** Handlers contain complex business logic

- [ ] Create `internal/service/` directory
- [ ] Move business logic from handlers to services
- [ ] Handlers become thin - just HTTP handling
- [ ] Services contain business logic

**What You'll Learn:**
- Service layer pattern
- Separation of concerns
- Dependency injection

---

## Quick Reference

### Go Concepts Used:
- `package main` - Executable entry point
- `func main()` - Application starts here
- `import` - Package imports
- Structs - Data structures
- Pointers - `*` for references

### Gin Concepts:
- `gin.Default()` - Create router with middleware
- `r.GET(path, handler)` - HTTP GET route
- `c.JSON(code, data)` - Return JSON response
- `c.Param("id")` - Get URL parameter
- `c.ShouldBindJSON(&struct)` - Parse JSON body

### Database Concepts:
- `sql.Open()` - Open database connection
- `db.Query()` - Execute SELECT queries
- `db.Exec()` - Execute INSERT/UPDATE/DELETE
- `rows.Scan()` - Read query results into variables

### goose Commands:
```bash
# Create new migration (future migrations)
goose -dir sql/schema create migration_name sql

# Apply migrations
goose -dir sql/schema postgres "$DB_URL" up

# Rollback one migration
goose -dir sql/schema postgres "$DB_URL" down

# Check migration status
goose -dir sql/schema postgres "$DB_URL" status
```

### sqlc Commands:
```bash
# Generate Go code from SQL
sqlc generate

# Validate SQL files
sqlc vet
```

---

## Status Legend

- ⏳ Not started
- 🔄 In progress  
- ✅ Completed

## Notes

- Test after each phase before moving to the next
- Don't skip ahead - understand each step
- If something is confusing, ask questions!
- Code includes comments to help learning
