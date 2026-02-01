import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MobileSidebar from './components/MobileSidebar';
import DiagramCanvas from './components/DiagramCanvas';
import DiagramHistory from './components/DiagramHistory';
import SettingsModal from './components/SettingsModal';
import { SettingsProvider } from './contexts/SettingsContext';
import apiService from './services/api';
import type { GenerateDiagramResponse, Diagram } from './types/api';

interface GenerationState {
  isLoading: boolean;
  result: GenerateDiagramResponse | null;
  error: string | null;
  originalPrompt?: string;
  diagramId?: number;
}

type ViewMode = 'main' | 'history';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [generationState, setGenerationState] = useState<GenerationState>({
    isLoading: false,
    result: null,
    error: null,
    originalPrompt: undefined,
    diagramId: undefined,
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Check API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiService.health();
        console.log('API connection established');
      } catch (error) {
        console.warn('API health check failed:', error);
      }
    };
    checkHealth();
  }, []);

  const handleGenerate = async (data: {
    prompt: string;
    model: string;
    diagramType: string;
    inputType: 'text' | 'file';
    file?: File;
  }) => {
    setGenerationState({
      isLoading: true,
      result: null,
      error: null,
      originalPrompt: data.prompt,
      diagramId: undefined,
    });

    try {
      let result: GenerateDiagramResponse;
      let promptUsed = data.prompt;

      if (data.inputType === 'file' && data.file) {
        // Read file content for original prompt
        promptUsed = await data.file.text();
        result = await apiService.uploadFile(data.file, data.model, data.diagramType);
      } else {
        result = await apiService.generateDiagram({
          prompt: data.prompt,
          model: data.model,
          diagram_type: data.diagramType,
        });
      }

      setGenerationState({
        isLoading: false,
        result,
        error: null,
        originalPrompt: promptUsed,
        diagramId: undefined, // We don't have the ID from generation response
      });
      // Switch to main view after generation
      setViewMode('main');
    } catch (error) {
      setGenerationState({
        isLoading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Generation failed',
        originalPrompt: data.prompt,
        diagramId: undefined,
      });
    }
  };

  const handleLoadDiagram = (diagram: Diagram) => {
    // Convert Diagram to GenerateDiagramResponse format
    const result: GenerateDiagramResponse = {
      mermaid_code: diagram.mermaid_code,
      success: diagram.success,
      ai_model_used: diagram.model_used,
      processing_time: diagram.processing_time,
      error_message: diagram.error_message,
    };

    setGenerationState({
      isLoading: false,
      result,
      error: null,
      originalPrompt: diagram.original_prompt,
      diagramId: diagram.id,
    });
    setViewMode('main');
  };

  const handleShowHistory = () => {
    setViewMode('history');
  };

  const handleCloseHistory = () => {
    setViewMode('main');
  };

  return (
    <SettingsProvider>
      <div className="h-screen flex flex-col bg-gray-50">
        <Header 
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          onHistoryClick={handleShowHistory}
          onSettingsClick={() => setIsSettingsOpen(true)}
          showBackButton={viewMode === 'history'}
          onBackClick={handleCloseHistory}
        />
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'history' ? (
          <DiagramHistory
            onLoadDiagram={handleLoadDiagram}
            onClose={handleCloseHistory}
          />
        ) : (
          <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
              <Sidebar 
                onGenerate={handleGenerate}
                isGenerating={generationState.isLoading}
              />
            </div>
            
            {/* Mobile Sidebar */}
            <MobileSidebar
              isOpen={isMobileSidebarOpen}
              onClose={() => setIsMobileSidebarOpen(false)}
              onGenerate={handleGenerate}
              isGenerating={generationState.isLoading}
            />
            
            <DiagramCanvas
              mermaidCode={generationState.result?.mermaid_code}
              isLoading={generationState.isLoading}
              error={generationState.error || undefined}
              processingTime={generationState.result?.processing_time}
              modelUsed={generationState.result?.ai_model_used}
              originalPrompt={generationState.originalPrompt}
              diagramId={generationState.diagramId}
            />
          </>
        )}
      </div>
    </div>
    </SettingsProvider>
  );
}

export default App;
