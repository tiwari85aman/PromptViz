import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { Node, Edge } from 'reactflow';
import { 
  Code, 
  Eye, 
  Download, 
  Share2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  Lightbulb,
  GitBranch,
  Edit3,
} from 'lucide-react';
import { announceToScreenReader } from '../utils/accessibility';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import ReactFlowDiagram, { DiagramState } from './ReactFlowDiagram';
import PromptGeneratorModal from './PromptGeneratorModal';
import { reactFlowToMermaid } from '../utils/reactFlowToPromptFormat';

interface DiagramCanvasProps {
  mermaidCode?: string;
  isLoading: boolean;
  error?: string;
  processingTime?: number;
  modelUsed?: string;
  originalPrompt?: string;
  diagramId?: number;
}

type ViewMode = 'mermaid' | 'reactflow' | 'code';

const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  mermaidCode,
  isLoading,
  error,
  processingTime,
  modelUsed,
  originalPrompt,
  diagramId,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('reactflow');
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [, setMermaidError] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  
  // State for diagram editing
  const [currentDiagramState, setCurrentDiagramState] = useState<DiagramState | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Cycle through view modes with keyboard
  const cycleViewMode = useCallback(() => {
    setViewMode(prev => {
      if (prev === 'mermaid') return 'reactflow';
      if (prev === 'reactflow') return 'code';
      return 'mermaid';
    });
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleView: cycleViewMode,
    enabled: !!mermaidCode,
  });

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });
  }, []);

  // Reset modified state when mermaidCode changes
  useEffect(() => {
    setIsModified(false);
    setCurrentDiagramState(null);
  }, [mermaidCode]);

  // Sanitize Mermaid code to remove invalid characters
  const sanitizeMermaidCode = (code: string): string => {
    if (!code) return code;
    
    let sanitized = code;
    
    // Remove parentheses from node labels - replace with dashes
    while (/\[([^\]]*)\(([^)]*)\)([^\]]*)\]/.test(sanitized)) {
      sanitized = sanitized.replace(/\[([^\]]*)\(([^)]*)\)([^\]]*)\]/g, (match, before, parenContent, after) => {
        return `[${before}${after ? after.trim() : ''} - ${parenContent}]`;
      });
    }
    
    // Remove triple backticks that might be in labels
    sanitized = sanitized.replace(/```/g, '');
    
    // Fix common syntax issues
    sanitized = sanitized.replace(/]\s+([A-Z]{2,})\s*(\n|$)/g, ']$2');
    sanitized = sanitized.replace(/\]\s*([A-Z]{2,})\s*$/gm, ']');
    sanitized = sanitized.replace(/(-->[^\[\n]*\[[^\]]+\])\s+([A-Z]{2,})\s*(\n|$)/g, '$1$3');
    sanitized = sanitized.replace(/[ \t]{2,}/g, ' ');
    
    return sanitized.trim();
  };

  // Render Mermaid diagram when viewMode is 'mermaid'
  useEffect(() => {
    if (viewMode === 'mermaid' && mermaidCode && diagramRef.current) {
      setMermaidError(null);
      
      // Use modified diagram if available, otherwise use original
      const codeToRender = isModified && currentDiagramState 
        ? reactFlowToMermaid(currentDiagramState.nodes, currentDiagramState.edges)
        : mermaidCode;
      
      try {
        diagramRef.current.innerHTML = '';
        const id = `mermaid-${Date.now()}`;
        const sanitizedCode = sanitizeMermaidCode(codeToRender);
        
        mermaid.render(id, sanitizedCode)
          .then((result) => {
            if (diagramRef.current) {
              diagramRef.current.innerHTML = result.svg;
              setMermaidError(null);
            }
          })
          .catch((err: any) => {
            console.error('Mermaid rendering error:', err);
            const errorMessage = err?.message || err?.toString() || 'Unknown Mermaid parsing error';
            setMermaidError(errorMessage);
            
            if (diagramRef.current) {
              diagramRef.current.innerHTML = `
                <div class="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
                  <div class="flex items-center space-x-2 text-red-800 mb-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    <h3 class="font-semibold">Mermaid Parsing Error</h3>
                  </div>
                  <p class="text-sm text-red-700 mb-4">${errorMessage}</p>
                  <p class="text-xs text-red-600">Try switching to code view to see and fix the Mermaid syntax.</p>
                </div>
              `;
            }
          });
      } catch (err: any) {
        console.error('Mermaid rendering error (sync):', err);
        const errorMessage = err?.message || err?.toString() || 'Unknown Mermaid parsing error';
        setMermaidError(errorMessage);
      }
    }
  }, [mermaidCode, viewMode, isModified, currentDiagramState]);

  // Handle diagram changes from ReactFlow
  const handleDiagramChange = useCallback((state: DiagramState) => {
    setCurrentDiagramState(state);
    setIsModified(true);
  }, []);

  // Handle generate prompt button click
  const handleGeneratePrompt = useCallback(() => {
    setShowPromptModal(true);
  }, []);

  const handleCopyCode = async () => {
    const codeToCopy = isModified && currentDiagramState 
      ? reactFlowToMermaid(currentDiagramState.nodes, currentDiagramState.edges)
      : mermaidCode;
      
    if (codeToCopy) {
      try {
        await navigator.clipboard.writeText(codeToCopy);
        setCopied(true);
        announceToScreenReader('Code copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        announceToScreenReader('Failed to copy code');
      }
    }
  };

  const handleDownload = () => {
    const codeToDownload = isModified && currentDiagramState 
      ? reactFlowToMermaid(currentDiagramState.nodes, currentDiagramState.edges)
      : mermaidCode;
      
    if (!codeToDownload) return;
    
    const blob = new Blob([codeToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.mmd';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.2));
  const handleResetZoom = () => setZoom(1);

  // Get current code for display
  const displayCode = isModified && currentDiagramState 
    ? reactFlowToMermaid(currentDiagramState.nodes, currentDiagramState.edges)
    : mermaidCode || '';

  // Loading state
  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Generating Diagram...</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-primary-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">AI is analyzing your prompt</h3>
              <p className="text-gray-600">This usually takes 10-30 seconds...</p>
            </div>
            <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
              <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex-1 flex flex-col bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Generation Failed</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Something went wrong</h3>
              <p className="text-gray-600">{error}</p>
            </div>
            <div className="space-y-2 text-sm text-gray-500">
              <p className="font-medium">Try these solutions:</p>
              <ul className="text-left space-y-1">
                <li>• Check your internet connection</li>
                <li>• Simplify your prompt</li>
                <li>• Try a different AI model</li>
                <li>• Refresh the page</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Empty state
  if (!mermaidCode) {
    return (
      <main className="flex-1 flex flex-col bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Welcome to PromptViz</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg text-center space-y-6">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Lightbulb className="w-10 h-10 text-primary-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">Transform Text into Visual Diagrams</h3>
              <p className="text-gray-600">
                Enter your system prompt or upload a file to generate beautiful, interactive diagrams
                that help you understand and communicate complex AI workflows.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Text Input</h4>
                <p className="text-gray-600">Write or paste your system prompt directly</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">File Upload</h4>
                <p className="text-gray-600">Drag and drop .txt or .md files</p>
              </div>
            </div>
            <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
              <p className="text-sm text-primary-800">
                <strong>Pro tip:</strong> More detailed prompts create richer, more insightful diagrams
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Success state with diagram
  return (
    <main className="flex-1 flex flex-col bg-gray-50">
      {/* Header with controls */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Generated Diagram</h2>
            {processingTime && (
              <span className="text-sm text-gray-500">
                Generated in {processingTime.toFixed(1)}s
              </span>
            )}
            {modelUsed && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {modelUsed}
              </span>
            )}
            {isModified && (
              <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                <Edit3 className="w-3 h-3" />
                Modified
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View mode toggle - 3 options */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('reactflow')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  viewMode === 'reactflow'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Interactive view with drag & drop"
              >
                <GitBranch className="w-4 h-4" />
                <span className="hidden sm:inline">Interactive</span>
              </button>
              <button
                onClick={() => setViewMode('mermaid')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  viewMode === 'mermaid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Original Mermaid rendering"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Mermaid</span>
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  viewMode === 'code'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="View Mermaid source code"
              >
                <Code className="w-4 h-4" />
                <span className="hidden sm:inline">Code</span>
              </button>
            </div>

            {/* Zoom controls (only for mermaid view) */}
            {viewMode === 'mermaid' && (
              <div className="flex items-center space-x-1 border-l border-gray-200 pl-3">
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-500 min-w-[4rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="Reset zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-1 border-l border-gray-200 pl-3">
              <button
                onClick={handleCopyCode}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Copy code"
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">
        {/* ReactFlow Interactive View */}
        {viewMode === 'reactflow' && (
          <div className="absolute inset-0">
            <ReactFlowDiagram 
              mermaidCode={mermaidCode} 
              onDiagramChange={handleDiagramChange}
              onGeneratePrompt={handleGeneratePrompt}
              isEditable={true}
            />
          </div>
        )}

        {/* Mermaid View */}
        {viewMode === 'mermaid' && (
          <div className="h-full overflow-auto p-6">
            <div className="min-h-full flex items-center justify-center">
              <div
                ref={diagramRef}
                className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm min-w-0"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              />
            </div>
          </div>
        )}

        {/* Code View */}
        {viewMode === 'code' && (
          <div className="h-full p-6">
            <div className="h-full bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Mermaid Source Code
                    {isModified && <span className="text-amber-600 ml-2">(Modified)</span>}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {displayCode.split('\n').length} lines
                </span>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <pre className="font-mono text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {displayCode}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Generator Modal */}
      <PromptGeneratorModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        nodes={currentDiagramState?.nodes || []}
        edges={currentDiagramState?.edges || []}
        originalPrompt={originalPrompt}
        diagramId={diagramId}
      />
    </main>
  );
};

export default DiagramCanvas;
