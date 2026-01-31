import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  FileCode, 
  FileText,
  Loader2,
  AlertCircle,
  Download,
  ChevronDown,
} from 'lucide-react';
import { Node, Edge } from 'reactflow';
import apiService from '../services/api';
import type { ModelInfo } from '../types/api';

export type PromptFormat = 'xml' | 'markdown';

interface PromptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  originalPrompt?: string;
  diagramId?: number;
}

const PromptGeneratorModal: React.FC<PromptGeneratorModalProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
  originalPrompt,
  diagramId,
}) => {
  const [format, setFormat] = useState<PromptFormat>('xml');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  // Load available models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await apiService.getModels();
        setAvailableModels(response.models);
      } catch (err) {
        console.error('Failed to load models:', err);
        setAvailableModels([
          { name: 'gpt-4', provider: 'OpenAI', available: true },
          { name: 'gpt-3.5-turbo', provider: 'OpenAI', available: true },
        ]);
      }
    };
    if (isOpen) {
      loadModels();
    }
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setGeneratedPrompt(null);
      setError(null);
      setCopied(false);
      setProcessingTime(null);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedPrompt(null);

    try {
      // Convert nodes and edges to the format expected by the API
      const diagramStructure = {
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
          label: edge.label as string | undefined,
        })),
      };

      const response = await apiService.generatePrompt({
        diagram_structure: diagramStructure,
        original_prompt: originalPrompt,
        prompt_format: format,
        model: selectedModel,
        diagram_id: diagramId,
      });

      if (response.success) {
        setGeneratedPrompt(response.generated_prompt);
        setProcessingTime(response.processing_time || null);
      } else {
        setError(response.error_message || 'Failed to generate prompt');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedPrompt) {
      try {
        await navigator.clipboard.writeText(generatedPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleDownload = () => {
    if (generatedPrompt) {
      const extension = format === 'xml' ? 'xml' : 'md';
      const blob = new Blob([generatedPrompt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-prompt.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Generate Prompt</h2>
              <p className="text-sm text-gray-500">Create a structured prompt from your diagram</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Format
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat('xml')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    format === 'xml'
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <FileCode className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">XML</div>
                    <div className="text-xs opacity-75">Anthropic-style</div>
                  </div>
                </button>
                <button
                  onClick={() => setFormat('markdown')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    format === 'markdown'
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Markdown</div>
                    <div className="text-xs opacity-75">Structured MD</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Model
              </label>
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full appearance-none px-4 py-3 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                >
                  {availableModels.map((model) => (
                    <option key={model.name} value={model.name} disabled={!model.available}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Diagram Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Diagram Summary</h3>
            <div className="flex gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-primary-500 rounded-full" />
                {nodes.length} nodes
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                {edges.length} connections
              </span>
            </div>
            {originalPrompt && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Original prompt available for context</p>
                <p className="text-sm text-gray-700 line-clamp-2">{originalPrompt}</p>
              </div>
            )}
          </div>

          {/* Generate Button */}
          {!generatedPrompt && !error && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || nodes.length === 0}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all ${
                isGenerating || nodes.length === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating prompt...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate {format.toUpperCase()} Prompt
                </>
              )}
            </button>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Generation Failed</h4>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                  <button
                    onClick={handleGenerate}
                    className="mt-3 text-sm font-medium text-red-700 hover:text-red-800"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generated Prompt */}
          {generatedPrompt && (
            <div className="space-y-4">
              {/* Success Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Prompt Generated</span>
                  {processingTime && (
                    <span className="text-sm text-gray-500">
                      ({processingTime.toFixed(1)}s)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>

              {/* Prompt Content */}
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
                  <span className="text-sm font-medium text-gray-300">
                    {format === 'xml' ? 'XML Format' : 'Markdown Format'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {generatedPrompt.split('\n').length} lines
                  </span>
                </div>
                <pre className="p-4 text-sm text-gray-100 overflow-auto max-h-[300px] font-mono whitespace-pre-wrap">
                  {generatedPrompt}
                </pre>
              </div>

              {/* Regenerate Button */}
              <button
                onClick={() => {
                  setGeneratedPrompt(null);
                  setError(null);
                }}
                className="w-full py-3 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              >
                Generate with different settings
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            The generated prompt is based on your diagram structure and follows best practices for AI prompting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PromptGeneratorModal;
