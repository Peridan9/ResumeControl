# ResumeControl Frontend

React + TypeScript + Vite frontend for the ResumeControl job application management system.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd frontend
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Build for production:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   └── layout/      # Layout components (Navbar, Sidebar)
│   ├── pages/           # Page components
│   ├── services/        # API client and services
│   ├── types/           # TypeScript type definitions
│   ├── hooks/           # Custom React hooks (to be added)
│   ├── App.tsx          # Main app component with routing
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles with Tailwind
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## API Integration

The frontend is configured to proxy API requests to the backend running on `http://localhost:8080`. The API client is located in `src/services/api.ts` and provides typed functions for all backend endpoints.

## Development Notes

- The dev server runs on port 3000
- API requests are proxied to `http://localhost:8080/api`
- TypeScript strict mode is enabled
- Path aliases are configured: `@/*` maps to `./src/*`

