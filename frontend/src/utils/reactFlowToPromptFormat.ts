import { Node, Edge } from 'reactflow';

// Types for diagram structure
export interface DiagramNode {
  id: string;
  type: string;
  label: string;
  position?: { x: number; y: number };
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface DiagramStructure {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

/**
 * Convert ReactFlow nodes and edges to a structured diagram format
 * suitable for API calls
 */
export function reactFlowToStructuredData(
  nodes: Node[],
  edges: Edge[]
): DiagramStructure {
  return {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type || 'rectangle',
      label: node.data?.label || 'Untitled',
      position: node.position,
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: typeof edge.label === 'string' ? edge.label : undefined,
    })),
  };
}

/**
 * Convert node type to Mermaid syntax
 */
function nodeTypeToMermaidSyntax(type: string, label: string): string {
  const escapedLabel = label.replace(/"/g, "'").replace(/\[/g, '(').replace(/\]/g, ')');
  
  switch (type) {
    case 'diamond':
      return `{${escapedLabel}}`;
    case 'rounded':
      return `(${escapedLabel})`;
    case 'hexagon':
      return `{{${escapedLabel}}}`;
    case 'parallelogram':
      return `[/${escapedLabel}/]`;
    case 'cylinder':
      return `[(${escapedLabel})]`;
    case 'circle':
      return `((${escapedLabel}))`;
    case 'rectangle':
    default:
      return `[${escapedLabel}]`;
  }
}

/**
 * Convert ReactFlow nodes and edges back to Mermaid code
 */
export function reactFlowToMermaid(nodes: Node[], edges: Edge[]): string {
  if (nodes.length === 0) {
    return 'flowchart TD\n    A[Empty Diagram]';
  }

  const lines: string[] = ['flowchart TD'];
  
  // Create a map of node IDs to their definitions
  const nodeDefinitions = new Map<string, string>();
  
  nodes.forEach(node => {
    const label = node.data?.label || 'Untitled';
    const type = node.type || 'rectangle';
    const syntax = nodeTypeToMermaidSyntax(type, label);
    nodeDefinitions.set(node.id, `${node.id}${syntax}`);
  });

  // Track which nodes have been defined
  const definedNodes = new Set<string>();

  // Generate edge lines with node definitions
  edges.forEach(edge => {
    const sourceNode = nodeDefinitions.get(edge.source);
    const targetNode = nodeDefinitions.get(edge.target);
    
    if (!sourceNode || !targetNode) return;

    // Build the source part
    let sourcePart: string;
    if (definedNodes.has(edge.source)) {
      sourcePart = edge.source;
    } else {
      sourcePart = sourceNode;
      definedNodes.add(edge.source);
    }

    // Build the target part
    let targetPart: string;
    if (definedNodes.has(edge.target)) {
      targetPart = edge.target;
    } else {
      targetPart = targetNode;
      definedNodes.add(edge.target);
    }

    // Build the edge with optional label
    let edgeLine: string;
    if (edge.label && typeof edge.label === 'string') {
      const escapedLabel = edge.label.replace(/"/g, "'");
      edgeLine = `    ${sourcePart} -->|${escapedLabel}| ${targetPart}`;
    } else {
      edgeLine = `    ${sourcePart} --> ${targetPart}`;
    }

    lines.push(edgeLine);
  });

  // Add any orphan nodes (nodes without edges)
  nodes.forEach(node => {
    if (!definedNodes.has(node.id)) {
      const definition = nodeDefinitions.get(node.id);
      if (definition) {
        lines.push(`    ${definition}`);
      }
    }
  });

  return lines.join('\n');
}

/**
 * Validate diagram structure
 */
export function validateDiagramStructure(structure: DiagramStructure): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!structure.nodes || structure.nodes.length === 0) {
    errors.push('Diagram must have at least one node');
  }

  // Check for duplicate node IDs
  const nodeIds = new Set<string>();
  structure.nodes.forEach(node => {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    nodeIds.add(node.id);
  });

  // Check that all edge references exist
  structure.edges.forEach(edge => {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references non-existent source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references non-existent target node: ${edge.target}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get a text summary of the diagram
 */
export function getDiagramSummary(nodes: Node[], edges: Edge[]): string {
  const nodeTypes: Record<string, number> = {};
  
  nodes.forEach(node => {
    const type = node.type || 'rectangle';
    nodeTypes[type] = (nodeTypes[type] || 0) + 1;
  });

  const typeSummary = Object.entries(nodeTypes)
    .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
    .join(', ');

  return `${nodes.length} nodes (${typeSummary}), ${edges.length} connections`;
}

/**
 * Find the root nodes (nodes with no incoming edges)
 */
export function findRootNodes(nodes: Node[], edges: Edge[]): Node[] {
  const nodesWithIncoming = new Set(edges.map(e => e.target));
  return nodes.filter(node => !nodesWithIncoming.has(node.id));
}

/**
 * Find the leaf nodes (nodes with no outgoing edges)
 */
export function findLeafNodes(nodes: Node[], edges: Edge[]): Node[] {
  const nodesWithOutgoing = new Set(edges.map(e => e.source));
  return nodes.filter(node => !nodesWithOutgoing.has(node.id));
}

/**
 * Get the flow path from root to leaf nodes
 */
export function getFlowPaths(nodes: Node[], edges: Edge[]): string[][] {
  const adjacencyList = new Map<string, string[]>();
  
  // Build adjacency list
  edges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source)!.push(edge.target);
  });

  const rootNodes = findRootNodes(nodes, edges);
  const paths: string[][] = [];

  // DFS to find all paths
  function dfs(nodeId: string, currentPath: string[]) {
    currentPath.push(nodeId);
    
    const neighbors = adjacencyList.get(nodeId) || [];
    if (neighbors.length === 0) {
      // Leaf node - save path
      paths.push([...currentPath]);
    } else {
      neighbors.forEach(neighbor => {
        dfs(neighbor, currentPath);
      });
    }
    
    currentPath.pop();
  }

  rootNodes.forEach(root => {
    dfs(root.id, []);
  });

  return paths;
}
