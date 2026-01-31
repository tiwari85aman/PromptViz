// API types based on backend models
export interface GenerateDiagramRequest {
  prompt: string;
  model?: string;
  diagram_type?: string;
}

export interface GenerateDiagramResponse {
  mermaid_code: string;
  success: boolean;
  ai_model_used: string;
  processing_time?: number;
  error_message?: string;
}

export interface ModelInfo {
  name: string;
  provider: string;
  available: boolean;
}

export interface ModelsResponse {
  models: ModelInfo[];
}

export interface SystemPromptInfo {
  name: string;
  description: string;
  type: string;
}

export interface SystemPromptsResponse {
  available_prompts: SystemPromptInfo[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

export interface ErrorResponse {
  error: string;
}

export interface Diagram {
  id: number;
  mermaid_code: string;
  original_prompt: string;
  model_used: string;
  diagram_type: string;
  processing_time?: number;
  success: boolean;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface DiagramListParams {
  search?: string;
  model?: string;
  diagram_type?: string;
  limit?: number;
  offset?: number;
}

export interface DiagramsResponse {
  diagrams: Diagram[];
  total: number;
  limit: number;
  offset: number;
}

// Prompt generation types
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

export interface GeneratePromptRequest {
  diagram_structure: DiagramStructure;
  original_prompt?: string;
  prompt_format: 'xml' | 'markdown';
  model?: string;
  diagram_id?: number;
}

export interface GeneratePromptResponse {
  id: number;
  generated_prompt: string;
  prompt_format: string;
  success: boolean;
  ai_model_used: string;
  processing_time?: number;
  error_message?: string;
}

export interface GeneratedPrompt {
  id: number;
  diagram_id?: number;
  diagram_structure: string;
  original_prompt?: string;
  generated_prompt: string;
  prompt_format: string;
  model_used: string;
  processing_time?: number;
  success: boolean;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface GeneratedPromptsListParams {
  diagram_id?: number;
  format?: string;
  limit?: number;
  offset?: number;
}

export interface GeneratedPromptsResponse {
  generated_prompts: GeneratedPrompt[];
  total: number;
  limit: number;
  offset: number;
}