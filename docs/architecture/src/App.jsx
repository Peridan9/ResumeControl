import React, { useCallback } from 'react';
import {
  ReactFlowProvider,
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
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
          nodesDraggable={false}
          nodesConnectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
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
      <DatabaseSchemaModal />
    </div>
  );
}

function NodeInfoPanel() {
  const [selectedNode, setSelectedNode] = React.useState(null);

  React.useEffect(() => {
    const handleNodeClick = (event) => {
      const nodeData = event.detail;
      // If database node is clicked, trigger database modal instead
      // Check by category since id is not in data object
      if (nodeData.category === 'database' && nodeData.label === 'PostgreSQL') {
        setSelectedNode(null); // Clear info panel
        const dbEvent = new CustomEvent('showDatabaseSchema', { detail: nodeData });
        window.dispatchEvent(dbEvent);
        return;
      }
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

// ERD Table Node Component
function ERDTableNode({ data, selected }) {
  const { table } = data;
  
  return (
    <div className={`erd-table-node ${selected ? 'selected' : ''}`}>
      <div className="erd-table-header">
        <strong>{table.name}</strong>
      </div>
      <div className="erd-table-fields">
        {table.fields.map((field, idx) => (
          <div key={idx} className={`erd-field ${field.primary ? 'primary-key' : ''} ${field.foreignKey ? 'foreign-key' : ''}`}>
            <span className="erd-field-name">
              {field.primary && <span className="pk-indicator">🔑</span>}
              {field.foreignKey && <span className="fk-indicator">🔗</span>}
              {field.name}
            </span>
            <span className="erd-field-type">{field.type}</span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Right} id="right" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Bottom} id="bottom" />
    </div>
  );
}

function DatabaseSchemaModal() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleShowDatabase = () => {
      setIsOpen(true);
    };

    window.addEventListener('showDatabaseSchema', handleShowDatabase);
    return () => window.removeEventListener('showDatabaseSchema', handleShowDatabase);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={() => setIsOpen(false)}>×</button>
        <DatabaseSchema />
      </div>
    </div>
  );
}

function DatabaseSchema() {
  const tables = [
    {
      id: 'users',
      name: 'users',
      fields: [
        { name: 'id', type: 'SERIAL', primary: true },
        { name: 'email', type: 'VARCHAR(255)', unique: true, notNull: true },
        { name: 'password_hash', type: 'VARCHAR(255)', notNull: true },
        { name: 'name', type: 'VARCHAR(255)' },
        { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        { name: 'last_login', type: 'TIMESTAMP' }
      ]
    },
    {
      id: 'companies',
      name: 'companies',
      fields: [
        { name: 'id', type: 'SERIAL', primary: true },
        { name: 'user_id', type: 'INTEGER', foreignKey: 'users', notNull: true },
        { name: 'name', type: 'VARCHAR(255)', notNull: true },
        { name: 'website', type: 'VARCHAR(255)' },
        { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      ]
    },
    {
      id: 'jobs',
      name: 'jobs',
      fields: [
        { name: 'id', type: 'SERIAL', primary: true },
        { name: 'company_id', type: 'INTEGER', foreignKey: 'companies', notNull: true },
        { name: 'title', type: 'VARCHAR(255)', notNull: true },
        { name: 'description', type: 'TEXT' },
        { name: 'requirements', type: 'TEXT' },
        { name: 'location', type: 'VARCHAR(255)' },
        { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      ]
    },
    {
      id: 'contacts',
      name: 'contacts',
      fields: [
        { name: 'id', type: 'SERIAL', primary: true },
        { name: 'user_id', type: 'INTEGER', foreignKey: 'users', notNull: true },
        { name: 'name', type: 'VARCHAR(255)', notNull: true },
        { name: 'email', type: 'VARCHAR(255)' },
        { name: 'phone', type: 'VARCHAR(50)' },
        { name: 'linkedin', type: 'VARCHAR(500)' },
        { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      ]
    },
    {
      id: 'applications',
      name: 'applications',
      fields: [
        { name: 'id', type: 'SERIAL', primary: true },
        { name: 'user_id', type: 'INTEGER', foreignKey: 'users', notNull: true },
        { name: 'job_id', type: 'INTEGER', foreignKey: 'jobs', notNull: true },
        { name: 'contact_id', type: 'INTEGER', foreignKey: 'contacts' },
        { name: 'status', type: 'VARCHAR(50)', default: "'applied'", notNull: true },
        { name: 'applied_date', type: 'DATE', notNull: true },
        { name: 'notes', type: 'TEXT' },
        { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      ]
    },
    {
      id: 'refresh_tokens',
      name: 'refresh_tokens',
      fields: [
        { name: 'id', type: 'SERIAL', primary: true },
        { name: 'user_id', type: 'INTEGER', foreignKey: 'users', notNull: true },
        { name: 'token_hash', type: 'VARCHAR(255)', unique: true, notNull: true },
        { name: 'expires_at', type: 'TIMESTAMP', notNull: true },
        { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        { name: 'revoked_at', type: 'TIMESTAMP' }
      ]
    }
  ];

  // Create ERD nodes - positioned for better visibility with increased spacing
  const erdNodes = [
    { id: 'users', type: 'erdTable', position: { x: 50, y: 50 }, data: { table: tables[0] } },
    { id: 'companies', type: 'erdTable', position: { x: 350, y: 50 }, data: { table: tables[1] } },
    { id: 'jobs', type: 'erdTable', position: { x: 650, y: 50 }, data: { table: tables[2] } },
    { id: 'contacts', type: 'erdTable', position: { x: 50, y: 450 }, data: { table: tables[3] } },
    { id: 'applications', type: 'erdTable', position: { x: 650, y: 450 }, data: { table: tables[4] } },
    { id: 'refresh_tokens', type: 'erdTable', position: { x: 350, y: 450 }, data: { table: tables[5] } }
  ];

  // Create ERD edges based on foreign keys
  const erdEdges = [
    { id: 'e-users-companies', source: 'users', target: 'companies', sourceHandle: 'right', targetHandle: 'left', type: 'straight', style: { stroke: '#667eea', strokeWidth: 2 }, label: '1:N' },
    { id: 'e-users-contacts', source: 'users', target: 'contacts', sourceHandle: 'bottom', targetHandle: 'top', type: 'straight', style: { stroke: '#667eea', strokeWidth: 2 }, label: '1:N' },
    { id: 'e-users-applications', source: 'users', target: 'applications', sourceHandle: 'right', targetHandle: 'left', type: 'straight', style: { stroke: '#667eea', strokeWidth: 2 }, label: '1:N' },
    { id: 'e-users-refresh_tokens', source: 'users', target: 'refresh_tokens', sourceHandle: 'right', targetHandle: 'left', type: 'straight', style: { stroke: '#667eea', strokeWidth: 2 }, label: '1:N' },
    { id: 'e-companies-jobs', source: 'companies', target: 'jobs', sourceHandle: 'right', targetHandle: 'left', type: 'straight', style: { stroke: '#10b981', strokeWidth: 2 }, label: '1:N' },
    { id: 'e-jobs-applications', source: 'jobs', target: 'applications', sourceHandle: 'bottom', targetHandle: 'top', type: 'straight', style: { stroke: '#f59e0b', strokeWidth: 2 }, label: '1:N' },
    { id: 'e-contacts-applications', source: 'contacts', target: 'applications', sourceHandle: 'right', targetHandle: 'left', type: 'straight', style: { stroke: '#8b5cf6', strokeWidth: 2 }, label: '1:N' }
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(erdNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(erdEdges);
  const reactFlowInstance = React.useRef(null);

  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
    instance.fitView({ padding: 0.2 });
  }, []);

  const erdNodeTypes = React.useMemo(() => ({
    erdTable: ERDTableNode
  }), []);

  return (
    <div className="database-schema-erd">
      <h2>Database Schema - ERD Diagram</h2>
      <p className="schema-description">
        Entity Relationship Diagram showing the PostgreSQL database structure for ResumeControl.
      </p>
      <div className="erd-container">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onInit={onInit}
            nodeTypes={erdNodeTypes}
            fitView
            nodesDraggable={true}
            nodesConnectable={false}
            panOnDrag={true}
            zoomOnScroll={true}
            attributionPosition="bottom-left"
            defaultEdgeOptions={{
              type: 'straight',
              markerEnd: { type: 'arrowclosed' },
            }}
            connectionLineType="straight"
          >
            <Background gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeColor="#667eea"
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      <div className="schema-footer">
        <a 
          href="https://github.com/peridan9/ResumeControl/tree/main/backend/sql/schema" 
          target="_blank" 
          rel="noopener noreferrer"
          className="schema-link"
        >
          View Schema Files on GitHub →
        </a>
      </div>
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

