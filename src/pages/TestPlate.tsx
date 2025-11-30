import { useEffect, useRef, useState } from 'react';
import { Crepe } from '@milkdown/crepe';
import { editorViewCtx, parserCtx, serializerCtx } from '@milkdown/core';

// Import Crepe CSS
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

const TestPlate = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeInstanceRef = useRef<Crepe | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const initEditor = async () => {
      try {
        // Create Crepe editor with all features enabled
        const crepe = new Crepe({
          root: editorRef.current,
          defaultValue: `# Welcome to Milkdown! 🎉

This editor has **all Crepe features**:

## Block Features
- **Drag handle** appears on the left (hover over blocks)
- **Slash commands** - Type \`/\` to see the menu
- **Toolbar** - Select text to see formatting options

## Test the AI Functions
Select text below and use the buttons to test:

Lorem ipsum dolor sit amet, consectetur adipiscing elit. This text can be selected and replaced with AI-generated content. Try selecting this paragraph!

## Next Steps
1. Type \`/\` to see slash commands
2. Select text to see the toolbar
3. Hover over blocks to see drag handles
4. Use the test buttons below
5. Ready to add AI integration!`,
          // Enable all features
          featureConfigs: {
            // Block editing with drag handles
            [Crepe.Feature.BlockEdit]: {},
            // Toolbar on text selection
            [Crepe.Feature.Toolbar]: {},
            // Link tooltip
            [Crepe.Feature.LinkTooltip]: {},
            // Image block
            [Crepe.Feature.ImageBlock]: {},
            // Code mirror for code blocks
            [Crepe.Feature.CodeMirror]: {},
            // List item
            [Crepe.Feature.ListItem]: {},
            // Cursor
            [Crepe.Feature.Cursor]: {},
            // Placeholder
            [Crepe.Feature.Placeholder]: {
              text: 'Type / for commands...',
            },
          },
        });

        await crepe.create();
        crepeInstanceRef.current = crepe;
        setEditorReady(true);

        console.log('✅ Crepe editor created with all features');
      } catch (error) {
        console.error('❌ Failed to create Crepe editor:', error);
      }
    };

    initEditor();

    return () => {
      if (crepeInstanceRef.current) {
        crepeInstanceRef.current.destroy();
        crepeInstanceRef.current = null;
      }
    };
  }, []);

  // Get selected text from editor
  const getSelection = () => {
    if (!crepeInstanceRef.current) return;

    const editor = crepeInstanceRef.current.editor;
    if (!editor) return;

    editor.action((ctx) => {
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
    if (!crepeInstanceRef.current) return;

    const editor = crepeInstanceRef.current.editor;
    if (!editor) return;

    editor.action((ctx) => {
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
    if (!crepeInstanceRef.current) return '';

    const editor = crepeInstanceRef.current.editor;
    if (!editor) return '';

    let markdown = '';
    editor.action((ctx) => {
      const serializer = ctx.get(serializerCtx);
      const view = ctx.get(editorViewCtx);
      markdown = serializer(view.state.doc);
    });
    return markdown;
  };

  // Insert content at cursor position
  const insertAtCursor = (content: string) => {
    if (!crepeInstanceRef.current) return;

    const editor = crepeInstanceRef.current.editor;
    if (!editor) return;

    editor.action((ctx) => {
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
    const aiGeneratedContent = `**✨ AI Enhanced Version:**

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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-2">
            🚀 Crepe Editor with Full Features
          </h1>
          <p className="text-blue-100">
            Complete Milkdown experience with block editing, slash commands, and toolbar
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900">Block Editor</h3>
            <p className="text-sm text-gray-600">Drag handles like Notion</p>
          </div>
          <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-900">Slash Commands</h3>
            <p className="text-sm text-gray-600">Type / for commands</p>
          </div>
          <div className="bg-white p-4 rounded-lg border-2 border-green-200">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="font-semibold text-gray-900">AI Ready</h3>
            <p className="text-sm text-gray-600">Full ProseMirror access</p>
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div
            ref={editorRef}
            className="min-h-[500px]"
          />
        </div>

        {/* AI Controls */}
        {editorReady && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900">AI Controls</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={getSelection}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                📝 Get Selected Text
              </button>

              <button
                onClick={simulateAIReplacement}
                className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium shadow-sm"
              >
                ✨ Simulate AI Replacement
              </button>

              <button
                onClick={() => insertAtCursor('\n\n**New paragraph inserted!**\n\n')}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
              >
                ➕ Insert at Cursor
              </button>

              <button
                onClick={() => {
                  const md = getMarkdown();
                  console.log('📄 Full markdown:', md);
                  alert('Check console for full markdown');
                }}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-sm"
              >
                📄 Get Full Markdown
              </button>
            </div>

            {/* Selected text display */}
            {selectedText && (
              <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Selected Text (Ready for AI):
                </p>
                <pre className="text-sm text-blue-800 whitespace-pre-wrap font-mono bg-white p-3 rounded border border-blue-100 max-h-40 overflow-auto">
                  {selectedText}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <span>💡</span> How to Use This Editor
          </h3>
          <div className="space-y-3 text-sm text-amber-900">
            <div className="flex gap-3">
              <span className="font-bold min-w-[30px]">1.</span>
              <span>
                <strong>Hover over blocks</strong> to see the drag handle (left side)
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold min-w-[30px]">2.</span>
              <span>
                <strong>Type /</strong> anywhere to open slash commands
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold min-w-[30px]">3.</span>
              <span>
                <strong>Select text</strong> to see the formatting toolbar appear
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold min-w-[30px]">4.</span>
              <span>
                <strong>Use AI buttons</strong> to test text manipulation
              </span>
            </div>
            <div className="flex gap-3 pt-3 border-t-2 border-amber-300">
              <span className="text-lg">🎯</span>
              <span>
                <strong>Next:</strong> Integrate AI plugin from{' '}
                <code className="bg-amber-100 px-2 py-1 rounded">src/plugins/ai</code> to add AI options to slash menu and toolbar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPlate;
