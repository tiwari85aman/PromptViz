import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import type { ModelInfo } from '../types/api';

interface Settings {
  defaultModel: string;
  showModelSelectorPerAction: boolean;
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  availableModels: ModelInfo[];
  isLoadingModels: boolean;
  refreshModels: () => Promise<void>;
  apiWarning: string | null;
  hasAvailableModels: boolean;
}

const STORAGE_KEY = 'promptviz_settings';

const DEFAULT_SETTINGS: Settings = {
  defaultModel: 'gemini/gemini-2.0-flash',
  showModelSelectorPerAction: false,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [apiWarning, setApiWarning] = useState<string | null>(null);

  // Load available models on mount
  const loadModels = useCallback(async () => {
    setIsLoadingModels(true);
    setApiWarning(null);
    try {
      const response = await apiService.getModels();
      setAvailableModels(response.models);
      
      // Check for warning from API (e.g., no API keys configured)
      if (response.warning) {
        setApiWarning(response.warning);
      }
      
      // If the current default model isn't available, switch to the first available one
      const modelNames = response.models.filter(m => m.available).map(m => m.name);
      if (modelNames.length > 0 && !modelNames.includes(settings.defaultModel)) {
        setSettings(prev => ({ ...prev, defaultModel: modelNames[0] }));
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      setApiWarning('Failed to connect to backend. Please check if the server is running.');
      // Set empty models on error - don't show fake available models
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [settings.defaultModel]);
  
  // Compute if any models are actually available
  const hasAvailableModels = availableModels.some(m => m.available);

  useEffect(() => {
    loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const refreshModels = useCallback(async () => {
    await loadModels();
  }, [loadModels]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        availableModels,
        isLoadingModels,
        refreshModels,
        apiWarning,
        hasAvailableModels,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
