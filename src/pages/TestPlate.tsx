import { useEffect, useRef, useState } from 'react';
import { Crepe } from '@milkdown/crepe';
import { editorViewCtx, parserCtx, serializerCtx } from '@milkdown/core';

// Import Crepe CSS
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

// Import AI components
import { useAIModal } from '../plugins/ai/hooks/useAIModal';
import AIModal, { type AIOption } from '../plugins/ai/ui/AIModal';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from '@/hooks/useAuthState';

const TestPlate = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeInstanceRef = useRef<Crepe | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [editorReady, setEditorReady] = useState(false);
  
  // AI Modal state
  const aiModal = useAIModal();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthState();

  // Create a ref for AI modal to avoid dependency issues
  const aiModalRef = useRef(aiModal);
  aiModalRef.current = aiModal;

  useEffect(() => {
    if (!editorRef.current) return;

    const initEditor = async () => {
      try {
        // Create Crepe editor with all features enabled
        const crepe = new Crepe({
          root: editorRef.current,
          defaultValue: `# Welcome to Milkdown! 🎉

This editor has **all Crepe features** + **AI Integration**:

## Block Features
- **Drag handle** appears on the left (hover over blocks)
- **Slash commands** - Type \`/\` to see the menu
- **Toolbar with AI** - Select text to see formatting options + ✨ AI button

## Test the AI Features
Select text below and click the ✨ AI button in the toolbar:

Lorem ipsum dolor sit amet, consectetur adipiscing elit. This text can be selected and replaced with AI-generated content. Try selecting this paragraph and clicking the AI button!

## Next Steps
1. **Select text** → Click ✨ AI button in toolbar
2. Type \`/\` to see slash commands (AI commands coming in Phase 3)
3. Hover over blocks to see drag handles
4. Use the test buttons below for manual testing`,
          // Enable all features
          featureConfigs: {
            // Block editing with drag handles
            [Crepe.Feature.BlockEdit]: {},
            // Toolbar on text selection with AI button
            [Crepe.Feature.Toolbar]: {
              buildToolbar: (builder) => {
                // Add AI group with AI button
                builder.addGroup('ai', 'AI').addItem('ai-assist', {
                  icon: '✨',
                  active: () => false, // Never show as active
                  onRun: (ctx) => {
                    // Get selected text when AI button is clicked
                    const view = ctx.get(editorViewCtx);
                    const { from, to } = view.state.selection;
                    const selectedText = view.state.doc.textBetween(from, to, '\n');
                    
                    // Open AI modal with toolbar context
                    aiModalRef.current.openModal('toolbar', selectedText);
                  },
                });
              },
            },
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

  // Generic helper to execute actions in editor context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executeInEditor = <T,>(callback: (ctx: any) => T): T | undefined => {
    if (!crepeInstanceRef.current?.editor) return;
    let result: T;
    crepeInstanceRef.current.editor.action((ctx) => {
      result = callback(ctx);
    });
    return result!;
  };

  // Get selected text from editor
  const getSelection = () => {
    const result = executeInEditor((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { from, to } = view.state.selection;
      const text = view.state.doc.textBetween(from, to, '\n');
      return { text, from, to };
    });

    if (result) {
      setSelectedText(result.text);
      console.log('📝 Selected text:', result.text);
      console.log('📍 Selection range:', { from: result.from, to: result.to });
    }
  };

  // Replace selected text with new content
  const replaceSelection = (newText: string) => {
    executeInEditor((ctx) => {
      const view = ctx.get(editorViewCtx);
      const parser = ctx.get(parserCtx);
      const { from, to } = view.state.selection;

      const newDoc = parser(newText);
      const tr = view.state.tr.replaceWith(from, to, newDoc.content);
      view.dispatch(tr);
    });
    console.log('✅ Content replaced');
  };

  // Get full markdown content
  const getMarkdown = (): string => {
    return executeInEditor((ctx) => {
      const serializer = ctx.get(serializerCtx);
      const view = ctx.get(editorViewCtx);
      return serializer(view.state.doc);
    }) || '';
  };

  // Insert content at cursor position
  const insertAtCursor = (content: string) => {
    executeInEditor((ctx) => {
      const view = ctx.get(editorViewCtx);
      const parser = ctx.get(parserCtx);
      const { from } = view.state.selection;

      const newDoc = parser(content);
      const tr = view.state.tr.insert(from, newDoc.content);
      view.dispatch(tr);
    });
    console.log('✅ Content inserted at cursor');
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

  // AI Execution Handler
  const handleAIExecution = async (option: AIOption | null, customPrompt?: string) => {
    try {
      // Get current selection for context
      const currentSelection = executeInEditor((ctx) => {
        const view = ctx.get(editorViewCtx);
        const { from, to } = view.state.selection;
        return view.state.doc.textBetween(from, to, '\n');
      }) || '';

      // Get full document for context
      const fullMarkdown = getMarkdown();

      // Construct prompt based on option and context
      let prompt: string;

      if (option) {
        // Predefined option selected
        if (aiModal.context === 'toolbar' && currentSelection) {
          // Use selected text as context for the task
          prompt = `${option.label} the following text:\n\n${currentSelection}`;
        } else {
          // No selected text, use document context
          const contextSnippet = fullMarkdown.slice(-500); // Last 500 chars for context
          prompt = `${option.label}. Current context:\n\n${contextSnippet}`;
        }
      } else if (customPrompt) {
        // Custom prompt entered
        if (aiModal.context === 'toolbar' && currentSelection) {
          // Add selected text as context
          prompt = `${customPrompt}\n\nContext (selected text):\n${currentSelection}`;
        } else {
          // Use document context
          const contextSnippet = fullMarkdown.slice(-500);
          prompt = `${customPrompt}\n\nCurrent document context:\n${contextSnippet}`;
        }
      } else {
        throw new Error('No option or prompt provided');
      }

      // Call backend LLM service
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt: prompt.trim(),
          temperature: 0.7,
          preferFree: true,
        }),
      });

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to use AI features.');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data?.content) {
        throw new Error(result.error?.message || 'Failed to generate content');
      }

      // Insert or replace content based on context
      if (aiModal.context === 'toolbar' && currentSelection) {
        // Replace selected text
        replaceSelection(result.data.content);
      } else {
        // Insert at cursor
        insertAtCursor('\n\n' + result.data.content + '\n\n');
      }

      toast({
        title: "✨ AI completed!",
        description: `Generated by ${result.data.providerName} in ${result.data.responseTime}ms`,
      });
    } catch (error) {
      console.error('AI execution error:', error);

      // Provide user-friendly error messages
      let errorMessage = "Failed to process request";
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Authentication')) {
          errorMessage = "Please log in to use AI features";
        } else if (error.message.includes('429')) {
          errorMessage = "AI service is busy. Please try again later";
        } else if (error.message.includes('500')) {
          errorMessage = "AI service temporarily unavailable";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "AI Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-2">
            🚀 Crepe Editor with AI Integration
          </h1>
          <p className="text-blue-100">
            Complete Milkdown experience with block editing, slash commands, toolbar + ✨ AI Assistant
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
              <h3 className="text-lg font-semibold text-gray-900">
                AI Controls {isAuthenticated ? '' : '(Login Required)'}
              </h3>
            </div>

            {isAuthenticated ? (
              <div className="grid grid-cols-3 gap-3">
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
                  onClick={() => {
                    const current = executeInEditor((ctx) => {
                      const view = ctx.get(editorViewCtx);
                      const { from, to } = view.state.selection;
                      return view.state.doc.textBetween(from, to, '\n');
                    }) || '';
                    aiModal.openModal('toolbar', current);
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium shadow-sm"
                >
                  🤖 Open AI Modal
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
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🔒</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">AI Features Require Login</h4>
                <p className="text-gray-600 mb-4">
                  Please log in to access AI-powered content generation and editing features.
                </p>
                <a
                  href="/login"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Log In to Continue
                </a>
              </div>
            )}

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
                <strong>Select text</strong> → Click <strong>✨ AI button</strong> in toolbar (Phase 2 ✅)
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold min-w-[30px]">2.</span>
              <span>
                <strong>Type /</strong> to open slash commands (AI commands in Phase 3)
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold min-w-[30px]">3.</span>
              <span>
                <strong>Hover over blocks</strong> to see drag handles
              </span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold min-w-[30px]">4.</span>
              <span>
                <strong>Use test buttons below</strong> for manual testing
              </span>
            </div>
            <div className="flex gap-3 pt-3 border-t-2 border-amber-300">
              <span className="text-lg">✅</span>
              <span>
                <strong>Phase 2 Complete!</strong> AI button now appears in toolbar when you select text. Phase 3 next: AI commands in slash menu.
                {isAuthenticated ? '' : ' (requires login)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Modal */}
      <AIModal
        isOpen={aiModal.isOpen}
        onClose={aiModal.closeModal}
        context={aiModal.context}
        selectedText={aiModal.selectedText}
        onExecuteAI={handleAIExecution}
      />
    </div>
  );
};

export default TestPlate;
