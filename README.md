# ResumeControl

> ⚠️ **This project is still under development!**

A job application management system to track job applications, manage resumes, and tailor resumes to specific job descriptions.

## About

ResumeControl helps you organize your job search by tracking applications, managing company information, and storing contact details. The system provides a dashboard with statistics and filtering capabilities to keep your job search organized.

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
│   │   ├── pages/              # Page components
│   │   ├── services/           # API service layer
│   │   └── types/              # TypeScript types
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
```

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
   # Run SQL schema files in sql/schema/ directory
   # (Migration tool setup may vary)
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
