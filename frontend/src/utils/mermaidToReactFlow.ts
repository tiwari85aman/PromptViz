import dagre from 'dagre';
import { Node, Edge, MarkerType } from 'reactflow';

// Node shape types based on Mermaid syntax
export type MermaidNodeType = 'rectangle' | 'diamond' | 'rounded' | 'hexagon' | 'parallelogram' | 'cylinder' | 'circle';

export interface ParsedNode {
  id: string;
  label: string;
  type: MermaidNodeType;
}

export interface ParsedEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface ParseResult {
  nodes: Node[];
  edges: Edge[];
  error?: string;
}

/**
 * Determine the node type based on Mermaid syntax patterns
 */
function determineNodeType(nodeDefinition: string): { type: MermaidNodeType; label: string } {
  // Diamond/Decision: {Label} or {Label}
  const diamondMatch = nodeDefinition.match(/^\{(.+?)\}$/);
  if (diamondMatch) {
    return { type: 'diamond', label: diamondMatch[1].trim() };
  }

  // Hexagon: {{Label}}
  const hexagonMatch = nodeDefinition.match(/^\{\{(.+?)\}\}$/);
  if (hexagonMatch) {
    return { type: 'hexagon', label: hexagonMatch[1].trim() };
  }

  // Rounded rectangle/Stadium: ([Label]) or (Label)
  const roundedMatch = nodeDefinition.match(/^\(\[(.+?)\]\)$/) || nodeDefinition.match(/^\((.+?)\)$/);
  if (roundedMatch) {
    return { type: 'rounded', label: roundedMatch[1].trim() };
  }

  // Parallelogram: [/Label/] or [\Label\]
  const parallelogramMatch = nodeDefinition.match(/^\[\/(.+?)\/\]$/) || nodeDefinition.match(/^\[\\(.+?)\\\]$/);
  if (parallelogramMatch) {
    return { type: 'parallelogram', label: parallelogramMatch[1].trim() };
  }

  // Cylinder: [(Label)]
  const cylinderMatch = nodeDefinition.match(/^\[\((.+?)\)\]$/);
  if (cylinderMatch) {
    return { type: 'cylinder', label: cylinderMatch[1].trim() };
  }

  // Circle: ((Label))
  const circleMatch = nodeDefinition.match(/^\(\((.+?)\)\)$/);
  if (circleMatch) {
    return { type: 'circle', label: circleMatch[1].trim() };
  }

  // Standard rectangle: [Label]
  const rectangleMatch = nodeDefinition.match(/^\[(.+?)\]$/);
  if (rectangleMatch) {
    return { type: 'rectangle', label: rectangleMatch[1].trim() };
  }

  // No brackets - just the ID itself as label
  return { type: 'rectangle', label: nodeDefinition.trim() };
}

/**
 * Parse a single line of Mermaid flowchart code
 */
function parseLine(line: string, nodesMap: Map<string, ParsedNode>, edges: ParsedEdge[]): void {
  const trimmedLine = line.trim();
  
  // Skip empty lines, comments, and flowchart declaration
  if (!trimmedLine || 
      trimmedLine.startsWith('%%') || 
      trimmedLine.startsWith('flowchart') ||
      trimmedLine.startsWith('graph') ||
      trimmedLine.startsWith('subgraph') ||
      trimmedLine === 'end' ||
      trimmedLine.startsWith('style') ||
      trimmedLine.startsWith('classDef') ||
      trimmedLine.startsWith('class ')) {
    return;
  }

  // Edge patterns (order matters - check more specific patterns first)
  const edgePatterns = [
    // Arrow with label: A -->|label| B or A -- label --> B
    /^(\w+)(?:\[.*?\]|\{.*?\}|\(.*?\))?\s*-->\|(.+?)\|\s*(\w+)(?:\[.*?\]|\{.*?\}|\(.*?\))?$/,
    /^(\w+)(?:\[.*?\]|\{.*?\}|\(.*?\))?\s*--\s*(.+?)\s*-->\s*(\w+)(?:\[.*?\]|\{.*?\}|\(.*?\))?$/,
    // Arrow with label (alternative): A -.->|label| B (dotted)
    /^(\w+)(?:\[.*?\]|\{.*?\}|\(.*?\))?\s*-\.->\|(.+?)\|\s*(\w+)(?:\[.*?\]|\{.*?\}|\(.*?\))?$/,
    // Simple arrow: A --> B
    /^(\w+)(?:\[.*?\]|\{.*?\}|\(.*?\))?\s*-->\s*(\w+)(?:\[.*?\]|\{.*?\}|\(.*?\))?$/,
    // Dotted arrow: A -.-> B
    /^(\w+)(?:\[.*?\]|\{.*?\}|\(.*?\))?\s*-\.->\s*(\w+)(?:\[.*?\]|\{.*?\}|\(.*?\))?$/,
    // Thick arrow: A ==> B
    /^(\w+)(?:\[.*?\]|\{.*?\}|\(.*?\))?\s*==>\s*(\w+)(?:\[.*?\]|\{.*?\}|\(.*?\))?$/,
  ];

  // First, extract node definitions from the line
  // Pattern: ID[Label] or ID{Label} or ID([Label]) or ID{{Label}}
  const nodeDefPattern = /(\w+)(\[.*?\]|\{.*?\}|\(.*?\))/g;
  let nodeMatch;
  
  while ((nodeMatch = nodeDefPattern.exec(trimmedLine)) !== null) {
    const nodeId = nodeMatch[1];
    const nodeDefinition = nodeMatch[2];
    
    if (!nodesMap.has(nodeId)) {
      const { type, label } = determineNodeType(nodeDefinition);
      nodesMap.set(nodeId, { id: nodeId, label, type });
    }
  }

  // Try to match edge patterns
  for (let i = 0; i < edgePatterns.length; i++) {
    const pattern = edgePatterns[i];
    const match = trimmedLine.match(pattern);
    
    if (match) {
      let sourceId: string, targetId: string, edgeLabel: string | undefined;
      
      // Patterns with 3 capture groups have a label
      if (match.length === 4) {
        sourceId = match[1];
        edgeLabel = match[2];
        targetId = match[3];
      } else {
        sourceId = match[1];
        targetId = match[2];
      }

      // Ensure source and target nodes exist
      if (!nodesMap.has(sourceId)) {
        nodesMap.set(sourceId, { id: sourceId, label: sourceId, type: 'rectangle' });
      }
      if (!nodesMap.has(targetId)) {
        nodesMap.set(targetId, { id: targetId, label: targetId, type: 'rectangle' });
      }

      // Check for dotted line (animated edge)
      const isDotted = trimmedLine.includes('-.-');
      
      edges.push({
        id: `e-${sourceId}-${targetId}-${edges.length}`,
        source: sourceId,
        target: targetId,
        label: edgeLabel,
        animated: isDotted,
      });
      
      return; // Successfully parsed an edge
    }
  }

  // If no edge pattern matched, check if this is a standalone node definition
  const standaloneNode = trimmedLine.match(/^(\w+)(\[.*?\]|\{.*?\}|\(.*?\))$/);
  if (standaloneNode) {
    const nodeId = standaloneNode[1];
    const nodeDefinition = standaloneNode[2];
    
    if (!nodesMap.has(nodeId)) {
      const { type, label } = determineNodeType(nodeDefinition);
      nodesMap.set(nodeId, { id: nodeId, label, type });
    }
  }
}

/**
 * Apply dagre layout algorithm to position nodes
 */
function applyLayout(nodes: ParsedNode[], edges: ParsedEdge[]): Node[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Configure layout - top to bottom direction
  dagreGraph.setGraph({ 
    rankdir: 'TB', 
    nodesep: 80, 
    ranksep: 100,
    marginx: 40,
    marginy: 40,
  });

  // Calculate node dimensions based on label length
  const getNodeDimensions = (node: ParsedNode): { width: number; height: number } => {
    const baseWidth = Math.max(150, node.label.length * 8 + 40);
    const baseHeight = node.type === 'diamond' ? 80 : 50;
    return { width: Math.min(baseWidth, 300), height: baseHeight };
  };

  // Add nodes to dagre graph
  nodes.forEach(node => {
    const { width, height } = getNodeDimensions(node);
    dagreGraph.setNode(node.id, { width, height });
  });

  // Add edges to dagre graph
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run layout algorithm
  dagre.layout(dagreGraph);

  // Convert to ReactFlow nodes with positions
  return nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const { width, height } = getNodeDimensions(node);
    
    return {
      id: node.id,
      type: node.type,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
      data: { 
        label: node.label,
      },
      style: {
        width,
        height,
      },
    };
  });
}

/**
 * Convert parsed edges to ReactFlow edge format
 */
function convertEdges(edges: ParsedEdge[]): Edge[] {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: edge.animated,
    type: 'bezier',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
    },
    style: {
      strokeWidth: 2,
      stroke: '#94a3b8',
    },
    labelStyle: {
      fill: '#374151',
      fontWeight: 500,
      fontSize: 12,
    },
    labelBgStyle: {
      fill: '#ffffff',
      fillOpacity: 0.95,
    },
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 4,
  }));
}

/**
 * Main function to parse Mermaid flowchart code and convert to ReactFlow format
 */
export function parseMermaidToReactFlow(mermaidCode: string): ParseResult {
  try {
    if (!mermaidCode || typeof mermaidCode !== 'string') {
      return { nodes: [], edges: [], error: 'No Mermaid code provided' };
    }

    const lines = mermaidCode.split('\n');
    const nodesMap = new Map<string, ParsedNode>();
    const parsedEdges: ParsedEdge[] = [];

    // Parse each line
    lines.forEach(line => {
      parseLine(line, nodesMap, parsedEdges);
    });

    const parsedNodes = Array.from(nodesMap.values());

    if (parsedNodes.length === 0) {
      return { nodes: [], edges: [], error: 'No valid nodes found in Mermaid code' };
    }

    // Apply layout and convert to ReactFlow format
    const reactFlowNodes = applyLayout(parsedNodes, parsedEdges);
    const reactFlowEdges = convertEdges(parsedEdges);

    return {
      nodes: reactFlowNodes,
      edges: reactFlowEdges,
    };
  } catch (error) {
    console.error('Error parsing Mermaid code:', error);
    return {
      nodes: [],
      edges: [],
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}

/**
 * Validate if the provided code looks like a Mermaid flowchart
 */
export function isValidMermaidFlowchart(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  
  const trimmed = code.trim().toLowerCase();
  return trimmed.startsWith('flowchart') || trimmed.startsWith('graph');
}
