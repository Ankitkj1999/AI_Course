import { useEffect, useRef, useState } from 'react';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Download, Copy } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

const TestPlate = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

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

Select any text and use the **AI Assistant** button above to:
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
    }).catch((error) => {
      console.error('Failed to create editor:', error);
      toast({
        title: "Editor Error",
        description: "Failed to initialize the editor",
        variant: "destructive"
      });
    });

    return () => {
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
          A powerful markdown editor with AI-powered writing assistance
        </p>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
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
          </div>

          {/* AI Features Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="default"
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
                    AI Assistant
                  </>
                )}
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
                📏 Make Shorter
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
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Features:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
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
            <p className="font-medium mb-1">AI Assistant:</p>
            <ul className="space-y-1">
              <li>✨ Improve writing quality</li>
              <li>➡️ Continue your thoughts</li>
              <li>📝 Summarize content</li>
              <li>🎭 Change tone & style</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Built with Milkdown - Powered by your LLM backend
        </p>
      </div>
    </div>
  );
};

export default TestPlate;
