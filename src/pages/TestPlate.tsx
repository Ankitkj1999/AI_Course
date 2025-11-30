import { useEffect, useRef, useState } from 'react';
import { Editor, rootCtx, editorViewCtx, parserCtx, serializerCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { history } from '@milkdown/plugin-history';
import { listener, listenerCtx } from '@milkdown/plugin-listener';

const TestPlate = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [editorReady, setEditorReady] = useState(false);


  useEffect(() => {
    if (!editorRef.current) return;

    const initEditor = async () => {
      try {
        const editor = Editor.make()
          .config((ctx) => ctx.set(rootCtx, editorRef.current))
          .use(commonmark)
          .use(history)
          .use(listener);

        await editor.create();

        editorInstanceRef.current = editor;

        // Configure after creation
        editor.action((ctx) => {
          // Listen to markdown changes
          ctx.get(listenerCtx).markdownUpdated(() => {
            console.log('Markdown updated');
          });
        });

        // Set initial content
        editor.action((ctx) => {
          const view = ctx.get(editorViewCtx);
          const parser = ctx.get(parserCtx);
          const doc = parser(
            '# Hello Milkdown\n\nSelect any text to see it captured below. Then click "Replace Selected" to see content replacement in action.\n\n## Features\n\n- **Select text** to get context\n- **Replace content** programmatically\n- **Ready for AI integration**\n\nTry selecting this paragraph and clicking the button!'
          );
          const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, doc.content);
          view.dispatch(tr);
        });

        setEditorReady(true);
      } catch (error) {
        console.error('❌ Failed to create editor:', error);
      }
    };

    initEditor();

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, []);

  // Get selected text from editor
  const getSelection = () => {
    if (!editorInstanceRef.current) return;

    editorInstanceRef.current.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { from, to } = view.state.selection;
      const text = view.state.doc.textBetween(from, to, '\n');
      setSelectedText(text);
      console.log('📝 Selected text:', text);
      console.log('📍 Selection range:', { from, to });
    });
  };

  // Replace selected text with new content
  const replaceSelection = (newText: string) => {
    if (!editorInstanceRef.current) return;

    editorInstanceRef.current.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const parser = ctx.get(parserCtx);
      const { from, to } = view.state.selection;

      // Parse the new markdown content
      const newDoc = parser(newText);

      // Replace selection with new content
      const tr = view.state.tr.replaceWith(from, to, newDoc.content);
      view.dispatch(tr);
      console.log('✅ Content replaced');
    });
  };

  // Get full markdown content
  const getMarkdown = () => {
    if (!editorInstanceRef.current) return '';

    let markdown = '';
    editorInstanceRef.current.action((ctx) => {
      const serializer = ctx.get(serializerCtx);
      const view = ctx.get(editorViewCtx);
      markdown = serializer(view.state.doc);
    });
    return markdown;
  };

  // Insert content at cursor position
  const insertAtCursor = (content: string) => {
    if (!editorInstanceRef.current) return;

    editorInstanceRef.current.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const parser = ctx.get(parserCtx);
      const { from } = view.state.selection;

      const newDoc = parser(content);
      const tr = view.state.tr.insert(from, newDoc.content);
      view.dispatch(tr);
      console.log('✅ Content inserted at cursor');
    });
  };

  // Demo: Replace with AI-like content
  const simulateAIReplacement = () => {
    const aiGeneratedContent = `**AI Enhanced Version:**

This is an example of AI-generated content that replaces your selection. In a real implementation, this would come from an LLM API call.

Key improvements:
- Better structure
- Enhanced clarity
- Professional tone`;

    replaceSelection(aiGeneratedContent);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Milkdown with Selection & Replacement
          </h1>
          <p className="text-gray-600">
            Select text and use the controls below to see content manipulation in action
          </p>
        </div>

        {/* Editor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div
            ref={editorRef}
            className="min-h-[400px] p-6 prose prose-sm max-w-none milkdown-editor"
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#374151'
            }}
          />
        </div>

        {/* Controls */}
        {editorReady && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Editor Controls</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={getSelection}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Get Selected Text
              </button>
              
              <button
                onClick={simulateAIReplacement}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Replace Selected (AI Demo)
              </button>
              
              <button
                onClick={() => insertAtCursor('\n\n**New paragraph inserted!**\n\n')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Insert at Cursor
              </button>
              
              <button
                onClick={() => {
                  const md = getMarkdown();
                  console.log('📄 Full markdown:', md);
                  alert('Check console for full markdown');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Get Full Markdown
              </button>
            </div>

            {/* Selected text display */}
            {selectedText && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">Selected Text:</p>
                <pre className="text-sm text-blue-800 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-blue-100">
                  {selectedText}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-3">
            🎯 How to Use (AI Integration Ready)
          </h3>
          <div className="space-y-2 text-sm text-amber-800">
            <p><strong>1. Select text</strong> → Click "Get Selected Text" to capture it</p>
            <p><strong>2. Replace content</strong> → Click "Replace Selected" to see AI-like replacement</p>
            <p><strong>3. Insert at cursor</strong> → Place cursor and click to insert new content</p>
            <p><strong>4. Get markdown</strong> → Extract full document as markdown</p>
            <p className="pt-2 border-t border-amber-300 mt-3">
              <strong>🤖 For AI Integration:</strong> Replace{' '}
              <code className="bg-amber-100 px-2 py-0.5 rounded">simulateAIReplacement()</code>{' '}
              with actual LLM API calls
            </p>
          </div>
        </div>

        {/* Code reference */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">📝 Key Functions Available</h3>
          <div className="space-y-2 text-xs font-mono text-gray-700">
            <p><span className="text-blue-600">getSelection()</span> - Get selected text and range</p>
            <p><span className="text-purple-600">replaceSelection(markdown)</span> - Replace selection with new content</p>
            <p><span className="text-green-600">insertAtCursor(markdown)</span> - Insert at cursor position</p>
            <p><span className="text-orange-600">getMarkdown()</span> - Get full document markdown</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPlate;
