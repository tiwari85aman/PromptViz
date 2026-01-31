import React, { useState } from 'react';
import { Node } from 'reactflow';
import { 
  Plus, 
  Trash2, 
  Undo2, 
  Redo2, 
  Square, 
  Diamond, 
  Circle, 
  Hexagon,
  ChevronDown,
  Sparkles,
  ArrowRightLeft,
  Database,
  MessageSquare,
} from 'lucide-react';
import { MermaidNodeType } from '../utils/mermaidToReactFlow';

interface EditToolbarProps {
  selectedNodeType: MermaidNodeType;
  onNodeTypeChange: (type: MermaidNodeType) => void;
  onAddNode: () => void;
  onDeleteSelected: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  selectedNode?: Node;
  onChangeNodeType: (nodeId: string, newType: MermaidNodeType) => void;
  onGeneratePrompt?: () => void;
}

const NODE_TYPES: { type: MermaidNodeType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'rectangle', label: 'Instruction', icon: <Square className="w-4 h-4" />, color: 'bg-gray-100 border-gray-300' },
  { type: 'diamond', label: 'Decision', icon: <Diamond className="w-4 h-4" />, color: 'bg-amber-50 border-amber-400' },
  { type: 'rounded', label: 'Context', icon: <MessageSquare className="w-4 h-4" />, color: 'bg-emerald-50 border-emerald-400' },
  { type: 'hexagon', label: 'Output', icon: <Hexagon className="w-4 h-4" />, color: 'bg-purple-50 border-purple-400' },
  { type: 'parallelogram', label: 'I/O', icon: <ArrowRightLeft className="w-4 h-4" />, color: 'bg-cyan-50 border-cyan-400' },
  { type: 'cylinder', label: 'Storage', icon: <Database className="w-4 h-4" />, color: 'bg-rose-50 border-rose-400' },
  { type: 'circle', label: 'Event', icon: <Circle className="w-4 h-4" />, color: 'bg-indigo-50 border-indigo-400' },
];

const EditToolbar: React.FC<EditToolbarProps> = ({
  selectedNodeType,
  onNodeTypeChange,
  onAddNode,
  onDeleteSelected,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  hasSelection,
  selectedNode,
  onChangeNodeType,
  onGeneratePrompt,
}) => {
  const [showNodeTypeDropdown, setShowNodeTypeDropdown] = useState(false);
  const [showChangeTypeDropdown, setShowChangeTypeDropdown] = useState(false);

  const currentNodeType = NODE_TYPES.find(t => t.type === selectedNodeType);
  const selectedNodeTypeInfo = selectedNode ? NODE_TYPES.find(t => t.type === selectedNode.type) : null;

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2 flex items-center gap-2">
      {/* Node Type Selector */}
      <div className="relative">
        <button
          onClick={() => setShowNodeTypeDropdown(!showNodeTypeDropdown)}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
          title="Select node type to add"
        >
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${currentNodeType?.color}`}>
            {currentNodeType?.icon}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">
            {currentNodeType?.label}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {showNodeTypeDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
            {NODE_TYPES.map(({ type, label, icon, color }) => (
              <button
                key={type}
                onClick={() => {
                  onNodeTypeChange(type);
                  setShowNodeTypeDropdown(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors ${
                  selectedNodeType === type ? 'bg-primary-50' : ''
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${color}`}>
                  {icon}
                </div>
                <span className="text-sm text-gray-700">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Node Button */}
      <button
        onClick={onAddNode}
        className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white transition-colors"
        title="Add new node (or double-click on canvas)"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Add</span>
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* Change Selected Node Type */}
      {selectedNode && (
        <div className="relative">
          <button
            onClick={() => setShowChangeTypeDropdown(!showChangeTypeDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
            title="Change selected node type"
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedNodeTypeInfo?.color}`}>
              {selectedNodeTypeInfo?.icon}
            </div>
            <span className="text-sm text-gray-600 hidden sm:inline">Change Type</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {showChangeTypeDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
              {NODE_TYPES.map(({ type, label, icon, color }) => (
                <button
                  key={type}
                  onClick={() => {
                    onChangeNodeType(selectedNode.id, type);
                    setShowChangeTypeDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors ${
                    selectedNode.type === type ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${color}`}>
                    {icon}
                  </div>
                  <span className="text-sm text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Selected */}
      <button
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
          hasSelection
            ? 'bg-red-50 hover:bg-red-100 text-red-600'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        title="Delete selected (Delete key)"
      >
        <Trash2 className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Delete</span>
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded-md transition-colors ${
            canUndo
              ? 'hover:bg-gray-100 text-gray-700'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="Undo (Cmd+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded-md transition-colors ${
            canRedo
              ? 'hover:bg-gray-100 text-gray-700'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-200" />

      {/* Generate Prompt Button */}
      {onGeneratePrompt && (
        <button
          onClick={onGeneratePrompt}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white transition-all shadow-sm hover:shadow"
          title="Generate prompt from diagram"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Generate Prompt</span>
        </button>
      )}
    </div>
  );
};

export default EditToolbar;
