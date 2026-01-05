# ResumeControl Architecture Documentation

Interactive architecture diagram built with React Flow.

## Quick Start

### Prerequisites
- Node.js 18+ and npm

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```
   
   **Note**: If you encounter issues with UNC paths (Windows/WSL), try:
   ```bash
   # In WSL terminal directly (not through Windows)
   cd docs/architecture
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open your browser to the URL shown (typically `http://localhost:5173`)

## Building for Production

To build static files for GitHub Pages:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
architecture/
├── src/
│   ├── components/
│   │   ├── CustomNode.jsx      # Custom React Flow node component
│   │   └── CustomNode.css      # Node styling
│   ├── App.jsx                 # Main diagram component
│   ├── App.css                 # Main styles
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration
└── package.json                # Dependencies
```

## Features

- **Interactive Nodes**: Click any node to see detailed information
- **Zoom & Pan**: Mouse wheel to zoom, drag to pan
- **Minimap**: Navigate large diagrams easily
- **Responsive**: Works on all screen sizes
- **Links**: Direct links to relevant code sections

## Customizing the Diagram

To add or modify nodes, edit `src/App.jsx`:

1. Add nodes to the `initialNodes` array
2. Add edges to the `initialEdges` array
3. Each node should have:
   - `id`: Unique identifier
   - `type`: 'custom' (uses CustomNode component)
   - `position`: { x, y } coordinates
   - `data`: Object with label, subtitle, tech, category, description, and links

## Deployment

For GitHub Pages deployment, see the main docs README for configuration instructions.

