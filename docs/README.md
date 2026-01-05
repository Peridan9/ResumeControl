# ResumeControl Documentation

This directory contains the architecture documentation for the ResumeControl project.

## Architecture Diagram

The interactive architecture diagram is built with React Flow and can be viewed:

### Development

1. Navigate to the architecture directory:
   ```bash
   cd docs/architecture
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to the URL shown (typically `http://localhost:5173`)

### Build for Production

To build the static files for GitHub Pages:

```bash
cd docs/architecture
npm install
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to GitHub Pages.

### Features

- **Interactive Nodes**: Click on any component to see detailed information
- **Zoom & Pan**: Use mouse wheel to zoom, drag to pan
- **Minimap**: Navigate the diagram easily with the minimap
- **Links**: Each node includes links to relevant code sections
- **Responsive**: Works on desktop and mobile devices

### Architecture Overview

The ResumeControl system consists of:

1. **Frontend** (React + TypeScript)
   - Components layer for UI
   - Services layer for API communication
   - Contexts for global state management

2. **Backend** (Go + Gin)
   - Handlers for request processing
   - Middleware for authentication and rate limiting
   - Database layer using sqlc

3. **Database** (PostgreSQL)
   - Stores all application data
   - Schema managed through migrations

4. **Authentication** (JWT)
   - Token-based authentication system
   - Access and refresh token mechanism

## Setup

To view the architecture diagram locally:

1. Open `architecture/index.html` in a modern web browser
2. The diagram will load automatically
3. Click on nodes to see detailed information
4. Use the controls to reset or fit the view

## Future Enhancements

- [ ] Add Swagger/OpenAPI documentation link
- [ ] Add deployment architecture diagram
- [ ] Add data flow diagrams
- [ ] Add sequence diagrams for key operations
- [ ] Add database schema visualization

## Contributing

When updating the architecture:

1. Edit `architecture/assets/diagram.js` to update nodes and edges
2. Update node descriptions and links as needed
3. Test the diagram in a browser before committing
4. Update this README if adding new documentation sections

