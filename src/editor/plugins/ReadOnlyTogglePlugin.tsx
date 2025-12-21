/**
 * Read-Only Toggle Plugin
 * Provides a floating button to toggle read-only mode for the editor
 * Based on Lexical Playground's ActionsPlugin pattern
 */

import type { JSX } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useState, useEffect } from 'react';
import { mergeRegister } from '@lexical/utils';

export default function ReadOnlyTogglePlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      })
    );
  }, [editor]);

  const handleToggleReadOnly = () => {
    editor.setEditable(!editor.isEditable());
  };

  return (
    <div className="read-only-toggle">
      <button
        className={`read-only-button ${!isEditable ? 'unlock' : 'lock'}`}
        onClick={handleToggleReadOnly}
        title={`${!isEditable ? 'Enable' : 'Disable'} editing`}
        aria-label={`${!isEditable ? 'Unlock' : 'Lock'} read-only mode`}
      >
        <i className={!isEditable ? 'unlock' : 'lock'} />
        <span className="read-only-text">
          {!isEditable ? 'Read Only' : 'Editable'}
        </span>
      </button>
    </div>
  );
}