import React, { useState, useEffect } from 'react';
import { Upload, FileText, Cpu, Settings, Rocket } from 'lucide-react';
import apiService from '../services/api';
import type { ModelInfo } from '../types/api';

interface SidebarProps {
  onGenerate: (data: {
    prompt: string;
    model: string;
    diagramType: string;
    inputType: 'text' | 'file';
    file?: File;
  }) => void;
  isGenerating: boolean;
}

const DIAGRAM_TYPES = [
  { value: 'flowchart', label: 'Flowchart', description: 'Process flows and decision trees' },
  { value: 'sequence', label: 'Sequence Diagram', description: 'Interactions over time' },
  { value: 'state', label: 'State Diagram', description: 'State transitions' },
  { value: 'class', label: 'Class Diagram', description: 'Object relationships' },
];

const Sidebar: React.FC<SidebarProps> = ({ onGenerate, isGenerating }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [selectedDiagramType, setSelectedDiagramType] = useState('flowchart');
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Load available models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await apiService.getModels();
        setAvailableModels(response.models);
      } catch (error) {
        console.error('Failed to load models:', error);
        // Fallback to default models
        setAvailableModels([
          { name: 'gpt-4', provider: 'OpenAI', available: true },
          { name: 'gpt-3.5-turbo', provider: 'OpenAI', available: true },
          { name: 'claude-3-sonnet', provider: 'Anthropic', available: true },
        ]);
      }
    };
    loadModels();
  }, []);

  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
    setInputMethod('file');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        handleFileUpload(file);
      }
    }
  };

  const handleGenerate = () => {
    if (inputMethod === 'text' && (!prompt.trim() || prompt.trim().length < 10)) {
      return;
    }
    
    if (inputMethod === 'file' && !selectedFile) {
      return;
    }

    onGenerate({
      prompt: inputMethod === 'text' ? prompt : '',
      model: selectedModel,
      diagramType: selectedDiagramType,
      inputType: inputMethod,
      file: inputMethod === 'file' ? selectedFile || undefined : undefined,
    });
  };

  const canGenerate = () => {
    if (isGenerating) return false;
    if (inputMethod === 'text') return prompt.trim().length >= 10;
    if (inputMethod === 'file') return selectedFile !== null;
    return false;
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-full lg:h-full">
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Model Selection */}
        <div className="space-y-3">
          <label htmlFor="model-select" className="block text-sm font-semibold text-gray-900">
            <Cpu className="w-4 h-4 inline mr-2" />
            AI Model
          </label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
          >
            {availableModels.map((model) => (
              <option 
                key={model.name} 
                value={model.name}
                disabled={!model.available}
              >
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            {availableModels.find(m => m.name === selectedModel)?.provider && 
              `Provider: ${availableModels.find(m => m.name === selectedModel)?.provider}`
            }
          </p>
        </div>

        {/* Diagram Type */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900">
            <Settings className="w-4 h-4 inline mr-2" />
            Diagram Type
          </label>
          <select
            value={selectedDiagramType}
            onChange={(e) => setSelectedDiagramType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
          >
            {DIAGRAM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            {DIAGRAM_TYPES.find(t => t.value === selectedDiagramType)?.description}
          </p>
        </div>

        {/* Input Method */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900">Input Method</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setInputMethod('text')}
              className={`flex-1 flex items-center justify-center p-3 border rounded-lg transition-colors ${
                inputMethod === 'text'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Text Input
            </button>
            <button
              onClick={() => setInputMethod('file')}
              className={`flex-1 flex items-center justify-center p-3 border rounded-lg transition-colors ${
                inputMethod === 'file'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </button>
          </div>
        </div>

        {/* Text Input */}
        {inputMethod === 'text' && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">System Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Enter your system prompt here...

Example: "You are a helpful assistant that..."
Or try: "Act as a content generator that creates..."

💡 Tip: Detailed prompts create richer diagrams`}
              className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent resize-none text-sm"
              disabled={isGenerating}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{prompt.length} characters</span>
              <span>{prompt.length >= 10 ? '✅' : '❌'} Min 10 chars</span>
            </div>
          </div>
        )}

        {/* File Upload */}
        {inputMethod === 'file' && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">Upload File</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver
                  ? 'border-primary-400 bg-primary-50'
                  : selectedFile
                  ? 'border-success bg-success/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="w-8 h-8 text-success mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    Drop your file here or{' '}
                    <label className="text-primary-600 hover:text-primary-700 cursor-pointer">
                      browse
                      <input
                        type="file"
                        accept=".txt,.md"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="sr-only"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-500">Supports .txt and .md files</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate()}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-semibold transition-all ${
            canGenerate()
              ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4 mr-2" />
              Generate Diagram
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;