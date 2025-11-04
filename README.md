# ResumeControl

A job application management system to track job applications, manage resumes, and tailor resumes to specific job descriptions.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS (to be built)
- **Backend:** Go + Gin (web framework)
- **Database:** PostgreSQL
- **Migrations:** goose
- **Query Tool:** sqlc (SQL-first, type-safe)

## Getting Started

### Prerequisites

- Go 1.21 or later
- PostgreSQL 14+ 
- Node.js 18+ (for frontend, when ready)
- npm or yarn (for frontend, when ready)

### Backend Setup (Go)

1. Navigate to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
go mod download
```

3. (Optional) Set up environment:
```bash
cp .env.example .env
# Edit .env if needed (defaults work for Phase 1)
```

4. Start the development server:
```bash
go run main.go
```

The backend API will run on `http://localhost:8080`

5. Test the health endpoint:
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

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
ResumeControl/
├── backend/
│   ├── main.go                      # Application entry point (everything starts here)
│   ├── go.mod                       # Go module and dependencies
│   ├── .env.example                 # Environment template
│   ├── .gitignore                   # Git ignore rules
│   ├── README.md                    # Backend documentation
│   │
│   ├── migrations/                  # Database migrations (goose) - added in Phase 2
│   ├── sql/
│   │   └── queries/                 # SQL queries for sqlc - added in Phase 4
│   └── internal/
│       └── database/                # sqlc generated code - added in Phase 4
├── frontend/                        # (To be built later)
├── TODO.md                          # Step-by-step implementation guide
└── README.md                        # This file
```

**Note:** Structure grows as we add features. We start simple and add folders only when needed.

## Features

### Phase 1: Job Application Tracking (In Progress)
- ⏳ Company management (CRUD)
- ⏳ Job management (CRUD)
- ⏳ Application tracking (CRUD)
- ⏳ Dashboard with statistics
- ⏳ Filtering and sorting

**See TODO.md for detailed implementation steps**

### Phase 2: Resume Management (Planned)
- Resume upload and storage
- Resume-text extraction
- Link resumes to applications

### Phase 3: AI-Powered Resume Tailoring (Planned)
- Job description analysis
- Resume-to-job matching
- AI-powered tailoring suggestions
- Project recommendations

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job
- `GET /api/applications` - List applications
- `POST /api/applications` - Create application
- `GET /api/applications/stats` - Get statistics

## License

ISC