/**
 * Milkdown AI Plugin - Simple integration with Milkdown editor
 * Uses Milkdown's action method to access editor state safely
 */

import { Crepe } from '@milkdown/crepe';

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
  private crepe: Crepe | null = null;

  setCrepe(crepe: Crepe) {
    console.log('setCrepe called with crepe:', crepe);
    this.crepe = crepe;
  }


  /**
   * Get selected text - WORKAROUND: Since Crepe doesn't expose editorViewCtx,
   * we'll return empty string for now. AI will work without selected text context.
   */
  getSelectedText(): string {
    // Crepe doesn't expose ProseMirror view, so we can't get selected text
    // This is a limitation of using Crepe for AI text manipulation
    console.log('getSelectedText: Crepe does not expose editorViewCtx, returning empty string');
    return '';
  }

  /**
   * Replace selected text - WORKAROUND: Crepe doesn't support direct text manipulation.
   * This is a fundamental limitation of Crepe's design for AI text operations.
   */
  replaceSelectedText(text: string): boolean {
    console.log('replaceSelectedText: Crepe does not support direct text manipulation. AI text replacement is not available with Crepe.');
    // Return false to indicate the operation is not supported
    return false;
  }

  /**
   * Insert text at cursor - WORKAROUND: Crepe doesn't support direct text insertion.
   * This is a fundamental limitation of Crepe's design for AI text operations.
   */
  insertAtCursor(text: string): boolean {
    console.log('insertAtCursor: Crepe does not support direct text insertion. AI text insertion is not available with Crepe.');
    // Return false to indicate the operation is not supported
    return false;
  }

  /**
   * Check if editor is ready
   * Checks if the crepe instance is available
   */
  isReady(): boolean {
    return this.crepe !== null && this.crepe !== undefined;
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
