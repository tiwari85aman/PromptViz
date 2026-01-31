import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Calendar, 
  Cpu, 
  Type,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2
} from 'lucide-react';
import apiService from '../services/api';
import type { Diagram, DiagramListParams } from '../types/api';
import { announceToScreenReader } from '../utils/accessibility';

interface DiagramHistoryProps {
  onLoadDiagram: (diagram: Diagram) => void;
  onClose: () => void;
}

const DiagramHistory: React.FC<DiagramHistoryProps> = ({ onLoadDiagram, onClose }) => {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedDiagramType, setSelectedDiagramType] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filters
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableDiagramTypes, setAvailableDiagramTypes] = useState<string[]>([]);

  const fetchDiagrams = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: DiagramListParams = {
        limit,
        offset,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (selectedModel) {
        params.model = selectedModel;
      }
      if (selectedDiagramType) {
        params.diagram_type = selectedDiagramType;
      }

      const response = await apiService.getDiagrams(params);
      setDiagrams(response.diagrams);
      setTotal(response.total);

      // Extract unique values for filters
      const models = new Set<string>();
      const types = new Set<string>();
      response.diagrams.forEach(diagram => {
        models.add(diagram.model_used);
        types.add(diagram.diagram_type);
      });
      setAvailableModels(Array.from(models).sort());
      setAvailableDiagramTypes(Array.from(types).sort());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diagrams');
      announceToScreenReader('Failed to load diagram history');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedModel, selectedDiagramType, offset, limit]);

  useEffect(() => {
    fetchDiagrams();
  }, [fetchDiagrams]);

  const handleDelete = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this diagram?')) {
      return;
    }

    try {
      await apiService.deleteDiagram(id);
      announceToScreenReader('Diagram deleted successfully');
      // Refresh the list
      fetchDiagrams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete diagram');
      announceToScreenReader('Failed to delete diagram');
    }
  };

  const handleLoadDiagram = (diagram: Diagram) => {
    onLoadDiagram(diagram);
    onClose();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedModel('');
    setSelectedDiagramType('');
    setOffset(0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const hasActiveFilters = searchQuery || selectedModel || selectedDiagramType;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <main className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close history"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Diagram History</h2>
              <p className="text-sm text-gray-600">
                {total} {total === 1 ? 'diagram' : 'diagrams'} saved
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-white text-primary-600 rounded-full px-2 py-0.5 text-xs">
                  Active
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search diagrams by prompt or code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOffset(0);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Cpu className="w-4 h-4 inline mr-1" />
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    setOffset(0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Models</option>
                  {availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Type className="w-4 h-4 inline mr-1" />
                  Diagram Type
                </label>
                <select
                  value={selectedDiagramType}
                  onChange={(e) => {
                    setSelectedDiagramType(e.target.value);
                    setOffset(0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {availableDiagramTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4">
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading && diagrams.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto" />
              <p className="text-gray-600">Loading diagrams...</p>
            </div>
          </div>
        ) : error && diagrams.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <p className="text-error text-lg font-medium">{error}</p>
              <button
                onClick={fetchDiagrams}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : diagrams.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <p className="text-gray-600 text-lg">No diagrams found</p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                onClick={() => handleLoadDiagram(diagram)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {truncateText(diagram.original_prompt, 80)}
                      </h3>
                      {!diagram.success && (
                        <span className="px-2 py-1 bg-error/10 text-error text-xs font-medium rounded">
                          Failed
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(diagram.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Cpu className="w-4 h-4" />
                        <span>{diagram.model_used}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Type className="w-4 h-4" />
                        <span>{diagram.diagram_type}</span>
                      </div>
                      {diagram.processing_time && (
                        <span>{diagram.processing_time.toFixed(2)}s</span>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded p-3 font-mono text-xs text-gray-700 overflow-hidden">
                      <pre className="whitespace-pre-wrap break-words">
                        {truncateText(diagram.mermaid_code, 200)}
                      </pre>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => handleLoadDiagram(diagram)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Load diagram"
                      aria-label="Load diagram"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(diagram.id, e)}
                      className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                      title="Delete diagram"
                      aria-label="Delete diagram"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} diagrams
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setOffset(Math.min((totalPages - 1) * limit, offset + limit))}
                disabled={offset + limit >= total}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default DiagramHistory;
