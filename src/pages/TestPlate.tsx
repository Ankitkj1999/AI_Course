import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Sparkles,
  Undo,
  Redo,
  Wand2,
  RefreshCw,
  ArrowRight,
  FileText,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

const TestPlate = () => {
  const [content, setContent] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const getSelectedText = (): string => {
    const selection = window.getSelection();
    return selection?.toString() || '';
  };

  const getAllText = (): string => {
    return editorRef.current?.innerText || '';
  };

  const insertTextAtCursor = (text: string) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    
    // Move cursor to end of inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    editorRef.current?.focus();
  };

  const replaceSelectedText = (newText: string) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const textNode = document.createTextNode(newText);
    range.insertNode(textNode);
    
    editorRef.current?.focus();
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
    const selectedText = getSelectedText();
    
    if (!selectedText) {
      toast({
        title: "No text selected",
        description: "Please select some text to improve",
        variant: "destructive"
      });
      return;
    }

    setIsAILoading(true);
    try {
      const prompt = `Improve the following text by making it clearer, more concise, and better written. Keep the same meaning and tone. Only return the improved text without any explanations:\n\n${selectedText}`;
      
      const improvedText = await callAI(prompt);
      replaceSelectedText(improvedText);
      
      toast({
        title: "Text improved!",
        description: "Your text has been enhanced by AI"
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
    const allText = getAllText();
    
    if (!allText || allText.length < 10) {
      toast({
        title: "Not enough content",
        description: "Write at least a few words before asking AI to continue",
        variant: "destructive"
      });
      return;
    }

    setIsAILoading(true);
    try {
      const prompt = `Continue writing the following text naturally. Write 2-3 more sentences that flow well with the existing content. Only return the continuation without repeating the original text:\n\n${allText}`;
      
      const continuation = await callAI(prompt);
      insertTextAtCursor('\n\n' + continuation);
      
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
    const selectedText = getSelectedText() || getAllText();
    
    if (!selectedText || selectedText.length < 50) {
      toast({
        title: "Not enough content",
        description: "Need more text to summarize",
        variant: "destructive"
      });
      return;
    }

    setIsAILoading(true);
    try {
      const prompt = `Summarize the following text in 2-3 concise sentences. Only return the summary:\n\n${selectedText}`;
      
      const summary = await callAI(prompt);
      
      if (getSelectedText()) {
        replaceSelectedText(summary);
      } else {
        insertTextAtCursor('\n\nSummary: ' + summary);
      }
      
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
    const selectedText = getSelectedText();
    
    if (!selectedText) {
      toast({
        title: "No text selected",
        description: "Please select some text to change its tone",
        variant: "destructive"
      });
      return;
    }

    setIsAILoading(true);
    try {
      const prompt = `Rewrite the following text in a ${tone} tone. Keep the same meaning but adjust the style. Only return the rewritten text:\n\n${selectedText}`;
      
      const rewrittenText = await callAI(prompt);
      replaceSelectedText(rewrittenText);
      
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
    const selectedText = getSelectedText();
    
    if (!selectedText) {
      toast({
        title: "No text selected",
        description: "Please select some text to expand",
        variant: "destructive"
      });
      return;
    }

    setIsAILoading(true);
    try {
      const prompt = `Expand the following text by adding more details, examples, and explanations. Make it 2-3 times longer while keeping the same meaning. Only return the expanded text:\n\n${selectedText}`;
      
      const expandedText = await callAI(prompt);
      replaceSelectedText(expandedText);
      
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
    const selectedText = getSelectedText();
    
    if (!selectedText) {
      toast({
        title: "No text selected",
        description: "Please select some text to shorten",
        variant: "destructive"
      });
      return;
    }

    setIsAILoading(true);
    try {
      const prompt = `Make the following text shorter and more concise while keeping the key points. Only return the shortened text:\n\n${selectedText}`;
      
      const shortenedText = await callAI(prompt);
      replaceSelectedText(shortenedText);
      
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

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI-Powered Rich Text Editor</h1>
        <p className="text-muted-foreground">
          Write with AI assistance - improve, continue, summarize, and transform your text
        </p>
      </div>

      <div className="border rounded-lg bg-card shadow-sm">
        {/* Toolbar */}
        <div className="border-b p-2 flex gap-1 flex-wrap bg-muted/50">
          {/* Text Formatting */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => execCommand('bold')}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => execCommand('italic')}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => execCommand('underline')}
              title="Underline (Ctrl+U)"
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => execCommand('strikeThrough')}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px bg-border mx-1" />

          {/* Headings */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => execCommand('formatBlock', 'h1')}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => execCommand('formatBlock', 'h2')}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px bg-border mx-1" />

          {/* Lists & Blocks */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => execCommand('insertUnorderedList')}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => execCommand('insertOrderedList')}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => execCommand('formatBlock', 'blockquote')}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => execCommand('formatBlock', 'pre')}
              title="Code Block"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px bg-border mx-1" />

          {/* Undo/Redo */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => execCommand('undo')}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => execCommand('redo')}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px bg-border mx-1" />

          {/* AI Features Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="default"
                className="ml-auto"
                disabled={isAILoading}
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
                <Wand2 className="h-4 w-4 mr-2" />
                Improve Writing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleContinueWriting}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue Writing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSummarize}>
                <FileText className="h-4 w-4 mr-2" />
                Summarize
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleMakeLonger}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Make Longer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMakeShorter}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Make Shorter
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => handleChangeTone('professional')}>
                Change to Professional
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeTone('casual')}>
                Change to Casual
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeTone('friendly')}>
                Change to Friendly
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeTone('formal')}>
                Change to Formal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Editor */}
        <div className="p-6">
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[400px] p-4 focus:outline-none prose prose-slate dark:prose-invert max-w-none"
            onInput={(e) => setContent(e.currentTarget.innerHTML)}
            suppressContentEditableWarning
          >
            <h1>Welcome to the AI-Powered Editor</h1>
            <p>This editor integrates with your LLM backend to provide intelligent writing assistance.</p>
            <p><strong>Try these AI features:</strong></p>
            <ul>
              <li>Select text and click "Improve Writing" to enhance it</li>
              <li>Click "Continue Writing" to let AI complete your thoughts</li>
              <li>Select text and "Summarize" to create a concise version</li>
              <li>Change the tone to professional, casual, friendly, or formal</li>
              <li>Make text longer with more details or shorter and more concise</li>
            </ul>
            <blockquote>
              <p>💡 Tip: Select any text to apply AI transformations, or use "Continue Writing" to extend your content!</p>
            </blockquote>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">AI Features:</h3>
        <ul className="space-y-1 text-sm">
          <li>✨ <strong>Improve Writing</strong> - Enhance clarity and quality</li>
          <li>➡️ <strong>Continue Writing</strong> - AI completes your thoughts</li>
          <li>📝 <strong>Summarize</strong> - Create concise summaries</li>
          <li>📏 <strong>Adjust Length</strong> - Make text longer or shorter</li>
          <li>🎭 <strong>Change Tone</strong> - Professional, casual, friendly, or formal</li>
          <li>⚡ <strong>Real-time</strong> - Powered by your LLM backend</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          All AI features use your configured LLM provider from the backend.
        </p>
      </div>
    </div>
  );
};

export default TestPlate;
