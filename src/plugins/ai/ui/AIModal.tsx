import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles } from 'lucide-react';

export type AIModalContext = 'toolbar' | 'slash-menu';

export interface AIOption {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: AIModalContext;
  selectedText?: string;
  onExecuteAI: (option: AIOption | null, customPrompt?: string) => Promise<void>;
}

const AIModal: React.FC<AIModalProps> = ({
  isOpen,
  onClose,
  context,
  selectedText,
  onExecuteAI,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Context-aware options
  const getOptions = (): AIOption[] => {
    if (context === 'toolbar' && selectedText) {
      // Options for modifying selected content
      return [
        { id: 'improve', label: 'Improve writing', icon: '✨', description: 'Enhance clarity and style' },
        { id: 'extend', label: 'Make longer', icon: '📏', description: 'Add more details and examples' },
        { id: 'shorten', label: 'Make shorter', icon: '✂️', description: 'Condense while keeping key points' },
        { id: 'simplify', label: 'Simplify language', icon: '🔤', description: 'Use easier words and structure' },
        { id: 'grammar', label: 'Fix grammar', icon: '✓', description: 'Correct spelling and grammar' },
      ];
    } else {
      // Options for generating new content
      return [
        { id: 'continue', label: 'Continue writing', icon: '✍️', description: 'Extend from current content' },
        { id: 'summarize', label: 'Create summary', icon: '📋', description: 'Summarize key points' },
        { id: 'ideas', label: 'Generate ideas', icon: '💡', description: 'Brainstorm related concepts' },
        { id: 'introduction', label: 'Write introduction', icon: '📝', description: 'Create an opening paragraph' },
        { id: 'conclusion', label: 'Write conclusion', icon: '🎯', description: 'Create a closing paragraph' },
      ];
    }
  };

  const options = getOptions();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomPrompt('');
      setSelectedOptionIndex(-1);
      setIsLoading(false);
      // Focus on input after a short delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedOptionIndex(prev =>
          prev < options.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedOptionIndex(prev =>
          prev > 0 ? prev - 1 : options.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedOptionIndex >= 0) {
          handleOptionSelect(options[selectedOptionIndex]);
        } else if (customPrompt.trim()) {
          handleCustomPrompt();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedOptionIndex, customPrompt, options]);

  const handleOptionSelect = async (option: AIOption) => {
    setIsLoading(true);
    try {
      await onExecuteAI(option, undefined);
      onClose();
    } catch (error) {
      console.error('AI execution failed:', error);
      setIsLoading(false);
    }
  };

  const handleCustomPrompt = async () => {
    if (!customPrompt.trim()) return;

    setIsLoading(true);
    try {
      await onExecuteAI(null, customPrompt);
      onClose();
    } catch (error) {
      console.error('Custom prompt failed:', error);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
        className="bg-background border rounded-lg shadow-lg p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Assistant</h3>
        </div>

        {/* Custom Input */}
        <div className="mb-4">
          <Input
            ref={inputRef}
            placeholder="Ask AI anything..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        {/* Context Info */}
        {selectedText && context === 'toolbar' && (
          <div className="mb-3 p-2 bg-muted rounded text-sm text-muted-foreground">
            <div className="font-medium mb-1">Selected text:</div>
            <div className="truncate">"{selectedText}"</div>
          </div>
        )}

        {/* Options */}
        <div className="space-y-1 mb-4 max-h-48 overflow-y-auto">
          {options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option)}
              disabled={isLoading}
              className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                selectedOptionIndex === index
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              }`}
            >
              <span>{option.icon}</span>
              <div>
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCustomPrompt}
            disabled={!customPrompt.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Ask AI
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-3 text-xs text-muted-foreground text-center">
          Press ↑↓ to navigate • Enter to select • Esc to close
        </div>
      </div>
    </div>
  );
};

export default AIModal;