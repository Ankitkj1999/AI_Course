import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Crepe } from '@milkdown/crepe';
import { editorViewCtx, parserCtx, serializerCtx } from '@milkdown/core';

// Import Crepe CSS
import '../../node_modules/@milkdown/crepe/lib/theme/common/style.css';
import '../../node_modules/@milkdown/crepe/lib/theme/crepe/style.css';
import '../../node_modules/@milkdown/crepe/lib/theme/crepe-dark/style.css';

import { useToast } from '@/hooks/use-toast';
import { useAuthState } from '@/hooks/useAuthState';

interface GuideData {
  _id: string;
  title: string;
  content: string;
  keyword: string;
  slug: string;
  // ... other fields
}

const GuideEditor = () => {
  const { slug } = useParams<{ slug: string }>();
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeInstanceRef = useRef<Crepe | null>(null);
  const [guide, setGuide] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReadMode, setIsReadMode] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  
  const { toast } = useToast();
  const { isAuthenticated } = useAuthState();

  // Load guide from API
  useEffect(() => {
    const loadGuide = async () => {
      try {
        const response = await fetch(`/api/guide/${slug}`);
        const data = await response.json();
        
        if (data.success) {
          setGuide(data.guide);
        } else {
          toast({
            title: "Error",
            description: "Failed to load guide",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Failed to load guide:', error);
        toast({
          title: "Error",
          description: "Failed to load guide",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadGuide();
    }
  }, [slug, toast]);

  // Initialize editor when guide is loaded
  useEffect(() => {
    if (!editorRef.current || !guide?.content) return;

    const initEditor = async () => {
      try {
        const crepe = new Crepe({
          root: editorRef.current,
          defaultValue: guide.content, // Load the markdown content here
          featureConfigs: {
            [Crepe.Feature.BlockEdit]: {},
            [Crepe.Feature.Toolbar]: {},
            [Crepe.Feature.LinkTooltip]: {},
            [Crepe.Feature.ImageBlock]: {},
            [Crepe.Feature.CodeMirror]: {},
            [Crepe.Feature.ListItem]: {},
            [Crepe.Feature.Cursor]: {},
            [Crepe.Feature.Placeholder]: {
              text: 'Start editing...',
            },
          },
        });

        await crepe.create();
        crepeInstanceRef.current = crepe;
        setEditorReady(true);
      } catch (error) {
        console.error('Failed to create editor:', error);
      }
    };

    initEditor();

    return () => {
      if (crepeInstanceRef.current) {
        crepeInstanceRef.current.destroy();
        crepeInstanceRef.current = null;
      }
    };
  }, [guide]);

  // Toggle read/edit mode
  const toggleReadMode = () => {
    if (!crepeInstanceRef.current?.editor) return;
    
    crepeInstanceRef.current.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      view.setProps({ editable: () => isReadMode });
    });
    
    setIsReadMode(!isReadMode);
  };

  // Save edited content
  const saveGuide = async () => {
    if (!crepeInstanceRef.current?.editor) return;

    try {
      let markdown = '';
      crepeInstanceRef.current.editor.action((ctx) => {
        const serializer = ctx.get(serializerCtx);
        const view = ctx.get(editorViewCtx);
        markdown = serializer(view.state.doc);
      });

      const response = await fetch(`/api/guide/${slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: markdown
        }),
      });

      if (response.ok) {
        toast({
          title: "Saved!",
          description: "Guide updated successfully",
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save guide",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading guide...</div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Guide not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold mb-2">{guide.title}</h1>
          <p className="text-gray-600">{guide.keyword}</p>
        </div>

        {/* Editor */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Controls */}
          {editorReady && isAuthenticated && (
            <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50">
              <button
                onClick={toggleReadMode}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  isReadMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isReadMode ? '✏️ Edit Mode' : '👁️ Read Mode'}
              </button>

              {!isReadMode && (
                <button
                  onClick={saveGuide}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                >
                  💾 Save Changes
                </button>
              )}
            </div>
          )}

          {/* Milkdown Editor */}
          <div ref={editorRef} className="min-h-[600px] p-6" />
        </div>
      </div>
    </div>
  );
};

export default GuideEditor;
