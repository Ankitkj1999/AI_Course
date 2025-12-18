import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection } from 'lexical';
import {useState, useEffect} from 'react';

export default function TreeViewPlugin() {
  const [editor] = useLexicalComposerContext();
  const [tree, setTree] = useState<string>('');

  useEffect(() => {
    return editor.registerUpdateListener(({editorState}) => {
      editorState.read(() => {
        const root = $getRoot();
        const selection = $getSelection();
        const rootText = root.getTextContent();
        const selectionText = selection?.getTextContent() || '';
        
        setTree(`Root: "${rootText}"\nSelection: "${selectionText}"`);
      });
    });
  }, [editor]);

  return (
    <div className="tree-view-output">
      <pre className="tree-view-code">{tree}</pre>
    </div>
  );
}