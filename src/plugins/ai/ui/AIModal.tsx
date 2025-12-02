import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Sparkles, Expand, Minimize, Zap, CheckCircle, PenTool, FileText, Lightbulb, BookOpen, Target, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AIModalContext = 'toolbar' | 'slash-menu';

export interface AIOption {
  id: string;
  label: string;
  icon: React.ReactNode;
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Context-aware options
  const getOptions = (): AIOption[] => {
    if (context === 'toolbar' && selectedText) {
      // Options for modifying selected content
      return [
        { id: 'improve', label: 'Improve writing', icon: <Sparkles className="w-5 h-5" /> },
        { id: 'extend', label: 'Make longer', icon: <Expand className="w-5 h-5" /> },
        { id: 'shorten', label: 'Make shorter', icon: <Minimize className="w-5 h-5" /> },
        { id: 'simplify', label: 'Simplify language', icon: <Zap className="w-5 h-5" /> },
        { id: 'grammar', label: 'Fix grammar', icon: <CheckCircle className="w-5 h-5" /> },
      ];
    } else {
      // Options for generating new content
      return [
        { id: 'continue', label: 'Continue writing', icon: <PenTool className="w-5 h-5" /> },
        { id: 'summarize', label: 'Create summary', icon: <FileText className="w-5 h-5" /> },
        { id: 'ideas', label: 'Generate ideas', icon: <Lightbulb className="w-5 h-5" /> },
        { id: 'introduction', label: 'Write introduction', icon: <BookOpen className="w-5 h-5" /> },
        { id: 'conclusion', label: 'Write conclusion', icon: <Target className="w-5 h-5" /> },
      ];
    }
  };

  const allOptions = getOptions();

  // Filter options based on search input
  const filteredOptions = useMemo(() => {
    if (!customPrompt.trim()) return allOptions;
    return allOptions.filter(option =>
      option.label.toLowerCase().includes(customPrompt.toLowerCase())
    );
  }, [allOptions, customPrompt]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomPrompt('');
      setSelectedIndex(-1);
      setIsDropdownOpen(false);
      setIsLoading(false);
      // Focus on input after a short delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setIsDropdownOpen(true)
        setSelectedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[selectedIndex])
        } else if (customPrompt.trim()) {
          handleCustomPrompt()
        }
        break
      case "Escape":
        onClose()
        break
      default:
        // Don't close dropdown on typing, let filtering work
        setSelectedIndex(-1)
        break
    }
  }

  const handleClear = () => {
    setCustomPrompt('')
    setSelectedIndex(-1)
    setIsDropdownOpen(true)
    inputRef.current?.focus()
  }

  const handleInputFocus = () => {
    setIsDropdownOpen(true)
  }

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsDropdownOpen(false)
      setSelectedIndex(-1)
    }, 200)
  }

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-background border border-border rounded-lg shadow-lg overflow-hidden w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-modal-title"
        aria-describedby="ai-modal-description"
      >
        {/* Input with Clear Button */}
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Ask AI anything..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={isLoading}
            className="w-full px-4 py-3 pr-10 text-base border-0 bg-background rounded-none focus:outline-none focus:ring-0"
            aria-label="AI command input"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            role="combobox"
            aria-activedescendant={selectedIndex >= 0 ? `option-${selectedIndex}` : undefined}
          />
          {customPrompt && !isLoading && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-sm hover:bg-muted transition-colors"
              aria-label="Clear input"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div
            className="border-t border-border bg-background max-h-64 overflow-y-auto animate-in slide-in-from-top-2 duration-200"
            role="listbox"
            aria-label="AI command options"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.id}
                  id={`option-${index}`}
                  onClick={() => handleOptionSelect(option)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  disabled={isLoading}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b last:border-b-0 text-sm",
                    selectedIndex === index ? "bg-muted" : "bg-background hover:bg-muted/50",
                  )}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <div className="flex-shrink-0 text-muted-foreground">{option.icon}</div>
                  <span className="flex-1 text-foreground">{option.label}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                No matching commands found
              </div>
            )}
          </div>
        )}

        {/* Hidden accessibility elements */}
        <div id="ai-modal-title" className="sr-only">AI Assistant</div>
        <div id="ai-modal-description" className="sr-only">
          Type to search AI commands or enter a custom prompt. Use arrow keys to navigate, Enter to select.
        </div>
      </div>
    </div>
  );
};

export default AIModal;