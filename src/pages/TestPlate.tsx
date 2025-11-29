import { useEffect, useRef } from 'react';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
// Light themes
// import '@milkdown/crepe/theme/crepe.css'
import '@milkdown/crepe/theme/nord.css'
// import '@milkdown/crepe/theme/frame.css'

// Dark themes
// import '@milkdown/crepe/theme/crepe-dark.css'
// import '@milkdown/crepe/theme/nord-dark.css'
// import '@milkdown/crepe/theme/frame-dark.css'

import { aiSlashMenuItem, aiToolbarItem } from '../plugins/ai';



const TestPlate = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue: `# Welcome to Milkdown Editor

This is a powerful **markdown editor** with a beautiful interface.

## Features

- 📝 **Rich Markdown Support** - Write in markdown with live preview
- 🎨 **Beautiful Theme** - Modern, clean interface
- ⚡ **Fast & Lightweight** - Built with ProseMirror

## Try It Out

Type **/** to open the command menu and explore available options.

> 💡 **Tip**: You can use standard markdown syntax like **bold**, *italic*, \`code\`, and more!

Start writing below...
      `,
      featureConfigs: {
        [Crepe.Feature.BlockEdit]: {
          buildMenu: (builder) => {
            builder.addGroup("AI", "AI").addItem("assistant", aiSlashMenuItem);
          },
        },
        [Crepe.Feature.Toolbar]: {
          buildToolbar: (builder) => {
            builder.addGroup("ai", "AI").addItem("assistant", aiToolbarItem);
          },
        },
      },
    });

    crepe.create().then(() => {
      console.log('Milkdown editor created successfully');
      crepeRef.current = crepe;
    }).catch((error) => {
      console.error('Failed to create editor:', error);
    });

    return () => {
      if (crepeRef.current) {
        crepeRef.current.destroy();
        crepeRef.current = null;
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Milkdown Editor</h1>
        <p className="text-muted-foreground">
          A powerful markdown editor with a beautiful interface. Type <kbd className="px-2 py-1 text-xs bg-muted rounded">/</kbd> to open the command menu.
        </p>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <div
          ref={editorRef}
          className="min-h-[500px] milkdown-editor-wrapper"
        />
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Features:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium mb-1">Editor:</p>
            <ul className="space-y-1">
              <li>📝 Full markdown support</li>
              <li>🎨 Beautiful WYSIWYG interface</li>
              <li>⚡ Real-time preview</li>
              <li>⌨️ Keyboard shortcuts</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Commands:</p>
            <ul className="space-y-1">
              <li>📄 Headings and paragraphs</li>
              <li>• Lists and checklists</li>
              <li>📊 Tables and quotes</li>
              <li>🔗 Links and images</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-background rounded border">
          <p className="text-xs font-medium mb-2">💡 Pro Tips:</p>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• Type <kbd className="px-1 py-0.5 bg-muted rounded">/</kbd> to access all commands</li>
            <li>• Use <kbd className="px-1 py-0.5 bg-muted rounded">**text**</kbd> for bold and <kbd className="px-1 py-0.5 bg-muted rounded">*text*</kbd> for italic</li>
            <li>• Press <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+Z</kbd> to undo changes</li>
            <li>• Drag and drop images directly into the editor</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Built with Milkdown - A modern WYSIWYG markdown editor
        </p>
      </div>
    </div>
  );
};

export default TestPlate;
