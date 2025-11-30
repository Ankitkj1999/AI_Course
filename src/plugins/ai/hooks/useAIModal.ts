import { useState } from 'react';
import type { AIModalContext } from '../ui/AIModal';

/**
 * Hook for managing AI modal state
 * Keeps UI state separate from editor integration
 */
export const useAIModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<AIModalContext>('toolbar');
  const [selectedText, setSelectedText] = useState<string>('');

  const openModal = (modalContext: AIModalContext, text?: string) => {
    setContext(modalContext);
    setSelectedText(text || '');
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Don't clear selectedText immediately to avoid UI flash
    setTimeout(() => setSelectedText(''), 300);
  };

  return {
    isOpen,
    context,
    selectedText,
    openModal,
    closeModal,
  };
};
