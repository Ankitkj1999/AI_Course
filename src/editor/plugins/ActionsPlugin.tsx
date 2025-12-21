/**
 * Actions Plugin
 * Provides import/export functionality for editor state in multiple formats
 * Supports JSON, HTML, and Markdown import/export
 * Based on Lexical Playground's ActionsPlugin pattern
 */

import type { LexicalEditor } from 'lexical';
import type { JSX } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { exportFile, importFile } from '@lexical/file';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $convertToMarkdownString, $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { $getRoot, $insertNodes } from 'lexical';
import { useState, useRef, useEffect } from 'react';

export default function ActionsPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const jsonImportRef = useRef<HTMLInputElement>(null);
  const htmlImportRef = useRef<HTMLInputElement>(null);
  const markdownImportRef = useRef<HTMLInputElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const importDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (importDropdownRef.current && !importDropdownRef.current.contains(event.target as Node)) {
        setShowImportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper function to download files
  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export functions
  const handleExportJSON = () => {
    exportFile(editor, {
      fileName: `AiCourse-Editor-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
      source: 'AiCourse',
    });
    setShowExportMenu(false);
  };

  const handleExportHTML = () => {
    editor.update(() => {
      const htmlString = $generateHtmlFromNodes(editor, null);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadFile(htmlString, `AiCourse-Editor-${timestamp}.html`, 'text/html');
    });
    setShowExportMenu(false);
  };

  const handleExportMarkdown = () => {
    editor.update(() => {
      const markdown = $convertToMarkdownString(TRANSFORMERS);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadFile(markdown, `AiCourse-Editor-${timestamp}.md`, 'text/markdown');
    });
    setShowExportMenu(false);
  };

  // Import functions
  const handleImportJSON = () => {
    importFile(editor);
    setShowImportMenu(false);
  };

  const handleImportHTML = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const htmlString = e.target?.result as string;
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(htmlString, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        $getRoot().clear();
        $getRoot().select();
        $insertNodes(nodes);
      });
    };
    reader.readAsText(file);
    setShowImportMenu(false);
  };

  const handleImportMarkdown = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const markdown = e.target?.result as string;
      editor.update(() => {
        $getRoot().clear();
        $convertFromMarkdownString(markdown, TRANSFORMERS);
      });
    };
    reader.readAsText(file);
    setShowImportMenu(false);
  };

  const handleFileSelect = (ref: React.RefObject<HTMLInputElement>, handler: (file: File) => void) => {
    const input = ref.current;
    if (input) {
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handler(file);
        }
        input.value = ''; // Reset input
      };
      input.click();
    }
  };

  return (
    <div className="actions-container">
      {/* Export Dropdown */}
      <div className="action-dropdown" ref={exportDropdownRef}>
        <button
          className="action-button export"
          onClick={() => {
            setShowExportMenu(!showExportMenu);
            setShowImportMenu(false);
          }}
          title="Export"
          aria-label="Export editor content"
        >
          <i className="export" />
          <span className="action-text">Export</span>
          <i className="chevron-down" />
        </button>
        
        {showExportMenu && (
          <div className="dropdown-menu export-menu">
            <button
              className="dropdown-item"
              onClick={handleExportJSON}
              title="Export as JSON"
            >
              <i className="json-icon" />
              <span>JSON</span>
            </button>
            <button
              className="dropdown-item"
              onClick={handleExportHTML}
              title="Export as HTML"
            >
              <i className="html-icon" />
              <span>HTML</span>
            </button>
            <button
              className="dropdown-item"
              onClick={handleExportMarkdown}
              title="Export as Markdown"
            >
              <i className="markdown-icon" />
              <span>Markdown</span>
            </button>
          </div>
        )}
      </div>

      {/* Import Dropdown */}
      <div className="action-dropdown" ref={importDropdownRef}>
        <button
          className="action-button import"
          onClick={() => {
            setShowImportMenu(!showImportMenu);
            setShowExportMenu(false);
          }}
          title="Import"
          aria-label="Import editor content"
        >
          <i className="import" />
          <span className="action-text">Import</span>
          <i className="chevron-down" />
        </button>
        
        {showImportMenu && (
          <div className="dropdown-menu import-menu">
            <button
              className="dropdown-item"
              onClick={handleImportJSON}
              title="Import from JSON"
            >
              <i className="json-icon" />
              <span>JSON</span>
            </button>
            <button
              className="dropdown-item"
              onClick={() => handleFileSelect(htmlImportRef, handleImportHTML)}
              title="Import from HTML"
            >
              <i className="html-icon" />
              <span>HTML</span>
            </button>
            <button
              className="dropdown-item"
              onClick={() => handleFileSelect(markdownImportRef, handleImportMarkdown)}
              title="Import from Markdown"
            >
              <i className="markdown-icon" />
              <span>Markdown</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={htmlImportRef}
        type="file"
        accept=".html,.htm"
        style={{ display: 'none' }}
      />
      <input
        ref={markdownImportRef}
        type="file"
        accept=".md,.markdown"
        style={{ display: 'none' }}
      />
    </div>
  );
}
