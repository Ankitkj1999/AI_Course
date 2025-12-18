import React from 'react';
import { $getRoot, $getSelection } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const theme = {
  // Theme styling
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder text-gray-400',
  paragraph: 'editor-paragraph mb-2',
  quote: 'editor-quote border-l-4 border-gray-300 pl-4 italic',
  heading: {
    h1: 'editor-heading-h1 text-3xl font-bold mb-4',
    h2: 'editor-heading-h2 text-2xl font-semibold mb-3',
    h3: 'editor-heading-h3 text-xl font-medium mb-2',
    h4: 'editor-heading-h4 text-lg font-medium mb-2',
    h5: 'editor-heading-h5 text-base font-medium mb-1',
    h6: 'editor-heading-h6 text-sm font-medium mb-1',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol list-decimal list-inside ml-4',
    ul: 'editor-list-ul list-disc list-inside ml-4',
    listitem: 'editor-listitem mb-1',
  },
  link: 'editor-link text-blue-600 underline hover:text-blue-800',
  text: {
    bold: 'editor-text-bold font-bold',
    italic: 'editor-text-italic italic',
    underline: 'editor-text-underline underline',
    strikethrough: 'editor-text-strikethrough line-through',
    code: 'editor-text-code bg-gray-100 px-1 py-0.5 rounded text-sm font-mono',
  },
  code: 'editor-code bg-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto',
};

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
}

function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    // Focus the editor when the effect fires!
    editor.focus();
  }, [editor]);

  return null;
}

// When the editor changes, you can get notified via the
// OnChangePlugin!
function onChange(editorState: import('lexical').EditorState) {
  editorState.read(() => {
    // Read the contents of the EditorState here.
    const root = $getRoot();
    const selection = $getSelection();

    console.log(root, selection);
  });
}

function ActionsPlugin() {
  const [editor] = useLexicalComposerContext();

  const handleClear = () => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
    });
  };

  const handleGetContent = () => {
    editor.update(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      console.log('Text content:', textContent);
      alert(`Content: ${textContent}`);
    });
  };

  const handleGetHTML = () => {
    editor.update(() => {
      const htmlString = $generateHtmlFromNodes(editor, null);
      console.log('HTML content:', htmlString);
      alert(`HTML: ${htmlString}`);
    });
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <Button onClick={handleClear} variant="outline" size="sm">
        Clear Editor
      </Button>
      <Button onClick={handleGetContent} variant="outline" size="sm">
        Get Text
      </Button>
      <Button onClick={handleGetHTML} variant="outline" size="sm">
        Get HTML
      </Button>
    </div>
  );
}

const TestLexical: React.FC = () => {
  const initialConfig = {
    namespace: 'RichTextEditor',
    theme,
    onError,
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      AutoLinkNode,
      LinkNode,
    ],
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Lexical Editor Test</h1>
        <p className="text-muted-foreground">
          Testing the Lexical rich text editor integration with advanced features
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rich Text Lexical Editor</CardTitle>
          <CardDescription>
            A feature-rich editor with markdown shortcuts, lists, links, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LexicalComposer initialConfig={initialConfig}>
            <div className="editor-container">
              <div className="editor-inner">
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable 
                      className="editor-input min-h-[300px] p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 prose prose-sm max-w-none" 
                    />
                  }
                  placeholder={
                    <div className="editor-placeholder absolute top-4 left-4 text-gray-400 pointer-events-none">
                      Start typing... Try markdown shortcuts like # for headings, * for lists, **bold**, *italic*
                    </div>
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <OnChangePlugin onChange={onChange} />
                <HistoryPlugin />
                <ListPlugin />
                <LinkPlugin />
                <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                <MyCustomAutoFocusPlugin />
                <ActionsPlugin />
              </div>
            </div>
          </LexicalComposer>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Features & Shortcuts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Markdown Shortcuts:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><code># Heading 1</code> - Creates a large heading</li>
              <li><code>## Heading 2</code> - Creates a medium heading</li>
              <li><code>### Heading 3</code> - Creates a small heading</li>
              <li><code>* List item</code> or <code>- List item</code> - Creates bullet lists</li>
              <li><code>1. List item</code> - Creates numbered lists</li>
              <li><code>**bold text**</code> - Makes text bold</li>
              <li><code>*italic text*</code> - Makes text italic</li>
              <li><code>`code`</code> - Inline code formatting</li>
              <li><code>&gt; Quote</code> - Creates a blockquote</li>
            </ul>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-semibold mb-2">Keyboard Shortcuts:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><kbd>Ctrl+Z</kbd> / <kbd>Cmd+Z</kbd> - Undo</li>
              <li><kbd>Ctrl+Y</kbd> / <kbd>Cmd+Shift+Z</kbd> - Redo</li>
              <li><kbd>Ctrl+B</kbd> / <kbd>Cmd+B</kbd> - Bold</li>
              <li><kbd>Ctrl+I</kbd> / <kbd>Cmd+I</kbd> - Italic</li>
              <li><kbd>Ctrl+U</kbd> / <kbd>Cmd+U</kbd> - Underline</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-2">Advanced Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Rich text formatting with theme support</li>
              <li>Automatic link detection and creation</li>
              <li>Nested lists support</li>
              <li>History management (undo/redo)</li>
              <li>HTML and text content extraction</li>
              <li>Markdown shortcuts for rapid formatting</li>
              <li>Auto-focus on component mount</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestLexical;