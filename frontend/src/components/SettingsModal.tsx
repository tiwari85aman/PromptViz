import React from 'react';
import { X, Cpu, Check, RefreshCw, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, availableModels, isLoadingModels, refreshModels, apiWarning, hasAvailableModels } = useSettings();

  if (!isOpen) return null;

  const selectedModelInfo = availableModels.find(m => m.name === settings.defaultModel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              <p className="text-sm text-gray-500">Configure your preferences</p>
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
        <div className="p-6 space-y-6">
          {/* Warning Banner */}
          {(apiWarning || !hasAvailableModels) && !isLoadingModels && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  {apiWarning || 'No AI models available'}
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Configure API keys in your environment variables to enable AI features.
                </p>
              </div>
            </div>
          )}

          {/* Default Model Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-900">
                Default AI Model
              </label>
              <button
                onClick={refreshModels}
                disabled={isLoadingModels}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="Refresh models"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="space-y-2">
              {isLoadingModels ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading models...</span>
                </div>
              ) : (
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {availableModels.map((model) => (
                    <button
                      key={model.name}
                      onClick={() => model.available && updateSettings({ defaultModel: model.name })}
                      disabled={!model.available}
                      className={`relative flex items-center justify-between w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${
                        settings.defaultModel === model.name
                          ? 'border-primary-500 bg-primary-50'
                          : model.available
                          ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            settings.defaultModel === model.name 
                              ? 'text-primary-700' 
                              : 'text-gray-900'
                          }`}>
                            {model.name}
                          </span>
                          {!model.available && (
                            <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{model.provider}</span>
                      </div>
                      {settings.defaultModel === model.name && (
                        <div className="flex-shrink-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedModelInfo && (
              <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                Currently using <span className="font-medium">{selectedModelInfo.name}</span> from {selectedModelInfo.provider}. 
                This will be used for all diagram generation and prompt creation.
              </p>
            )}
          </div>

          {/* Show Model Selector Per Action Toggle */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div className="flex-1 pr-4">
              <label className="block text-sm font-semibold text-gray-900">
                Show model selector per action
              </label>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, you can override the default model for each generation
              </p>
            </div>
            <button
              onClick={() => updateSettings({ 
                showModelSelectorPerAction: !settings.showModelSelectorPerAction 
              })}
              className="flex-shrink-0"
            >
              {settings.showModelSelectorPerAction ? (
                <ToggleRight className="w-10 h-10 text-primary-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Settings are saved automatically
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
