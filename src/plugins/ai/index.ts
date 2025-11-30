/**
 * Milkdown AI Plugin - Proper integration with Milkdown editor
 * Provides AI assistance through toolbar and slash menu
 */

import { Crepe } from '@milkdown/crepe';

// Type for ProseMirror EditorView
interface ProseMirrorNode {
  type: string;
}

interface Transaction {
  replaceWith: (from: number, to: number, node: ProseMirrorNode) => Transaction;
  insert: (pos: number, node: ProseMirrorNode) => Transaction;
}

interface EditorView {
  state: {
    selection: {
      from: number;
      to: number;
    };
    doc: {
      textBetween: (from: number, to: number, separator?: string) => string;
    };
    tr: Transaction;
    schema: {
      text: (text: string) => ProseMirrorNode;
    };
  };
  dispatch: (tr: Transaction) => void;
}

// Editor utility functions for AI integration
export class MilkdownAIUtils {
  private crepe: Crepe | null = null;

  setCrepe(crepe: Crepe) {
    this.crepe = crepe;
  }

  /**
   * Get selected text from editor
   */
  getSelectedText(): string {
    if (!this.crepe) return '';
    
    try {
      const editor = this.crepe.editor;
      if (!editor) return '';

      // Access editor state through Milkdown's context
      const view = editor.ctx.get('editorViewCtx') as EditorView;
      if (!view) return '';

      const { state } = view;
      const { from, to } = state.selection;
      
      // If selection is collapsed (cursor position), return empty
      if (from === to) return '';
      
      return state.doc.textBetween(from, to, ' ');
    } catch (error) {
      console.error('Failed to get selected text:', error);
      return '';
    }
  }

  /**
   * Replace selected text with new content
   */
  replaceSelectedText(text: string): boolean {
    if (!this.crepe) return false;

    try {
      const editor = this.crepe.editor;
      if (!editor) return false;

      const view = editor.ctx.get('editorViewCtx') as EditorView;
      if (!view) return false;

      const { state, dispatch } = view;
      const { from, to } = state.selection;

      // Create transaction to replace text
      const tr = state.tr.replaceWith(
        from,
        to,
        state.schema.text(text)
      );

      dispatch(tr);
      return true;
    } catch (error) {
      console.error('Failed to replace selected text:', error);
      return false;
    }
  }

  /**
   * Insert text at cursor position
   */
  insertAtCursor(text: string): boolean {
    if (!this.crepe) return false;

    try {
      const editor = this.crepe.editor;
      if (!editor) return false;

      const view = editor.ctx.get('editorViewCtx') as EditorView;
      if (!view) return false;

      const { state, dispatch } = view;
      const { from } = state.selection;

      // Create transaction to insert text
      const tr = state.tr.insert(from, state.schema.text(text));

      dispatch(tr);
      return true;
    } catch (error) {
      console.error('Failed to insert at cursor:', error);
      return false;
    }
  }

  /**
   * Get cursor position info
   */
  getCursorContext(): { hasSelection: boolean; position: number } {
    if (!this.crepe) return { hasSelection: false, position: 0 };

    try {
      const editor = this.crepe.editor;
      if (!editor) return { hasSelection: false, position: 0 };

      const view = editor.ctx.get('editorViewCtx') as EditorView;
      if (!view) return { hasSelection: false, position: 0 };

      const { state } = view;
      const { from, to } = state.selection;

      return {
        hasSelection: from !== to,
        position: from,
      };
    } catch (error) {
      console.error('Failed to get cursor context:', error);
      return { hasSelection: false, position: 0 };
    }
  }
}

// Singleton instance for editor utilities
export const milkdownAIUtils = new MilkdownAIUtils();

/**
 * AI Slash Menu Configuration
 */
export const createAISlashMenuConfig = (onAIClick: () => void) => ({
  buildMenu: (builder: { addGroup: (id: string, label: string) => { addItem: (id: string, config: Record<string, unknown>) => unknown } }) => {
    builder.addGroup("AI", "AI").addItem("assistant", {
      label: "AI Assistant",
      icon: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path d="M 100 10 C 115 60, 140 85, 190 100 C 140 115, 115 140, 100 190 C 85 140, 60 115, 10 100 C 60 85, 85 60, 100 10 Z" fill="currentColor"/></svg>`,
      onRun: () => {
        onAIClick();
      },
    });
  },
});

/**
 * AI Toolbar Configuration
 */
export const createAIToolbarConfig = (onAIClick: () => void) => ({
  buildToolbar: (builder: { addGroup: (id: string, label: string) => { addItem: (id: string, config: Record<string, unknown>) => unknown } }) => {
    builder.addGroup("ai", "AI").addItem("assistant", {
      icon: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path d="M 100 10 C 115 60, 140 85, 190 100 C 140 115, 115 140, 100 190 C 85 140, 60 115, 10 100 C 60 85, 85 60, 100 10 Z" fill="currentColor"/></svg>`,
      active: () => false,
      onRun: () => {
        onAIClick();
      },
    });
  },
});