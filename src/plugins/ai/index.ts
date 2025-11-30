/**
 * Milkdown AI Plugin - Core Milkdown integration with full AI text manipulation
 * Provides access to ProseMirror view for advanced AI operations
 */

import { Editor, editorViewCtx } from '@milkdown/core';

// Type for ProseMirror EditorView (minimal interface)
interface EditorViewLike {
  state: {
    selection: { from: number; to: number };
    doc: { textBetween: (from: number, to: number, separator?: string) => string };
    tr: {
      replaceWith: (from: number, to: number, node: unknown) => unknown;
      insert: (pos: number, node: unknown) => unknown;
    };
    schema: { text: (text: string) => unknown };
  };
  dispatch: (tr: unknown) => void;
}

// Editor utility functions for AI integration
export class MilkdownAIUtils {
  private editor: Editor | null = null;

  setEditor(editor: Editor) {
    console.log('setEditor called with editor:', editor);
    this.editor = editor;
  }

  /**
   * Get selected text from editor using Core Milkdown API
   */
  getSelectedText(): string {
    if (!this.editor) return '';

    try {
      return this.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        if (!view) return '';

        const state = view.state;
        if (!state) return '';

        const { from, to } = state.selection;
        if (from === to) return ''; // No selection

        return state.doc.textBetween(from, to, ' ');
      });
    } catch (error) {
      console.error('Failed to get selected text:', error);
      return '';
    }
  }

  /**
   * Replace selected text using Core Milkdown API
   */
  replaceSelectedText(text: string): boolean {
    if (!this.editor) {
      console.error('Editor not available');
      return false;
    }

    try {
      this.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        if (!view) {
          throw new Error('Editor view not available');
        }

        const { state, dispatch } = view;
        const { from, to } = state.selection;

        // Create transaction to replace text
        const tr = state.tr.replaceWith(
          from,
          to,
          state.schema.text(text)
        );

        dispatch(tr);
      });
      return true;
    } catch (error) {
      console.error('Failed to replace text:', error);
      return false;
    }
  }

  /**
   * Insert text at cursor using Core Milkdown API
   */
  insertAtCursor(text: string): boolean {
    if (!this.editor) {
      console.error('Editor not available');
      return false;
    }

    try {
      this.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        if (!view) {
          throw new Error('Editor view not available');
        }

        const { state, dispatch } = view;
        const { from } = state.selection;

        // Create transaction to insert text
        const tr = state.tr.insert(from, state.schema.text(text));

        dispatch(tr);
      });
      return true;
    } catch (error) {
      console.error('Failed to insert text:', error);
      return false;
    }
  }

  /**
   * Check if editor is ready
   * Checks if the editor instance is available
   */
  isReady(): boolean {
    return this.editor !== null && this.editor !== undefined;
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
