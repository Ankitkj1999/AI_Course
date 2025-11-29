import { useState } from 'react';
import type { AIModalContext } from '../ui/AIModal';
import { aiService } from '../services/aiService';

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
    setSelectedText('');
  };

  const executeAI = async (prompt: string) => {
    // This will be called by the modal and should integrate with the editor
    console.log('Executing AI with prompt:', prompt);
    await aiService.executePrompt(prompt);
  };

  return {
    isOpen,
    context,
    selectedText,
    openModal,
    closeModal,
    executeAI,
  };
};