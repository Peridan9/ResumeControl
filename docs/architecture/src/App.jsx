import React, { useCallback } from 'react';
import {
  ReactFlowProvider,
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import CustomNode from './components/CustomNode';
import './App.css';

const nodeTypes = {
  custom: CustomNode,
};

// Initial nodes and edges defined outside component
const initialNodes = [
      // Frontend Layer
      {
        id: 'frontend',
        type: 'custom',
        position: { x: 100, y: 100 },
        data: {
          label: 'Frontend',
          subtitle: 'React Application',
          tech: 'React 18, TypeScript, Vite',
          category: 'frontend',
          description: 'React-based single-page application built with TypeScript and Vite. Uses React Router for navigation and React Query for data fetching.',
          links: [
            { text: 'View Frontend Code', url: 'https://github.com/peridan9/ResumeControl/tree/main/frontend' },
            { text: 'Components', url: 'https://github.com/peridan9/ResumeControl/tree/main/frontend/src/components' }
          ],
        }
      },
      {
        id: 'frontend-components',
        type: 'custom',
        position: { x: 50, y: 250 },
        data: {
          label: 'Components',
          subtitle: 'UI Components',
          tech: 'React Components',
          category: 'frontend',
          description: 'Reusable React components organized by feature: Applications, Companies, Contacts, Dashboard, and shared UI components.',
          links: [
            { text: 'View Components', url: 'https://github.com/peridan9/ResumeControl/tree/main/frontend/src/components' }
          ],
        }
      },
      {
        id: 'frontend-services',
        type: 'custom',
        position: { x: 250, y: 250 },
        data: {
          label: 'Services',
          subtitle: 'API Layer',
          tech: 'Fetch, React Query',
          category: 'frontend',
          description: 'Service layer that handles all API communication, authentication, and data transformation.',
          links: [
            { text: 'View Services', url: 'https://github.com/peridan9/ResumeControl/tree/main/frontend/src/services' }
          ],
        }
      },
      {
        id: 'frontend-contexts',
        type: 'custom',
        position: { x: 150, y: 400 },
        data: {
          label: 'Contexts',
          subtitle: 'State Management',
          tech: 'React Context',
          category: 'frontend',
          description: 'Global state management using React Context: AuthContext for authentication, ThemeContext for theming, and ToastContext for notifications.',
          links: [
            { text: 'View Contexts', url: 'https://github.com/peridan9/ResumeControl/tree/main/frontend/src/contexts' }
          ],
        }
      },
      
      // Backend Layer
      {
        id: 'backend',
        type: 'custom',
        position: { x: 600, y: 100 },
        data: {
          label: 'Backend API',
          subtitle: 'Go REST API',
          tech: 'Go, Gin Framework',
          category: 'backend',
          description: 'RESTful API built with Go and Gin framework. Handles authentication, business logic, and database operations.',
          links: [
            { text: 'View Backend Code', url: 'https://github.com/peridan9/ResumeControl/tree/main/backend' },
            { text: 'API Handlers', url: 'https://github.com/peridan9/ResumeControl/tree/main/backend/internal/handlers' },
            { text: 'Swagger Docs', url: '#', note: 'Coming soon' }
          ],
        }
      },
      {
        id: 'backend-handlers',
        type: 'custom',
        position: { x: 500, y: 250 },
        data: {
          label: 'Handlers',
          subtitle: 'Request Handlers',
          tech: 'Gin Handlers',
          category: 'backend',
          description: 'HTTP request handlers for Companies, Jobs, Applications, Contacts, and Users. Each handler manages CRUD operations for its resource.',
          links: [
            { text: 'View Handlers', url: 'https://github.com/peridan9/ResumeControl/tree/main/backend/internal/handlers' }
          ],
        }
      },
      {
        id: 'backend-middleware',
        type: 'custom',
        position: { x: 700, y: 250 },
        data: {
          label: 'Middleware',
          subtitle: 'Auth & Rate Limiting',
          tech: 'JWT, Rate Limiting',
          category: 'backend',
          description: 'Middleware for JWT authentication and rate limiting. Protects routes and prevents abuse.',
          links: [
            { text: 'View Middleware', url: 'https://github.com/peridan9/ResumeControl/tree/main/backend/internal/middleware' }
          ],
        }
      },
      {
        id: 'backend-database-layer',
        type: 'custom',
        position: { x: 600, y: 400 },
        data: {
          label: 'Database Layer',
          subtitle: 'sqlc Generated',
          tech: 'sqlc, PostgreSQL',
          category: 'backend',
          description: 'Type-safe database queries generated by sqlc from SQL files. Provides compile-time type safety for database operations.',
          links: [
            { text: 'View Database Code', url: 'https://github.com/peridan9/ResumeControl/tree/main/backend/internal/database' },
            { text: 'SQL Queries', url: 'https://github.com/peridan9/ResumeControl/tree/main/backend/sql/queries' }
          ],
        }
      },
      
      // Database
      {
        id: 'database',
        type: 'custom',
        position: { x: 1100, y: 250 },
        data: {
          label: 'PostgreSQL',
          subtitle: 'Database',
          tech: 'PostgreSQL 14+',
          category: 'database',
          description: 'PostgreSQL database storing all application data: users, companies, jobs, applications, and contacts. Schema managed through SQL migrations.',
          links: [
            { text: 'View Schema', url: 'https://github.com/peridan9/ResumeControl/tree/main/backend/sql/schema' }
          ],
        }
      },
      
      // External Services
      {
        id: 'jwt',
        type: 'custom',
        position: { x: 600, y: 550 },
        data: {
          label: 'JWT Auth',
          subtitle: 'Authentication',
          tech: 'JWT Tokens',
          category: 'external',
          description: 'JSON Web Token-based authentication system. Uses access tokens (15min) and refresh tokens (7 days) for secure API access.',
          links: [
            { text: 'View Auth Code', url: 'https://github.com/peridan9/ResumeControl/tree/main/backend/internal/auth' }
          ],
        }
      }
    ];

const initialEdges = [
      // Frontend connections
      { id: 'e1', source: 'frontend', target: 'frontend-components', animated: true },
      { id: 'e2', source: 'frontend', target: 'frontend-services', animated: true },
      { id: 'e3', source: 'frontend', target: 'frontend-contexts', animated: true },
      { id: 'e4', source: 'frontend-services', target: 'frontend-contexts', animated: true },
      
      // Frontend to Backend
      { id: 'e5', source: 'frontend-services', target: 'backend', type: 'smoothstep', animated: true, style: { stroke: '#667eea', strokeWidth: 3 } },
      
      // Backend connections
      { id: 'e6', source: 'backend', target: 'backend-handlers', animated: true },
      { id: 'e7', source: 'backend', target: 'backend-middleware', animated: true },
      { id: 'e8', source: 'backend', target: 'backend-database-layer', animated: true },
      { id: 'e9', source: 'backend-handlers', target: 'backend-database-layer', animated: true },
      { id: 'e10', source: 'backend-middleware', target: 'backend-handlers', animated: true },
      
      // Backend to Database
      { id: 'e11', source: 'backend-database-layer', target: 'database', type: 'smoothstep', animated: true, style: { stroke: '#f59e0b', strokeWidth: 3 } },
      
      // Auth connections
      { id: 'e12', source: 'backend-middleware', target: 'jwt', animated: true },
      { id: 'e13', source: 'frontend-contexts', target: 'jwt', type: 'smoothstep', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } }
    ];

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowInstance = React.useRef(null);

  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
    instance.fitView({ padding: 0.2 });
  }, []);

  const handleResetView = useCallback(() => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.setViewport({ x: 0, y: 0, zoom: 1 });
    }
  }, []);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({ padding: 0.2 });
    }
  }, []);

  return (
    <div className="app-container">
      <header>
        <h1>ResumeControl Architecture</h1>
        <p className="subtitle">Interactive system architecture diagram</p>
      </header>
      
      <div className="controls">
        <button onClick={handleResetView} className="btn">Reset View</button>
        <button onClick={handleFitView} className="btn">Fit to Screen</button>
        <div className="legend">
          <span className="legend-item">
            <span className="legend-color frontend"></span>
            Frontend
          </span>
          <span className="legend-item">
            <span className="legend-color backend"></span>
            Backend
          </span>
          <span className="legend-item">
            <span className="legend-color database"></span>
            Database
          </span>
          <span className="legend-item">
            <span className="legend-color external"></span>
            External
          </span>
        </div>
      </div>
      
      <div className="diagram-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={onInit}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const colors = {
                frontend: '#3b82f6',
                backend: '#10b981',
                database: '#f59e0b',
                external: '#8b5cf6'
              };
              return colors[node.data?.category] || '#94a3b8';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>
      
      <NodeInfoPanel />
    </div>
  );
}

function NodeInfoPanel() {
  const [selectedNode, setSelectedNode] = React.useState(null);

  React.useEffect(() => {
    const handleNodeClick = (event) => {
      const nodeData = event.detail;
      setSelectedNode(nodeData);
    };

    window.addEventListener('nodeClick', handleNodeClick);
    return () => window.removeEventListener('nodeClick', handleNodeClick);
  }, []);

  if (!selectedNode) return null;

  return (
    <div className="node-info">
      <h3>{selectedNode.label}</h3>
      <p>{selectedNode.description || 'No description available.'}</p>
      <div className="node-links">
        {selectedNode.links?.map((link, index) => (
          link.note ? (
            <span key={index} className="link-note">
              {link.text} (Coming soon)
            </span>
          ) : (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-btn"
            >
              {link.text}
            </a>
          )
        ))}
      </div>
      <button className="close-btn" onClick={() => setSelectedNode(null)}>×</button>
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default App;

