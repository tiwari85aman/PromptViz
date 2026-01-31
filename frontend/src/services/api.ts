import axios from 'axios';
import type {
  GenerateDiagramRequest,
  GenerateDiagramResponse,
  ModelsResponse,
  SystemPromptsResponse,
  HealthResponse,
  Diagram,
  DiagramsResponse,
  DiagramListParams,
  GeneratePromptRequest,
  GeneratePromptResponse,
  GeneratedPrompt,
  GeneratedPromptsListParams,
  GeneratedPromptsResponse,
} from '../types/api';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for diagram generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      throw new Error(error.response.data?.error || 'Server error occurred');
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      throw new Error('Request failed - please try again');
    }
  }
);

export const apiService = {
  // Health check
  async health(): Promise<HealthResponse> {
    const response = await api.get<HealthResponse>('/api/health');
    return response.data;
  },

  // Generate diagram from text prompt
  async generateDiagram(request: GenerateDiagramRequest): Promise<GenerateDiagramResponse> {
    const response = await api.post<GenerateDiagramResponse>('/api/generate-diagram', request);
    return response.data;
  },

  // Upload file and generate diagram
  async uploadFile(
    file: File,
    model?: string,
    diagramType?: string
  ): Promise<GenerateDiagramResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (model) formData.append('model', model);
    if (diagramType) formData.append('diagram_type', diagramType);

    const response = await api.post<GenerateDiagramResponse>('/api/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get available models
  async getModels(): Promise<ModelsResponse> {
    const response = await api.get<ModelsResponse>('/api/models');
    return response.data;
  },

  // Validate API key
  async validateKey(model: string, apiKey: string): Promise<{ valid: boolean; message: string }> {
    const response = await api.post('/api/validate-key', { model, api_key: apiKey });
    return response.data;
  },

  // Get system prompts
  async getSystemPrompts(): Promise<SystemPromptsResponse> {
    const response = await api.get<SystemPromptsResponse>('/api/system-prompts');
    return response.data;
  },

  // Get list of saved diagrams
  async getDiagrams(params?: DiagramListParams): Promise<DiagramsResponse> {
    const response = await api.get<DiagramsResponse>('/api/diagrams', { params });
    return response.data;
  },

  // Get a specific diagram by ID
  async getDiagram(id: number): Promise<Diagram> {
    const response = await api.get<Diagram>(`/api/diagrams/${id}`);
    return response.data;
  },

  // Delete a diagram by ID
  async deleteDiagram(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/api/diagrams/${id}`);
    return response.data;
  },

  // Generate prompt from diagram
  async generatePrompt(request: GeneratePromptRequest): Promise<GeneratePromptResponse> {
    const response = await api.post<GeneratePromptResponse>('/api/generate-prompt', request, {
      timeout: 60000, // 60 seconds timeout for prompt generation
    });
    return response.data;
  },

  // Get list of generated prompts
  async getGeneratedPrompts(params?: GeneratedPromptsListParams): Promise<GeneratedPromptsResponse> {
    const response = await api.get<GeneratedPromptsResponse>('/api/generated-prompts', { params });
    return response.data;
  },

  // Get a specific generated prompt by ID
  async getGeneratedPrompt(id: number): Promise<GeneratedPrompt> {
    const response = await api.get<GeneratedPrompt>(`/api/generated-prompts/${id}`);
    return response.data;
  },

  // Delete a generated prompt by ID
  async deleteGeneratedPrompt(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/api/generated-prompts/${id}`);
    return response.data;
  },
};

export default apiService;