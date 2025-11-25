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
  Redo
} from 'lucide-react';

const TestPlate = () => {
  const [content, setContent] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Plate.js Test Environment</h1>
        <p className="text-muted-foreground">
          Testing rich text editor with formatting controls
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

          {/* AI Button */}
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => alert('AI features coming soon! This will integrate with your LLM backend.')}
            title="AI Assist"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assist
          </Button>
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
            <h1>Welcome to the Rich Text Editor</h1>
            <p>This is a test environment for building a rich text editor with AI capabilities.</p>
            <p>Try using the toolbar buttons above to format your text:</p>
            <ul>
              <li>Bold, italic, underline formatting</li>
              <li>Headings and lists</li>
              <li>Blockquotes and code blocks</li>
              <li>Undo/redo support</li>
            </ul>
            <blockquote>
              <p>This is a blockquote. Perfect for highlighting important information!</p>
            </blockquote>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Features:</h3>
        <ul className="space-y-1 text-sm">
          <li>• Rich text formatting (bold, italic, underline, strikethrough)</li>
          <li>• Headings (H1, H2)</li>
          <li>• Lists (bulleted and numbered)</li>
          <li>• Blockquotes and code blocks</li>
          <li>• Undo/Redo functionality</li>
          <li>• Ready for AI integration</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          This uses contentEditable with execCommand. Next: integrate Plate.js for advanced features!
        </p>
      </div>
    </div>
  );
};

export default TestPlate;
