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

## Phase 2: Add Database Connection ✅ (PARTIALLY COMPLETE)

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
- [ ] Run migration
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

## Phase 3: Write Raw SQL Queries in main.go ⏳

**Goal:** Write SQL queries directly in code to understand what we need

- [ ] Add helper functions in `main.go` for database queries
  - [ ] `getAllCompanies(db)` - SELECT all companies
  - [ ] `getCompanyByID(db, id)` - SELECT one company
  - [ ] `createCompany(db, company)` - INSERT company (with name normalization)
  - [ ] `updateCompany(db, id, company)` - UPDATE company (with name normalization)
  - [ ] `deleteCompany(db, id)` - DELETE company
  - [ ] **Note:** Company name normalization (handle "Google" vs "google" vs "GOOGLE") will be implemented in the backend when creating/updating companies
- [ ] Create HTTP handlers in `main.go`
  - [ ] GET /api/companies
  - [ ] GET /api/companies/:id
  - [ ] POST /api/companies
  - [ ] PUT /api/companies/:id
  - [ ] DELETE /api/companies/:id
- [ ] Test all endpoints with Postman/curl
- [ ] Repeat for jobs and applications

**What You'll Learn:**
- Writing SQL in Go
- Using database/sql package
- Struct scanning (sql.Rows to Go structs)
- Error handling with databases

**Files to Modify:**
- `backend/main.go` - Add all queries and handlers

**Why This Phase:**
- See SQL queries in code (easier to understand)
- Understand what queries you actually need
- Learn database/sql before using sqlc

---

## Phase 4: Set Up sqlc for Type Safety ⏳ (IN PROGRESS)

**Goal:** Extract SQL to files and generate type-safe Go code

- [ ] Install sqlc CLI
  ```bash
  go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
  ```
- [x] Create `sqlc.yaml` configuration
- [x] Create SQL queries with sqlc annotations:
  - [x] `sql/queries/companies.sql` - CRUD operations for companies
  - [x] `sql/queries/jobs.sql` - CRUD operations for jobs
  - [x] `sql/queries/applications.sql` - CRUD operations for applications
- [ ] Generate Go code:
  ```bash
  sqlc generate
  ```
- [ ] Update `main.go` to use generated code
  - [ ] Replace raw SQL with generated functions
  - [ ] Use generated types

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

## Phase 5: Extract Handlers (if main.go gets too large) ⏳

**Goal:** Extract handler functions when main.go becomes hard to read

**Only do this if:** main.go is getting too long (>300 lines) or hard to navigate

- [ ] Create `internal/handler/companies.go`
- [ ] Move company handlers to separate file
- [ ] Create `internal/handler/jobs.go`
- [ ] Create `internal/handler/applications.go`
- [ ] Update `main.go` to import and use handlers

**What You'll Learn:**
- Code organization
- Package structure
- When to extract code

**Files to Create:**
- `backend/internal/handler/companies.go`
- `backend/internal/handler/jobs.go`
- `backend/internal/handler/applications.go`

---

## Phase 6: Add Services (only if needed) ⏳

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
