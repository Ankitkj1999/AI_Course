/**
 * Actions Plugin
 * Provides import/export functionality for editor state
 * Based on Lexical Playground's ActionsPlugin pattern
 */

import type { LexicalEditor } from 'lexical';
import type { JSX } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { exportFile, importFile } from '@lexical/file';

export default function ActionsPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const handleImport = () => {
    importFile(editor);
  };

  const handleExport = () => {
    exportFile(editor, {
      fileName: `AiCourse-Editor-${new Date().toISOString()}`,
      source: 'AiCourse',
    });
  };

  return (
    <div className="actions-container">
      <button
        className="action-button import"
        onClick={handleImport}
        title="Import"
        aria-label="Import editor state from JSON"
      >
        <i className="import" />
        <span className="action-text">Import</span>
      </button>

      <button
        className="action-button export"
        onClick={handleExport}
        title="Export"
        aria-label="Export editor state to JSON"
      >
        <i className="export" />
        <span className="action-text">Export</span>
      </button>
    </div>
  );
}
