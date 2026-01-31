import React, { useMemo, useCallback, memo, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
  ReactFlowProvider,
  Panel,
  Connection,
  addEdge,
  Node,
  Edge,
  useReactFlow,
  XYPosition,
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { parseMermaidToReactFlow, MermaidNodeType } from '../utils/mermaidToReactFlow';
import { Maximize2, AlertTriangle } from 'lucide-react';
import EditToolbar from './EditToolbar';

// ============================================
// Custom Node Components
// ============================================

interface NodeData {
  label: string;
  onLabelChange?: (id: string, newLabel: string) => void;
}

// Base node styles
const baseNodeStyle = {
  padding: '12px 20px',
  fontSize: '13px',
  fontWeight: 500,
  textAlign: 'center' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '120px',
  wordBreak: 'break-word' as const,
  lineHeight: '1.4',
};

// Editable label component
const EditableLabel: React.FC<{
  label: string;
  nodeId: string;
  onLabelChange?: (id: string, newLabel: string) => void;
  className?: string;
  style?: React.CSSProperties;
}> = ({ label, nodeId, onLabelChange, className, style }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync editValue with label prop when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditValue(label);
    }
  }, [label, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(label);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== label && onLabelChange) {
      onLabelChange(nodeId, editValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(label);
    }
  };

  if (isEditing) {
    return (
      <div 
        className="relative" 
        style={{ zIndex: 100 }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-white border-2 border-blue-500 rounded px-3 py-1.5 text-center outline-none text-gray-900 shadow-xl font-medium"
          style={{ 
            minWidth: '120px', 
            fontSize: '14px',
            color: '#111827',
            caretColor: '#111827',
          }}
        />
      </div>
    );
  }

  return (
    <span 
      className={className} 
      style={style}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      {label}
    </span>
  );
};

// Rectangle Node - Main instructions
const RectangleNode = memo(({ data, selected, id }: NodeProps<NodeData>) => {
  return (
    <div
      className={`
        bg-white border-2 rounded-lg shadow-sm transition-all duration-200
        ${selected ? 'border-primary-500 shadow-lg ring-2 ring-primary-200' : 'border-gray-300 hover:border-primary-400'}
      `}
      style={baseNodeStyle}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary-500 !w-3 !h-3 !border-2 !border-white" />
      <EditableLabel 
        label={data.label} 
        nodeId={id} 
        onLabelChange={data.onLabelChange}
        className="text-gray-800"
      />
      <Handle type="source" position={Position.Bottom} className="!bg-primary-500 !w-3 !h-3 !border-2 !border-white" />
    </div>
  );
});

RectangleNode.displayName = 'RectangleNode';

// Diamond Node - Decision points (proper diamond shape using SVG)
const DiamondNode = memo(({ data, selected, id }: NodeProps<NodeData>) => {
  const width = 160;
  const height = 100;
  
  return (
    <div
      className={`
        relative transition-all duration-200
        ${selected ? 'drop-shadow-lg' : ''}
      `}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Top handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white" 
        style={{ top: 0 }}
      />
      
      {/* Diamond SVG shape */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
        style={{ overflow: 'visible' }}
      >
        <polygon
          points={`${width/2},4 ${width-4},${height/2} ${width/2},${height-4} 4,${height/2}`}
          className={`
            transition-all duration-200
            ${selected 
              ? 'fill-amber-100 stroke-amber-500' 
              : 'fill-amber-50 stroke-amber-400 hover:stroke-amber-500'
            }
          `}
          strokeWidth="2"
        />
      </svg>
      
      {/* Label */}
      <EditableLabel 
        label={data.label}
        nodeId={id}
        onLabelChange={data.onLabelChange}
        className="relative z-10 text-amber-900 font-medium text-center px-4"
        style={{ 
          fontSize: '12px', 
          maxWidth: `${width - 40}px`, 
          lineHeight: '1.3',
          wordBreak: 'break-word',
        }}
      />
      
      {/* Bottom handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white" 
        style={{ bottom: 0 }}
      />
      {/* Left handle */}
      <Handle 
        type="source" 
        position={Position.Left} 
        id="left" 
        className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white" 
        style={{ left: 0 }}
      />
      {/* Right handle */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right" 
        className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white" 
        style={{ right: 0 }}
      />
    </div>
  );
});

DiamondNode.displayName = 'DiamondNode';

// Rounded Node - Context/examples
const RoundedNode = memo(({ data, selected, id }: NodeProps<NodeData>) => {
  return (
    <div
      className={`
        bg-emerald-50 border-2 rounded-full shadow-sm transition-all duration-200
        ${selected ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-200' : 'border-emerald-400 hover:border-emerald-500'}
      `}
      style={{
        ...baseNodeStyle,
        borderRadius: '50px',
        padding: '12px 24px',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-white" />
      <EditableLabel 
        label={data.label}
        nodeId={id}
        onLabelChange={data.onLabelChange}
        className="text-emerald-900"
      />
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-white" />
    </div>
  );
});

RoundedNode.displayName = 'RoundedNode';

// Hexagon Node - Output formats
const HexagonNode = memo(({ data, selected, id }: NodeProps<NodeData>) => {
  return (
    <div
      className={`
        relative transition-all duration-200
        ${selected ? 'drop-shadow-lg' : ''}
      `}
      style={{
        minWidth: '140px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3 !border-2 !border-white" />
      
      {/* Hexagon shape using clip-path */}
      <div
        className={`
          absolute inset-0 bg-purple-50 border-2 shadow-sm
          ${selected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-purple-400 hover:border-purple-500'}
        `}
        style={{
          clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
        }}
      />
      
      <EditableLabel 
        label={data.label}
        nodeId={id}
        onLabelChange={data.onLabelChange}
        className="relative z-10 text-purple-900 font-medium text-center px-4"
        style={{ fontSize: '13px' }}
      />
      
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-3 !h-3 !border-2 !border-white" />
    </div>
  );
});

HexagonNode.displayName = 'HexagonNode';

// Parallelogram Node - I/O operations
const ParallelogramNode = memo(({ data, selected, id }: NodeProps<NodeData>) => {
  return (
    <div
      className={`
        bg-cyan-50 border-2 shadow-sm transition-all duration-200
        ${selected ? 'border-cyan-500 shadow-lg ring-2 ring-cyan-200' : 'border-cyan-400 hover:border-cyan-500'}
      `}
      style={{
        ...baseNodeStyle,
        transform: 'skewX(-10deg)',
        borderRadius: '4px',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-cyan-500 !w-3 !h-3 !border-2 !border-white" />
      <span style={{ transform: 'skewX(10deg)' }}>
        <EditableLabel 
          label={data.label}
          nodeId={id}
          onLabelChange={data.onLabelChange}
          className="text-cyan-900"
        />
      </span>
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-500 !w-3 !h-3 !border-2 !border-white" />
    </div>
  );
});

ParallelogramNode.displayName = 'ParallelogramNode';

// Cylinder Node - Database/storage
const CylinderNode = memo(({ data, selected, id }: NodeProps<NodeData>) => {
  return (
    <div
      className={`
        relative transition-all duration-200
        ${selected ? 'drop-shadow-lg' : ''}
      `}
      style={{
        minWidth: '100px',
        minHeight: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-rose-500 !w-3 !h-3 !border-2 !border-white" />
      
      {/* Cylinder body */}
      <div
        className={`
          absolute inset-x-0 top-2 bottom-2 bg-rose-50 border-2 border-t-0
          ${selected ? 'border-rose-500' : 'border-rose-400'}
        `}
        style={{ borderRadius: '0 0 50% 50% / 0 0 20px 20px' }}
      />
      
      {/* Cylinder top */}
      <div
        className={`
          absolute inset-x-0 top-0 h-4 bg-rose-100 border-2
          ${selected ? 'border-rose-500' : 'border-rose-400'}
        `}
        style={{ borderRadius: '50%' }}
      />
      
      <EditableLabel 
        label={data.label}
        nodeId={id}
        onLabelChange={data.onLabelChange}
        className="relative z-10 text-rose-900 font-medium text-center px-3 pt-2"
        style={{ fontSize: '13px' }}
      />
      
      <Handle type="source" position={Position.Bottom} className="!bg-rose-500 !w-3 !h-3 !border-2 !border-white" />
    </div>
  );
});

CylinderNode.displayName = 'CylinderNode';

// Circle Node - Events/connectors
const CircleNode = memo(({ data, selected, id }: NodeProps<NodeData>) => {
  return (
    <div
      className={`
        bg-indigo-50 border-2 rounded-full shadow-sm transition-all duration-200
        ${selected ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-200' : 'border-indigo-400 hover:border-indigo-500'}
      `}
      style={{
        ...baseNodeStyle,
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        padding: '8px',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-white" />
      <EditableLabel 
        label={data.label}
        nodeId={id}
        onLabelChange={data.onLabelChange}
        className="text-indigo-900 text-xs text-center"
      />
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-white" />
    </div>
  );
});

CircleNode.displayName = 'CircleNode';

// Node types mapping
const nodeTypes: Record<MermaidNodeType, React.ComponentType<NodeProps<NodeData>>> = {
  rectangle: RectangleNode,
  diamond: DiamondNode,
  rounded: RoundedNode,
  hexagon: HexagonNode,
  parallelogram: ParallelogramNode,
  cylinder: CylinderNode,
  circle: CircleNode,
};

// ============================================
// Custom Edge Component with Editable Label
// ============================================

interface EditableEdgeData {
  onLabelChange?: (edgeId: string, newLabel: string) => void;
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
}

const EditableEdge: React.FC<EdgeProps<EditableEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
  selected,
}) => {
  const [editValue, setEditValue] = useState(label?.toString() || '');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const isEditing = data?.isEditing || false;
  const setIsEditing = data?.setIsEditing;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(label?.toString() || '');
  }, [label]);

  // Reset edit value when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditValue(label?.toString() || '');
    }
  }, [isEditing, label]);

  const handleLabelDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditing?.(true);
  };

  const handleBlur = () => {
    setIsEditing?.(false);
    if (data?.onLabelChange) {
      data.onLabelChange(id, editValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing?.(false);
      setEditValue(label?.toString() || '');
    }
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? '#3b82f6' : '#94a3b8',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Enter label..."
              className="px-2 py-1 text-xs bg-white border border-primary-400 rounded shadow-lg outline-none min-w-[80px] text-center"
              onClick={(e) => e.stopPropagation()}
            />
          ) : label ? (
            <div
              onDoubleClick={handleLabelDoubleClick}
              className={`
                px-2 py-1 text-xs rounded bg-white border border-gray-300 text-gray-700 shadow-sm 
                hover:border-primary-400 cursor-pointer
                ${selected ? 'ring-2 ring-primary-300' : ''}
              `}
              title="Double-click to edit"
            >
              {label}
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// Edge types mapping
const edgeTypes = {
  editableEdge: EditableEdge,
};

// ============================================
// Main ReactFlow Diagram Component
// ============================================

export interface DiagramState {
  nodes: Node[];
  edges: Edge[];
}

interface ReactFlowDiagramProps {
  mermaidCode: string;
  onDiagramChange?: (state: DiagramState) => void;
  onGeneratePrompt?: () => void;
  isEditable?: boolean;
}

const ReactFlowDiagramInner: React.FC<ReactFlowDiagramProps> = ({ 
  mermaidCode, 
  onDiagramChange,
  onGeneratePrompt,
  isEditable = true 
}) => {
  const reactFlowInstance = useReactFlow();
  
  // Parse mermaid code and memoize the result
  const { initialNodes, initialEdges, parseError } = useMemo(() => {
    const result = parseMermaidToReactFlow(mermaidCode);
    return {
      initialNodes: result.nodes,
      initialEdges: result.edges,
      parseError: result.error,
    };
  }, [mermaidCode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // History for undo/redo
  const [history, setHistory] = useState<DiagramState[]>([{ nodes: initialNodes, edges: initialEdges }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  // Selected node type for adding new nodes
  const [selectedNodeType, setSelectedNodeType] = useState<MermaidNodeType>('rectangle');

  // State for edge being edited
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);

  // Update nodes/edges when mermaidCode changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setHistory([{ nodes: initialNodes, edges: initialEdges }]);
    setHistoryIndex(0);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Notify parent of diagram changes
  useEffect(() => {
    if (onDiagramChange && !isUndoRedoAction.current) {
      onDiagramChange({ nodes, edges });
    }
    isUndoRedoAction.current = false;
  }, [nodes, edges, onDiagramChange]);

  // Save to history
  const saveToHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    if (isUndoRedoAction.current) return;
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ nodes: newNodes, edges: newEdges });
      // Keep only last 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Handle node label change
  const handleLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setNodes(nds => {
      const newNodes = nds.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      );
      saveToHistory(newNodes, edges);
      return newNodes;
    });
  }, [setNodes, edges, saveToHistory]);

  // Handle edge label change
  const handleEdgeLabelChange = useCallback((edgeId: string, newLabel: string) => {
    setEdges(eds => {
      const newEdges = eds.map(edge =>
        edge.id === edgeId
          ? { ...edge, label: newLabel || undefined }
          : edge
      );
      saveToHistory(nodes, newEdges);
      return newEdges;
    });
  }, [setEdges, nodes, saveToHistory]);

  // Add onLabelChange to all nodes
  const nodesWithCallbacks = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onLabelChange: handleLabelChange,
      },
    }));
  }, [nodes, handleLabelChange]);

  // Add onLabelChange to all edges and use custom edge type
  const edgesWithCallbacks = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      type: 'editableEdge',
      data: {
        ...edge.data,
        onLabelChange: handleEdgeLabelChange,
        isEditing: editingEdgeId === edge.id,
        setIsEditing: (editing: boolean) => setEditingEdgeId(editing ? edge.id : null),
      },
    }));
  }, [edges, handleEdgeLabelChange, editingEdgeId]);

  // Handle new connections
  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => {
      const newEdges = addEdge({
        ...connection,
        type: 'editableEdge',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        style: {
          strokeWidth: 2,
          stroke: '#94a3b8',
        },
        data: {
          onLabelChange: handleEdgeLabelChange,
        },
      }, eds);
      saveToHistory(nodes, newEdges);
      return newEdges;
    });
  }, [setEdges, nodes, saveToHistory, handleEdgeLabelChange]);

  // Add new node
  const handleAddNode = useCallback((type: MermaidNodeType, position?: XYPosition) => {
    const newId = `node_${Date.now()}`;
    const pos = position || { 
      x: Math.random() * 400 + 100, 
      y: Math.random() * 300 + 100 
    };
    
    const newNode: Node = {
      id: newId,
      type,
      position: pos,
      data: { 
        label: 'New Node',
        onLabelChange: handleLabelChange,
      },
    };
    
    setNodes(nds => {
      const newNodes = [...nds, newNode];
      saveToHistory(newNodes, edges);
      return newNodes;
    });
  }, [setNodes, edges, handleLabelChange, saveToHistory]);

  // Delete selected nodes and edges
  const handleDeleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    const selectedEdges = edges.filter(e => e.selected);
    
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    
    const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
    
    setNodes(nds => {
      const newNodes = nds.filter(n => !n.selected);
      return newNodes;
    });
    
    setEdges(eds => {
      // Remove selected edges and edges connected to deleted nodes
      const newEdges = eds.filter(e => 
        !e.selected && 
        !selectedNodeIds.has(e.source) && 
        !selectedNodeIds.has(e.target)
      );
      return newEdges;
    });
    
    // Save to history after state updates
    setTimeout(() => {
      setNodes(nds => {
        setEdges(eds => {
          saveToHistory(nds, eds);
          return eds;
        });
        return nds;
      });
    }, 0);
  }, [nodes, edges, setNodes, setEdges, saveToHistory]);

  // Change node type
  const handleChangeNodeType = useCallback((nodeId: string, newType: MermaidNodeType) => {
    setNodes(nds => {
      const newNodes = nds.map(node =>
        node.id === nodeId
          ? { ...node, type: newType }
          : node
      );
      saveToHistory(newNodes, edges);
      return newNodes;
    });
  }, [setNodes, edges, saveToHistory]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setNodes(state.nodes);
      setEdges(state.edges);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setNodes(state.nodes);
      setEdges(state.edges);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditable) return;
      
      // Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if we're in an input
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        handleDeleteSelected();
      }
      
      // Undo: Cmd/Ctrl + Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if ((e.metaKey || e.ctrlKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditable, handleDeleteSelected, handleUndo, handleRedo]);

  // Double-click on pane to add node
  const onPaneClick = useCallback(() => {
    // Close any edge editing
    setEditingEdgeId(null);
  }, []);

  const onPaneDoubleClick = useCallback((event: React.MouseEvent) => {
    if (!isEditable) return;
    
    // Only add node if double-clicking on the pane itself (not on edges or nodes)
    const target = event.target as HTMLElement;
    const isPane = target.classList.contains('react-flow__pane') || 
                   target.classList.contains('react-flow__background');
    
    if (!isPane) return;
    
    const bounds = target.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
    
    handleAddNode(selectedNodeType, position);
  }, [isEditable, reactFlowInstance, selectedNodeType, handleAddNode]);

  // Handle edge double-click to edit label
  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    event.preventDefault();
    setEditingEdgeId(edge.id);
  }, []);

  // Fit view callback
  const onInit = useCallback((instance: any) => {
    instance.fitView({ padding: 0.2 });
  }, []);

  // Show error state if parsing failed
  if (parseError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to Parse Diagram
          </h3>
          <p className="text-gray-600 mb-4">
            The Mermaid code couldn't be converted to an interactive diagram.
            Try switching to the Mermaid view for the original rendering.
          </p>
          <p className="text-sm text-gray-500 bg-gray-100 p-3 rounded-lg font-mono">
            {parseError}
          </p>
        </div>
      </div>
    );
  }

  // Show empty state if no nodes
  if (nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Maximize2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Diagram Data
          </h3>
          <p className="text-gray-600">
            Generate a diagram to see the interactive view.
          </p>
        </div>
      </div>
    );
  }

  const hasSelection = nodes.some(n => n.selected) || edges.some(e => e.selected);
  const selectedNode = nodes.find(n => n.selected);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edgesWithCallbacks}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onPaneClick={onPaneClick}
        onDoubleClick={onPaneDoubleClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50"
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={null} // We handle delete ourselves
        defaultEdgeOptions={{
          type: 'editableEdge',
          animated: false,
        }}
      >
        {/* Edit Toolbar */}
        {isEditable && (
          <Panel position="top-left" className="!m-4">
            <EditToolbar
              selectedNodeType={selectedNodeType}
              onNodeTypeChange={setSelectedNodeType}
              onAddNode={() => handleAddNode(selectedNodeType)}
              onDeleteSelected={handleDeleteSelected}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              hasSelection={hasSelection}
              selectedNode={selectedNode}
              onChangeNodeType={handleChangeNodeType}
              onGeneratePrompt={onGeneratePrompt}
            />
          </Panel>
        )}

        {/* Controls */}
        <Controls 
          className="!bg-white !border !border-gray-200 !rounded-lg !shadow-lg"
          showInteractive={false}
        />
        
        {/* MiniMap */}
        <MiniMap 
          className="!bg-white !border !border-gray-200 !rounded-lg !shadow-lg"
          maskColor="rgba(59, 130, 246, 0.1)"
          nodeColor={(node) => {
            switch (node.type) {
              case 'diamond': return '#fbbf24';
              case 'rounded': return '#10b981';
              case 'hexagon': return '#a855f7';
              case 'parallelogram': return '#06b6d4';
              case 'cylinder': return '#f43f5e';
              case 'circle': return '#6366f1';
              default: return '#3b82f6';
            }
          }}
          nodeBorderRadius={4}
        />
        
        {/* Background Pattern */}
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#d1d5db"
        />

        {/* Legend Panel */}
        <Panel position="top-right" className="!m-4">
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 text-xs">
            <h4 className="font-semibold text-gray-700 mb-3">Node Types</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded" />
                <span className="text-gray-600">Instructions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-50 border-2 border-amber-400 rotate-45 rounded-sm scale-75" />
                <span className="text-gray-600">Decisions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-50 border-2 border-emerald-400 rounded-full" />
                <span className="text-gray-600">Context</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-purple-50 border-2 border-purple-400" style={{ clipPath: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)' }} />
                <span className="text-gray-600">Outputs</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-gray-500">
                Double-click to edit • Drag handles to connect
              </p>
              <p className="text-gray-400 text-[10px] mt-1">
                Double-click edge to add label
              </p>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Wrap with ReactFlowProvider for proper context
const ReactFlowDiagram: React.FC<ReactFlowDiagramProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ReactFlowDiagramInner {...props} />
    </ReactFlowProvider>
  );
};

export default ReactFlowDiagram;
