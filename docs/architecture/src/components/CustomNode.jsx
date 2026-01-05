import React from 'react';
import { Handle, Position } from '@xyflow/react';
import './CustomNode.css';

function CustomNode({ data, selected }) {
  const handleClick = () => {
    // Dispatch custom event with node data
    const event = new CustomEvent('nodeClick', { detail: data });
    window.dispatchEvent(event);
  };

  return (
    <div
      className={`custom-node ${data.category} ${selected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} />
      <div className="custom-node-title">{data.label}</div>
      {data.subtitle && (
        <div className="custom-node-subtitle">{data.subtitle}</div>
      )}
      {data.tech && (
        <div className="custom-node-tech">{data.tech}</div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default CustomNode;

