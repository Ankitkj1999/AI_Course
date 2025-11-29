import { useEffect, useRef, useState } from 'react';
import { Crepe, CrepeBuilder } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import './TestPlate.css';
import { toolbar } from '@milkdown/crepe/feature/toolbar';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Download, Copy, Wand2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface AICommand {
  id: string;
  label: string;
  icon: string;
  category: 'generate' | 'enhance' | 'transform' | 'structure' | 'analyze';
  action: (context: string) => Promise<string>;
  needsContext?: boolean;
}

const TestPlate = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuFilter, setSlashMenuFilter] = useState('');
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [positionReady, setPositionReady] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionBounds, setSelectionBounds] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState({ top: 0, left: 0 });

  // Debug bubble menu state changes
  useEffect(() => {
    if (showBubbleMenu) {
      console.log('Bubble menu should be visible at:', bubbleMenuPosition);
    }
  }, [showBubbleMenu, bubbleMenuPosition]);

  // Handle text selection for bubble menu
  const handleSelectionChange = () => {
    console.log('Selection change detected');
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      console.log('No selection or range count is 0');
      setShowBubbleMenu(false);
      return;
    }

    const selectedText = selection.toString().trim();
    console.log('Selected text length:', selectedText.length);

    // Only show bubble menu if text is selected (at least 3 characters) and within editor
    if (selectedText.length >= 3) {
      // Check if selection is within the editor
      const editorElement = document.querySelector('.milkdown-editor-wrapper');
      const isInEditor = editorElement?.contains(selection.anchorNode) ||
                        editorElement?.contains(selection.focusNode);

      if (isInEditor) {
        setSelectedText(selectedText);

        // Try to find and extend the native Crepe bubble menu first
        // Milkdown Crepe uses these selectors for bubble menu
        const nativeBubbleMenu = document.querySelector('.crepe-block-menu, .milkdown-menu, [role="toolbar"]');
        
        if (nativeBubbleMenu && !nativeBubbleMenu.querySelector('[data-ai-extended]')) {
          console.log('Found native bubble menu, extending with AI buttons');
          extendNativeBubbleMenu(nativeBubbleMenu as HTMLElement, selectedText);
          setShowBubbleMenu(false); // Don't show custom menu
        } else {
          // Fallback to our custom bubble menu
          // Calculate position
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          setBubbleMenuPosition({
            top: rect.top + window.scrollY - 45, // Position above selection
            left: Math.max(10, rect.left + window.scrollX + (rect.width / 2) - 80) // Center, but keep on screen
          });

          console.log('Showing custom bubble menu at:', bubbleMenuPosition);
          setShowBubbleMenu(true);
        }
      } else {
        setShowBubbleMenu(false);
      }
    } else {
      setShowBubbleMenu(false);
    }
  };

  // Extend the native Crepe bubble menu with AI buttons
  const extendNativeBubbleMenu = (menuElement: HTMLElement, selectedText: string) => {
    // Mark as extended to avoid duplicate additions
    menuElement.setAttribute('data-ai-extended', 'true');

    // Create AI button container
    const aiContainer = document.createElement('div');
    aiContainer.className = 'ai-bubble-buttons';
    aiContainer.style.cssText = 'display: flex; gap: 2px; margin-left: 4px; padding-left: 4px; border-left: 1px solid hsl(var(--border));';

    // Add AI buttons
    bubbleAICommands.forEach(cmd => {
      const button = document.createElement('button');
      button.className = 'ai-bubble-btn';
      button.innerHTML = `<span>${cmd.icon}</span>`;
      button.title = cmd.label;
      button.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 4px;
        border: none;
        background: transparent;
        color: hsl(var(--foreground));
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.15s ease;
      `;

      button.onmouseover = () => {
        button.style.backgroundColor = 'hsl(var(--accent))';
      };

      button.onmouseout = () => {
        button.style.backgroundColor = 'transparent';
      };

      button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleBubbleAICommand(cmd.id);
      };

      aiContainer.appendChild(button);
    });

    // Add to the menu
    menuElement.appendChild(aiContainer);
    console.log('Extended native bubble menu with AI buttons');
  };

  // Handle clicks outside to hide bubble menu
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as Element;
    const bubbleMenu = document.querySelector('[data-bubble-menu]');
    if (bubbleMenu && !bubbleMenu.contains(target)) {
      setShowBubbleMenu(false);
    }
  };

  const getCaretPosition = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Get the editor container to calculate relative positioning
    const editorElement = document.querySelector('.milkdown-editor-wrapper');
    const editorRect = editorElement?.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
      // This is a caret (collapsed selection)
      return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        height: rect.height || 20, // fallback height
        editorLeft: editorRect ? editorRect.left + window.scrollX : 0
      };
    }

    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      height: rect.height,
      editorLeft: editorRect ? editorRect.left + window.scrollX : 0
    };
  };

  useEffect(() => {
    if (!editorRef.current) return;

    // Inject AI option into Milkdown's native slash menu
    const addAIOptionToMenu = (menuElement: HTMLElement) => {
      // Check if already injected
      if (menuElement.querySelector('[data-ai-injected]')) {
        return;
      }
      
      // Create AI button using native Milkdown classes only
      const aiButton = document.createElement('button');
      aiButton.className = 'menu-item';
      aiButton.setAttribute('type', 'button');
      aiButton.setAttribute('data-ai-injected', 'true');
      aiButton.setAttribute('tabindex', '0');
      aiButton.innerHTML = `<span>✨</span><span>AI Commands</span>`;
      
      const handleAIButtonActivate = () => {
        // Close the native Milkdown slash menu
        const nativeMenu = menuElement.closest('.milkdown-slash-menu');
        if (nativeMenu) {
          nativeMenu.setAttribute('data-show', 'false');
        }

        // Open our AI commands menu immediately (no position calculation needed)
        setSlashMenuOpen(true);
        setSlashMenuFilter('');
      };

      aiButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAIButtonActivate();
      };

      aiButton.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleAIButtonActivate();
        }
      };

      // Insert at the beginning of the menu
      if (menuElement.firstChild) {
        menuElement.insertBefore(aiButton, menuElement.firstChild);
      } else {
        menuElement.appendChild(aiButton);
      }
    };

    // Monitor for slash menu appearance and visibility changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Watch for attribute changes (data-show)
         if (mutation.type === 'attributes' && mutation.attributeName === 'data-show') {
           const target = mutation.target as HTMLElement;
           if (target.classList.contains('milkdown-slash-menu')) {
             const isVisible = target.getAttribute('data-show') === 'true';
             if (isVisible) {
               console.log('Slash menu became visible (data-show=true)');
               if (!target.querySelector('[data-ai-injected]')) {
                 console.log('Injecting AI option into visible menu');
                 addAIOptionToMenu(target);
               }
             } else {
               console.log('Slash menu became hidden (data-show=false)');
             }
           }
         }
        
        // Also watch for new nodes (initial creation)
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Check if this is the slash menu by class name
            if (node.classList.contains('milkdown-slash-menu')) {
              console.log('Found milkdown-slash-menu node added');
              // Check if it's visible
              if (node.getAttribute('data-show') === 'true' && !node.querySelector('[data-ai-injected]')) {
                console.log('Menu is visible, injecting AI option');
                addAIOptionToMenu(node);
              }
            }
            
            // Also check children for slash menu
            const slashMenu = node.querySelector('.milkdown-slash-menu');
            if (slashMenu) {
              console.log('Found slash menu in children');
              if (slashMenu.getAttribute('data-show') === 'true' && !slashMenu.querySelector('[data-ai-injected]')) {
                console.log('Child menu is visible, injecting AI option');
                addAIOptionToMenu(slashMenu as HTMLElement);
              }
            }
          }
        });
      });
    });

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue: `# Welcome to Milkdown AI Editor

This is a powerful **markdown editor** with AI capabilities.

## Features

- 📝 **Rich Markdown Support** - Write in markdown with live preview
- ✨ **AI Assistant** - Improve, continue, and transform your writing
- 🎨 **Beautiful Theme** - Modern, clean interface
- ⚡ **Fast & Lightweight** - Built with ProseMirror

## Try It Out

Type **/** to open the command menu and select **AI** to access AI features:
- Improve your writing
- Continue writing
- Summarize content
- Change tone and style

> 💡 **Tip**: You can use standard markdown syntax like **bold**, *italic*, \`code\`, and more!

Start writing below...
      `,
    });

    crepe.create().then(() => {
      console.log('Milkdown editor created successfully');
      crepeRef.current = crepe;
      setEditorReady(true);

      // Add selection listener for bubble menu
      const editorElement = document.querySelector('.milkdown-editor-wrapper');
      if (editorElement) {
        editorElement.addEventListener('mouseup', handleSelectionChange);
        editorElement.addEventListener('keyup', handleSelectionChange); // For keyboard selection
      }
      document.addEventListener('mousedown', handleClickOutside);

      // Watch for native bubble menu appearance with comprehensive detection
      const bubbleObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              console.log('Node added:', node.className, node.tagName);
              
              // Look for Milkdown Crepe bubble menu - check ALL possible selectors
              let bubbleMenu = node.querySelector('.crepe-block-menu, .milkdown-menu, .milkdown-toolbar, [role="toolbar"], [data-crepe-menu]');
              
              // Also check if the node itself is the bubble menu
              if (!bubbleMenu && (
                node.classList.contains('crepe-block-menu') ||
                node.classList.contains('milkdown-menu') ||
                node.classList.contains('milkdown-toolbar') ||
                node.getAttribute('role') === 'toolbar' ||
                node.hasAttribute('data-crepe-menu')
              )) {
                bubbleMenu = node;
              }
              
              if (bubbleMenu && !bubbleMenu.querySelector('[data-ai-extended]')) {
                console.log('✅ Detected native bubble menu:', bubbleMenu.className);
                // Get current selection
                const selection = window.getSelection();
                const selectedText = selection?.toString().trim() || '';
                if (selectedText.length >= 3) {
                  setTimeout(() => {
                    extendNativeBubbleMenu(bubbleMenu as HTMLElement, selectedText);
                  }, 50);
                }
              }
            }
          });
        });
      });

      bubbleObserver.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Add keyboard shortcut for AI menu (Ctrl+K / Cmd+K) after editor is ready
      const handleGlobalKeydown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          if (!isAILoading && editorReady) {
            // Calculate position based on current caret
            const caretPos = getCaretPosition();
            if (caretPos) {
              setMenuPosition({
                top: caretPos.top + caretPos.height + 5, // Position below the caret
                left: caretPos.editorLeft + 20 // Align with editor's left edge + small padding
              });
            } else {
              // Fallback position
              setMenuPosition({ top: 200, left: 100 });
            }
            setPositionReady(true);
            setSlashMenuOpen(true);
            setSlashMenuFilter('');
          }
          return; // Don't let the event continue
        }
        // For all other keys, do nothing and let them bubble normally
      };

      // Listen on window instead of document to avoid interfering with editor events
      window.addEventListener('keydown', handleGlobalKeydown);

      // Store cleanup function for useEffect return
      const cleanupKeyboard = () => {
        window.removeEventListener('keydown', handleGlobalKeydown);
      };

      // Store on window for access in cleanup
      (window as Window & { _aiKeyboardCleanup?: () => void })._aiKeyboardCleanup = cleanupKeyboard;
      
      // Start observing for slash menu (watch both nodes and attributes)
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-show']
      });

      // Also check periodically for visible slash menu (fallback)
      const checkInterval = setInterval(() => {
        const slashMenu = document.querySelector('.milkdown-slash-menu[data-show="true"]');
        if (slashMenu && !slashMenu.querySelector('[data-ai-injected]')) {
          console.log('Found visible slash menu via interval check');
          addAIOptionToMenu(slashMenu as HTMLElement);
        }
      }, 300);

      // Clean up interval after 30 seconds
      setTimeout(() => clearInterval(checkInterval), 30000);
    }).catch((error) => {
      console.error('Failed to create editor:', error);
      toast({
        title: "Editor Error",
        description: "Failed to initialize the editor",
        variant: "destructive"
      });
    });

    return () => {
      observer.disconnect();
      const editorElement = document.querySelector('.milkdown-editor-wrapper');
      if (editorElement) {
        editorElement.removeEventListener('mouseup', handleSelectionChange);
        editorElement.removeEventListener('keyup', handleSelectionChange);
      }
      document.removeEventListener('mousedown', handleClickOutside);
      if (crepeRef.current) {
        crepeRef.current.destroy();
        crepeRef.current = null;
      }
      // Clean up keyboard listener
      if ((window as Window & { _aiKeyboardCleanup?: () => void })._aiKeyboardCleanup) {
        (window as Window & { _aiKeyboardCleanup?: () => void })._aiKeyboardCleanup();
        delete (window as Window & { _aiKeyboardCleanup?: () => void })._aiKeyboardCleanup;
      }
    };
  }, [editorReady, extendNativeBubbleMenu, handleSelectionChange, isAILoading]);

  const getEditorContent = (): string => {
    if (!crepeRef.current) return '';
    try {
      return crepeRef.current.getMarkdown();
    } catch (error) {
      console.error('Failed to get content:', error);
      return '';
    }
  };

  const setEditorContent = (content: string) => {
    if (!crepeRef.current || !editorRef.current) return;
    try {
      // Destroy and recreate the editor with new content
      crepeRef.current.destroy();
      const crepe = new Crepe({
        root: editorRef.current,
        defaultValue: content,
      });
      crepe.create().then(() => {
        crepeRef.current = crepe;
      });
    } catch (error) {
      console.error('Failed to set content:', error);
    }
  };

  const callAI = async (prompt: string): Promise<string> => {
    try {
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt: prompt.trim(),
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.content) {
        return result.data.content;
      } else {
        throw new Error(result.error?.message || 'Failed to generate content');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  };

  // Bubble menu AI commands (for selected text only)
  const bubbleAICommands = [
    {
      id: 'improve-selection',
      label: 'Improve',
      icon: '✨',
      action: async (text: string) => {
        const prompt = `Improve the following text by making it clearer and better written. Keep the same meaning. Only return the improved text:\n\n${text}`;
        return await callAI(prompt);
      }
    },
    {
      id: 'summarize-selection',
      label: 'Summarize',
      icon: '📝',
      action: async (text: string) => {
        const prompt = `Summarize the following text in 1-2 sentences. Only return the summary:\n\n${text}`;
        return await callAI(prompt);
      }
    },
    {
      id: 'expand-selection',
      label: 'Expand',
      icon: '📏',
      action: async (text: string) => {
        const prompt = `Expand the following text with more details and examples. Make it 2x longer. Only return the expanded text:\n\n${text}`;
        return await callAI(prompt);
      }
    }
  ];

  const handleBubbleAICommand = async (commandId: string) => {
    const command = bubbleAICommands.find(cmd => cmd.id === commandId);
    if (!command || !selectedText) return;

    setIsAILoading(true);
    setShowBubbleMenu(false);

    try {
      const result = await command.action(selectedText);
      
      // Replace selected text with AI result
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(result));
      }

      toast({
        title: "AI completed!",
        description: `${command.label} finished successfully`
      });
    } catch (error) {
      toast({
        title: "AI Error",
        description: error instanceof Error ? error.message : "Failed to process text",
        variant: "destructive"
      });
    } finally {
      setIsAILoading(false);
    }
  };

  // AI Command definitions - Essential commands only
  const aiCommands: AICommand[] = [
    {
      id: 'improve',
      label: 'Improve writing',
      icon: '✨',
      category: 'enhance',
      needsContext: true,
      action: async (context: string) => {
        const prompt = `Improve the following markdown text by making it clearer, more concise, and better written. Keep the same meaning and markdown formatting. Only return the improved markdown:\n\n${context}`;
        return await callAI(prompt);
      }
    },
    {
      id: 'continue',
      label: 'Continue writing',
      icon: '✍️',
      category: 'generate',
      needsContext: true,
      action: async (context: string) => {
        const prompt = `Continue writing the following markdown text naturally. Write 2-3 more paragraphs that flow well with the existing content. Use proper markdown formatting. Only return the continuation:\n\n${context}`;
        return await callAI(prompt);
      }
    },
    {
      id: 'summarize',
      label: 'Summarize',
      icon: '📋',
      category: 'generate',
      needsContext: true,
      action: async (context: string) => {
        const prompt = `Create a concise summary of the following content in 2-3 sentences. Return only the summary in markdown:\n\n${context}`;
        return await callAI(prompt);
      }
    },
    {
      id: 'make-longer',
      label: 'Make longer',
      icon: '📏',
      category: 'enhance',
      needsContext: true,
      action: async (context: string) => {
        const prompt = `Expand the following markdown text by adding more details, examples, and explanations. Make it 2-3 times longer while keeping the same meaning and markdown formatting. Only return the expanded markdown:\n\n${context}`;
        return await callAI(prompt);
      }
    },
    {
      id: 'make-shorter',
      label: 'Make shorter',
      icon: '✂️',
      category: 'enhance',
      needsContext: true,
      action: async (context: string) => {
        const prompt = `Make the following markdown text shorter and more concise while keeping the key points and markdown formatting. Only return the shortened markdown:\n\n${context}`;
        return await callAI(prompt);
      }
    },
    {
      id: 'tone-formal',
      label: 'Change tone: Formal',
      icon: '🎩',
      category: 'transform',
      needsContext: true,
      action: async (context: string) => {
        const prompt = `Rewrite the following markdown text in a formal tone. Keep the same meaning and markdown formatting but adjust the style. Only return the rewritten markdown:\n\n${context}`;
        return await callAI(prompt);
      }
    },
    {
      id: 'tone-casual',
      label: 'Change tone: Casual',
      icon: '😊',
      category: 'transform',
      needsContext: true,
      action: async (context: string) => {
        const prompt = `Rewrite the following markdown text in a casual tone. Keep the same meaning and markdown formatting but adjust the style. Only return the rewritten markdown:\n\n${context}`;
        return await callAI(prompt);
      }
    }
  ];

  const executeAICommand = async (command: AICommand) => {
    const content = getEditorContent();
    
    if (command.needsContext && (!content || content.length < 10)) {
      toast({
        title: "Not enough content",
        description: "Write some text first before using this command",
        variant: "destructive"
      });
      return;
    }

    setIsAILoading(true);
    setSlashMenuOpen(false);
    
    try {
      const result = await command.action(content);
      
      // For commands that generate new content (not replace)
      if (['continue', 'summarize'].includes(command.id)) {
        setEditorContent(content + '\n\n' + result);
      } else {
        setEditorContent(result);
      }
      
      toast({
        title: "AI command completed!",
        description: `${command.label} finished successfully`
      });
    } catch (error) {
      toast({
        title: "AI Error",
        description: error instanceof Error ? error.message : "Failed to execute command",
        variant: "destructive"
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleCustomPrompt = async () => {
    if (!customPrompt.trim()) return;
    
    const content = getEditorContent();
    setIsAILoading(true);
    setShowAIDialog(false);
    
    try {
      const fullPrompt = content 
        ? `${customPrompt}\n\nContext:\n${content}`
        : customPrompt;
      
      const result = await callAI(fullPrompt);
      setEditorContent(content ? content + '\n\n' + result : result);
      
      toast({
        title: "AI generated content!",
        description: "Custom prompt completed"
      });
    } catch (error) {
      toast({
        title: "AI Error",
        description: error instanceof Error ? error.message : "Failed to generate content",
        variant: "destructive"
      });
    } finally {
      setIsAILoading(false);
      setCustomPrompt('');
    }
  };

  const filteredCommands = slashMenuFilter
    ? aiCommands.filter(cmd => 
        cmd.label.toLowerCase().includes(slashMenuFilter.toLowerCase())
      )
    : aiCommands;

  const handleImproveText = async () => {
    const content = getEditorContent();
    
    if (!content || content.length < 10) {
      toast({
        title: "Not enough content",
        description: "Write some text first before improving",
        variant: "destructive"
      });
      return;
    }

    setIsAILoading(true);
    try {
      const prompt = `Improve the following markdown text by making it clearer, more concise, and better written. Keep the same meaning and markdown formatting. Only return the improved markdown:\n\n${content}`;
      
      const improvedText = await callAI(prompt);
      setEditorContent(improvedText);
      
      toast({
        title: "Text improved!",
        description: "Your content has been enhanced by AI"
      });
    } catch (error) {
      toast({
        title: "AI Error",
        description: error instanceof Error ? error.message : "Failed to improve text",
        variant: "destructive"
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleContinueWriting = async () => {
    const content = getEditorContent();
    
    if (!content || content.length < 10) {
      toast({
        title: "Not enough content",
        description: "Write at least a few words before asking AI to continue",
        variant: "destructive"
      });
      return;
    }

    setIsAILoading(true);
    try {
      const prompt = `Continue writing the following markdown text naturally. Write 2-3 more paragraphs that flow well with the existing content. Use proper markdown formatting. Only return the continuation:\n\n${content}`;
      
      const continuation = await callAI(prompt);
      setEditorContent(content + '\n\n' + continuation);
      
      toast({
        title: "Content generated!",
        description: "AI has continued your writing"
      });
    } catch (error) {
      toast({
        title: "AI Error",
        description: error instanceof Error ? error.message : "Failed to continue writing",
        variant: "destructive"
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSummarize = async () => {
    const content = getEditorContent();
    
    if (!content || content.length < 50) {
      toast({
        title: "Not enough content",
        description: "Need more text to summarize",
        variant: "destructive"
      });
      return;
    }

    setIsAILoading(true);
    try {
      const prompt = `Summarize the following markdown text in 2-3 concise paragraphs. Use markdown formatting. Only return the summary:\n\n${content}`;
      
      const summary = await callAI(prompt);
      setEditorContent('# Summary\n\n' + summary + '\n\n---\n\n# Original Content\n\n' + content);
      
      toast({
        title: "Text summarized!",
        description: "AI has created a summary"
      });
    } catch (error) {
      toast({
        title: "AI Error",
        description: error instanceof Error ? error.message : "Failed to summarize",
        variant: "destructive"
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleChangeTone = async (tone: string) => {
    const content = getEditorContent();
    
    if (!content || content.length < 10) {
      toast({
        title: "Not enough content",
        description: "Write some text first",
        variant: "destructive"
      });
      return;
    }

    setIsAILoading(true);
    try {
      const prompt = `Rewrite the following markdown text in a ${tone} tone. Keep the same meaning and markdown formatting but adjust the style. Only return the rewritten markdown:\n\n${content}`;
      
      const rewrittenText = await callAI(prompt);
      setEditorContent(rewrittenText);
      
      toast({
        title: "Tone changed!",
        description: `Text rewritten in ${tone} tone`
      });
    } catch (error) {
      toast({
        title: "AI Error",
        description: error instanceof Error ? error.message : "Failed to change tone",
        variant: "destructive"
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleMakeLonger = async () => {
    const content = getEditorContent();
    
    if (!content || content.length < 10) {
      toast({
        title: "Not enough content",
        description: "Write some text first",
        variant: "destructive"
      });
      return;
    }

    setIsAILoading(true);
    try {
      const prompt = `Expand the following markdown text by adding more details, examples, and explanations. Make it 2-3 times longer while keeping the same meaning and markdown formatting. Only return the expanded markdown:\n\n${content}`;
      
      const expandedText = await callAI(prompt);
      setEditorContent(expandedText);
      
      toast({
        title: "Text expanded!",
        description: "AI has made your text longer with more details"
      });
    } catch (error) {
      toast({
        title: "AI Error",
        description: error instanceof Error ? error.message : "Failed to expand text",
        variant: "destructive"
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleMakeShorter = async () => {
    const content = getEditorContent();
    
    if (!content || content.length < 10) {
      toast({
        title: "Not enough content",
        description: "Write some text first",
        variant: "destructive"
      });
      return;
    }

    setIsAILoading(true);
    try {
      const prompt = `Make the following markdown text shorter and more concise while keeping the key points and markdown formatting. Only return the shortened markdown:\n\n${content}`;
      
      const shortenedText = await callAI(prompt);
      setEditorContent(shortenedText);
      
      toast({
        title: "Text shortened!",
        description: "AI has made your text more concise"
      });
    } catch (error) {
      toast({
        title: "AI Error",
        description: error instanceof Error ? error.message : "Failed to shorten text",
        variant: "destructive"
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    const content = getEditorContent();
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Markdown copied to clipboard"
    });
  };

  const handleDownloadMarkdown = () => {
    const content = getEditorContent();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Markdown file saved"
    });
  };

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Milkdown AI Editor</h1>
        <p className="text-muted-foreground">
          A powerful markdown editor with AI-powered writing assistance. Type <kbd className="px-2 py-1 text-xs bg-muted rounded">/</kbd> and select "AI", or press <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl+K</kbd> to access all AI features.
        </p>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden relative">
        {/* Toolbar */}
        <div className="border-b p-3 flex gap-2 flex-wrap bg-muted/50 items-center">
          <div className="flex gap-2 flex-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyMarkdown}
              disabled={!editorReady}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadMarkdown}
              disabled={!editorReady}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAIDialog(true)}
              disabled={!editorReady || isAILoading}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Custom Prompt
            </Button>
          </div>

          {/* AI Commands Menu Button */}
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              setSlashMenuOpen(!slashMenuOpen);
              setSlashMenuFilter('');
            }}
            disabled={isAILoading || !editorReady}
          >
            {isAILoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI Working...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Commands
              </>
            )}
          </Button>

          {/* Quick Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={isAILoading || !editorReady}
              >
                Quick Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleImproveText}>
                ✨ Improve Writing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleContinueWriting}>
                ➡️ Continue Writing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSummarize}>
                📝 Summarize
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleMakeLonger}>
                📏 Make Longer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMakeShorter}>
                ✂️ Make Shorter
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => handleChangeTone('professional')}>
                💼 Professional Tone
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeTone('casual')}>
                😊 Casual Tone
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeTone('friendly')}>
                🤝 Friendly Tone
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeTone('formal')}>
                🎩 Formal Tone
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Editor */}
        <div 
          ref={editorRef} 
          className="min-h-[500px] milkdown-editor-wrapper"
        />

        {/* AI Bubble Menu (appears on text selection) */}
        {showBubbleMenu && !isAILoading && (
          <div
            data-bubble-menu
            className="fixed z-[9999] bg-background border rounded-lg shadow-lg p-1 flex gap-1 animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              top: `${bubbleMenuPosition.top}px`,
              left: `${bubbleMenuPosition.left}px`,
            }}
            onMouseDown={(e) => e.preventDefault()} // Prevent selection loss
          >
            {/* Debug indicator */}
            <div className="absolute -top-2 -left-2 w-2 h-2 bg-red-500 rounded-full" title="Bubble menu visible"></div>
            {bubbleAICommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => handleBubbleAICommand(cmd.id)}
                className="px-3 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-1.5 transition-colors whitespace-nowrap"
                title={cmd.label}
              >
                <span>{cmd.icon}</span>
                <span>{cmd.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* AI Loading Overlay */}
        {isAILoading && (
          <div className="ai-loading-overlay">
            <div className="bg-background border rounded-lg shadow-lg p-6 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">AI is working...</p>
            </div>
          </div>
        )}

        {/* AI Commands Popover Menu */}
        {slashMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setSlashMenuOpen(false)}
            />
            
            {/* Menu - Fixed position relative to viewport */}
            <div
              className="fixed z-50 w-80 bg-popover border rounded-lg shadow-lg p-2 slash-menu-enter"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="mb-2">
                <Input
                  placeholder="Search AI commands..."
                  value={slashMenuFilter}
                  onChange={(e) => setSlashMenuFilter(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSlashMenuOpen(false);
                      setSlashMenuFilter('');
                    }
                  }}
                />
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-1">
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => executeAICommand(cmd)}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent flex items-center gap-2 transition-colors"
                    >
                      <span>{cmd.icon}</span>
                      <span>{cmd.label}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No commands found
                  </div>
                )}
              </div>
              
              <div className="mt-2 pt-2 border-t">
                <button
                  onClick={() => {
                    setSlashMenuOpen(false);
                    setShowAIDialog(true);
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  <span>Custom AI prompt...</span>
                </button>
              </div>
              
              <div className="mt-2 px-2 text-xs text-muted-foreground">
                Press <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> to close
              </div>
            </div>
          </>
        )}
      </div>

      {/* Custom Prompt Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom AI Prompt</DialogTitle>
            <DialogDescription>
              Enter your custom prompt. The AI will use your current document as context.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="e.g., Write a conclusion paragraph..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCustomPrompt();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAIDialog(false);
                  setCustomPrompt('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCustomPrompt}
                disabled={!customPrompt.trim() || isAILoading}
              >
                {isAILoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Features:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium mb-1">Editor:</p>
            <ul className="space-y-1">
              <li>📝 Full markdown support</li>
              <li>🎨 Beautiful WYSIWYG interface</li>
              <li>⚡ Real-time preview</li>
              <li>💾 Copy & download markdown</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">AI Features:</p>
            <ul className="space-y-1">
              <li>✨ Bubble menu (select text)</li>
              <li>📝 Slash commands (type /)</li>
              <li>⚡ Quick actions (toolbar)</li>
              <li>🪄 Custom prompts</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Access Methods:</p>
            <ul className="space-y-1">
              <li>🎯 AI Commands button</li>
              <li>⚡ Quick Actions dropdown</li>
              <li>🪄 Custom prompts</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-background rounded border">
          <p className="text-xs font-medium mb-2">💡 Pro Tips:</p>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• <strong>Select text</strong> to see AI bubble menu (Improve, Summarize, Expand)</li>
            <li>• Type <kbd className="px-1 py-0.5 bg-muted rounded">/</kbd> and select "AI Commands" for full document actions</li>
            <li>• Press <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+K</kbd> (or <kbd className="px-1 py-0.5 bg-muted rounded">Cmd+K</kbd>) for quick AI menu</li>
            <li>• Use "Quick Actions" toolbar button for common tasks</li>
            <li>• Click "Custom Prompt" for any AI task</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Built with Milkdown - Powered by your LLM backend
        </p>
      </div>
    </div>
  );
};

export default TestPlate;
