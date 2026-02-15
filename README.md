# ResumeControl

> ⚠️ **This project is still under development!**

A job application management system to track job applications, manage resumes, and tailor resumes to specific job descriptions.

## About

ResumeControl helps you organize your job search by tracking applications, managing company information, and storing contact details. The system provides a dashboard with statistics and filtering capabilities to keep your job search organized.

**Development:** This project is being developed in [Cursor](https://cursor.sh/) with tasks and problems tracked in [Linear](https://linear.app/).

See the [architecture diagram](https://peridan9.github.io/ResumeControl/architecture/) for a high-level system overview.


## Technologies

### Backend
- **Go 1.21+** - Programming language
- **Gin** - Web framework
- **PostgreSQL** - Database
- **sqlc** - SQL-first, type-safe query builder

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **React Query** - Data fetching

## Project Structure

```
ResumeControl/
├── backend/
│   ├── main.go                 # Application entry point
│   ├── go.mod                  # Go dependencies
│   ├── sql/
│   │   ├── schema/             # Database migrations
│   │   └── queries/            # SQL queries for sqlc
│   └── internal/
│       ├── database/           # sqlc generated code
│       └── handlers/           # API handlers
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── contexts/          # React contexts (AuthContext)
│   │   ├── pages/             # Page components
│   │   ├── services/           # API service layer
│   │   └── types/             # TypeScript types
│   └── package.json
└── README.md
```

## Environment Variables

### Backend

Create a `.env` file in the `backend/` directory:

```env
# Database connection (required)
DB_URL=postgres://username:password@localhost:5432/resumecontrol?sslmode=disable

# Server port (optional, defaults to 8080)
PORT=8080

# Environment (optional, set to "production" for production mode)
ENV=development

# Frontend URL for CORS (optional, defaults to http://localhost:3000)
FRONTEND_URL=http://localhost:3000

# Clerk (required for auth)
CLERK_SECRET_KEY=sk_test_...
```

### Frontend

Create a `.env` file in the `frontend/` directory (or set in your shell):

```env
# Clerk publishable key (required for sign-in/sign-up UI)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Get both keys from [Clerk Dashboard](https://dashboard.clerk.com) → your application → API Keys.

## Authentication

ResumeControl uses **Clerk** for sign-in and sign-up. The backend verifies Clerk session JWTs and maps to an internal user.

- **Sign-in / Sign-up**: Use `/sign-in` and `/sign-up` (Clerk-hosted UI). Legacy `/login` and `/register` redirect to these.
- **API auth**: The frontend sends the Clerk session token as `Authorization: Bearer <token>`; the backend verifies it and resolves to your app user.
- **Protected routes**: Unauthenticated users are redirected to `/sign-in`.

## How to Run

### Prerequisites

- Go 1.21 or later
- PostgreSQL 14+
- Node.js 18+ and npm

### Backend

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   go mod download
   ```

3. Set up environment variables:
   ```bash
   # Create .env file with your database connection
   # See Environment Variables section above
   ```

4. Run database migrations:
   ```bash
   # Using goose (recommended)
   cd sql/schema
   goose postgres "$DB_URL" up
   
   # Or manually run SQL files in order (001_*.sql, 002_*.sql, etc.)
   ```

5. Start the server:
   ```bash
   go run main.go
   ```

   The API will be available at `http://localhost:8080`

### Frontend

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

   The frontend will be available at `http://localhost:3000`

## License

ISC

