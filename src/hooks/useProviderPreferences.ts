import { useState, useEffect } from 'react';

interface ProviderPreferences {
  provider: string;
  model: string;
}

interface UseProviderPreferencesReturn {
  selectedProvider: string;
  selectedModel: string;
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;
  savePreferences: () => void;
  loadPreferences: () => void;
  clearPreferences: () => void;
}

const STORAGE_KEYS = {
  PROVIDER: 'preferredProvider',
  MODEL: 'preferredModel'
};

/**
 * Custom hook for managing LLM provider preferences with localStorage persistence
 * Automatically saves preferences when provider or model changes
 */
export const useProviderPreferences = (
  context: string = 'default'
): UseProviderPreferencesReturn => {
  const [selectedProvider, setSelectedProviderState] = useState<string>('');
  const [selectedModel, setSelectedModelState] = useState<string>('');

  // Create context-specific storage keys if needed
  const getStorageKey = (key: string) => {
    return context === 'default' ? key : `${key}_${context}`;
  };

  // Load preferences from localStorage on mount
  useEffect(() => {
    loadPreferences();
  }, [context]);

  // Auto-save provider preference when it changes
  useEffect(() => {
    if (selectedProvider) {
      localStorage.setItem(getStorageKey(STORAGE_KEYS.PROVIDER), selectedProvider);
    }
  }, [selectedProvider, context]);

  // Auto-save model preference when it changes
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem(getStorageKey(STORAGE_KEYS.MODEL), selectedModel);
    }
  }, [selectedModel, context]);

  const setSelectedProvider = (provider: string) => {
    setSelectedProviderState(provider);
  };

  const setSelectedModel = (model: string) => {
    setSelectedModelState(model);
  };

  const loadPreferences = () => {
    const savedProvider = localStorage.getItem(getStorageKey(STORAGE_KEYS.PROVIDER));
    const savedModel = localStorage.getItem(getStorageKey(STORAGE_KEYS.MODEL));

    if (savedProvider) {
      setSelectedProviderState(savedProvider);
    }
    if (savedModel) {
      setSelectedModelState(savedModel);
    }
  };

  const savePreferences = () => {
    if (selectedProvider) {
      localStorage.setItem(getStorageKey(STORAGE_KEYS.PROVIDER), selectedProvider);
    }
    if (selectedModel) {
      localStorage.setItem(getStorageKey(STORAGE_KEYS.MODEL), selectedModel);
    }
  };

  const clearPreferences = () => {
    localStorage.removeItem(getStorageKey(STORAGE_KEYS.PROVIDER));
    localStorage.removeItem(getStorageKey(STORAGE_KEYS.MODEL));
    setSelectedProviderState('');
    setSelectedModelState('');
  };

  return {
    selectedProvider,
    selectedModel,
    setSelectedProvider,
    setSelectedModel,
    savePreferences,
    loadPreferences,
    clearPreferences
  };
};

/**
 * Get global provider preferences (used across all generation features)
 */
export const getGlobalProviderPreferences = (): ProviderPreferences => {
  return {
    provider: localStorage.getItem(STORAGE_KEYS.PROVIDER) || '',
    model: localStorage.getItem(STORAGE_KEYS.MODEL) || ''
  };
};

/**
 * Get provider preferences with fallback logic
 * First tries course-specific preferences, then falls back to global preferences
 */
export const getProviderPreferencesWithFallback = (context: string = 'course'): ProviderPreferences => {
  const contextProvider = localStorage.getItem(`${STORAGE_KEYS.PROVIDER}_${context}`);
  const contextModel = localStorage.getItem(`${STORAGE_KEYS.MODEL}_${context}`);
  
  // If context-specific preferences exist, use them
  if (contextProvider || contextModel) {
    return {
      provider: contextProvider || '',
      model: contextModel || ''
    };
  }
  
  // Otherwise, fall back to global preferences
  return getGlobalProviderPreferences();
};

/**
 * Set global provider preferences (used across all generation features)
 */
export const setGlobalProviderPreferences = (preferences: Partial<ProviderPreferences>) => {
  if (preferences.provider) {
    localStorage.setItem(STORAGE_KEYS.PROVIDER, preferences.provider);
  }
  if (preferences.model) {
    localStorage.setItem(STORAGE_KEYS.MODEL, preferences.model);
  }
};