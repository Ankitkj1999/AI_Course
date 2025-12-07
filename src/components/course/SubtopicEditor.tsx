import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Crepe } from '@milkdown/crepe';
import { editorViewCtx, serializerCtx } from '@milkdown/core';

// Import Crepe CSS
import '../../../node_modules/@milkdown/crepe/lib/theme/common/style.css';
import '../../../node_modules/@milkdown/crepe/lib/theme/crepe/style.css';
import '../../../node_modules/@milkdown/crepe/lib/theme/crepe-dark/style.css';

interface SubtopicEditorProps {
  isOpen: boolean;
  onClose: () => void;
  subtopicTitle: string;
  initialContent: string;
  onSave: (newContent: string) => void;
}

export const SubtopicEditor: React.FC<SubtopicEditorProps> = ({
  isOpen,
  onClose,
  subtopicTitle,
  initialContent,
  onSave,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeInstanceRef = useRef<Crepe | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('SubtopicEditor useEffect triggered:', { 
      isOpen, 
      hasEditorRef: !!editorRef.current, 
      initialContent: initialContent?.substring(0, 50) 
    });

    if (!isOpen || !initialContent) {
      console.log('Dialog not open or no content, skipping editor init');
      return;
    }

    // Wait for Dialog to fully render and ref to be attached
    const timer = setTimeout(() => {
      if (!editorRef.current) {
        console.log('Editor ref still not ready after timeout');
        return;
      }

      const initEditor = async () => {
        try {
          console.log('Initializing Crepe editor...');
          const crepe = new Crepe({
            root: editorRef.current!,
            defaultValue: initialContent,
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
          console.log('Crepe editor created successfully');
          crepeInstanceRef.current = crepe;
          setEditorReady(true);
        } catch (error) {
          console.error('Failed to create editor:', error);
          toast({
            title: 'Error',
            description: 'Failed to initialize editor',
            variant: 'destructive',
          });
        }
      };

      initEditor();
    }, 200); // Wait 200ms for Dialog to render

    return () => {
      clearTimeout(timer);
      if (crepeInstanceRef.current) {
        console.log('Destroying Crepe editor');
        crepeInstanceRef.current.destroy();
        crepeInstanceRef.current = null;
        setEditorReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialContent]);

  const handleSave = async () => {
    if (!crepeInstanceRef.current?.editor) return;

    try {
      setIsSaving(true);
      
      let markdown = '';
      crepeInstanceRef.current.editor.action((ctx) => {
        const serializer = ctx.get(serializerCtx);
        const view = ctx.get(editorViewCtx);
        markdown = serializer(view.state.doc);
      });

      await onSave(markdown);
      
      toast({
        title: 'Success',
        description: 'Content updated successfully',
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save content',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit: {subtopicTitle}</DialogTitle>
          <DialogDescription>
            Edit the lesson content using the Milkdown editor. You can use markdown formatting and AI commands.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden border rounded-lg">
          <div ref={editorRef} className="min-h-[500px] p-6" />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !editorReady}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
