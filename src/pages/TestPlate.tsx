import React, { useMemo, useCallback, useState } from 'react';
import { createEditor, Descendant, Editor, Transforms, Element as SlateElement, BaseEditor } from 'slate';
import { Slate, Editable, withReact, RenderLeafProps, RenderElementProps, ReactEditor } from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, Heading1, Heading2, Sparkles } from 'lucide-react';

type CustomElement = { type: 'paragraph' | 'h1' | 'h2'; children: CustomText[] };
type CustomText = { text: string; bold?: boolean; italic?: boolean; underline?: boolean };

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const TestPlate = () => {
  const [value, setValue] = useState<Descendant[]>([
    {
      type: 'h1',
      children: [{ text: 'Plate.js AI Editor Test' }],
    },
    {
      type: 'paragraph',
      children: [{ text: 'This is a test page for Plate.js with AI-powered features.' }],
    },
    {
      type: 'paragraph',
      children: [
        { text: 'Try typing and using ' },
        { text: 'bold', bold: true },
        { text: ', ' },
        { text: 'italic', italic: true },
        { text: ', and ' },
        { text: 'underline', underline: true },
        { text: ' formatting.' },
      ],
    },
  ]);

  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const renderElement = useCallback((props: RenderElementProps) => {
    switch (props.element.type) {
      case 'h1':
        return <h1 className="text-3xl font-bold my-4" {...props.attributes}>{props.children}</h1>;
      case 'h2':
        return <h2 className="text-2xl font-bold my-3" {...props.attributes}>{props.children}</h2>;
      default:
        return <p className="my-2" {...props.attributes}>{props.children}</p>;
    }
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    let { children } = props;
    
    if (props.leaf.bold) {
      children = <strong>{children}</strong>;
    }
    if (props.leaf.italic) {
      children = <em>{children}</em>;
    }
    if (props.leaf.underline) {
      children = <u>{children}</u>;
    }

    return <span {...props.attributes}>{children}</span>;
  }, []);

  const toggleMark = (format: string) => {
    const isActive = isMarkActive(editor, format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  const toggleBlock = (format: 'h1' | 'h2') => {
    const isActive = isBlockActive(editor, format);
    Transforms.setNodes(
      editor,
      { type: isActive ? 'paragraph' : format },
      { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) }
    );
  };

  const isMarkActive = (editor: Editor, format: string) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  };

  const isBlockActive = (editor: Editor, format: string) => {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: n => SlateElement.isElement(n) && n.type === format,
      })
    );

    return !!match;
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Plate.js Test Environment</h1>
        <p className="text-muted-foreground">
          Testing rich text editor with AI capabilities (Slate.js foundation)
        </p>
      </div>

      <div className="border rounded-lg bg-card shadow-sm">
        <div className="border-b p-2 flex gap-1 flex-wrap">
          <Button
            size="sm"
            variant={isMarkActive(editor, 'bold') ? 'default' : 'outline'}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleMark('bold');
            }}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={isMarkActive(editor, 'italic') ? 'default' : 'outline'}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleMark('italic');
            }}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={isMarkActive(editor, 'underline') ? 'default' : 'outline'}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleMark('underline');
            }}
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px bg-border mx-1" />
          <Button
            size="sm"
            variant={isBlockActive(editor, 'h1') ? 'default' : 'outline'}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleBlock('h1');
            }}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={isBlockActive(editor, 'h2') ? 'default' : 'outline'}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleBlock('h2');
            }}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <div className="w-px bg-border mx-1" />
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onMouseDown={(e) => {
              e.preventDefault();
              // Placeholder for AI features
              alert('AI features coming soon!');
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assist
          </Button>
        </div>
        
        <div className="p-6">
          <Slate editor={editor} initialValue={value} onChange={setValue}>
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              placeholder="Start typing..."
              className="min-h-[400px] focus:outline-none"
            />
          </Slate>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Keyboard Shortcuts:</h3>
        <ul className="space-y-1 text-sm">
          <li><kbd className="px-2 py-1 bg-background rounded">Cmd/Ctrl + B</kbd> - Bold</li>
          <li><kbd className="px-2 py-1 bg-background rounded">Cmd/Ctrl + I</kbd> - Italic</li>
          <li><kbd className="px-2 py-1 bg-background rounded">Cmd/Ctrl + U</kbd> - Underline</li>
        </ul>
      </div>
    </div>
  );
};

export default TestPlate;
