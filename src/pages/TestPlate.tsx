import { useEffect, useRef, useState } from 'react';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import './TestPlate.css';
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
      aiButton.innerHTML = `<span>✨</span><span>AI Commands</span>`;
      
      aiButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Let menu close naturally - don't force hide
        // Open our AI commands menu
        setSlashMenuOpen(true);
        setSlashMenuFilter('');
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
          if (target.classList.contains('milkdown-slash-menu') && target.getAttribute('data-show') === 'true') {
            console.log('Slash menu became visible (data-show=true)');
            if (!target.querySelector('[data-ai-injected]')) {
              console.log('Injecting AI option into visible menu');
              addAIOptionToMenu(target);
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
      if (crepeRef.current) {
        crepeRef.current.destroy();
        crepeRef.current = null;
      }
    };
  }, []);

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
          A powerful markdown editor with AI-powered writing assistance. Type <kbd className="px-2 py-1 text-xs bg-muted rounded">/</kbd> and select "AI" to access all AI features.
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
            
            {/* Menu */}
            <div className="absolute z-50 w-80 bg-popover border rounded-lg shadow-lg p-2 mt-2 left-1/2 top-20 -translate-x-1/2 slash-menu-enter">
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
            <p className="font-medium mb-1">AI Commands (7 total):</p>
            <ul className="space-y-1">
              <li>✨ Improve writing</li>
              <li>✍️ Continue writing</li>
              <li>📋 Summarize</li>
              <li>📏 Make longer/shorter</li>
              <li>🎩 Change tone</li>
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
            <li>• Type <kbd className="px-1 py-0.5 bg-muted rounded">/</kbd> in the editor and select "AI Commands" to see all 7 AI commands</li>
            <li>• Use the search bar in the AI menu to quickly find commands</li>
            <li>• Use "Quick Actions" toolbar button for common tasks</li>
            <li>• Click "Custom Prompt" for any AI task not in the menu</li>
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
