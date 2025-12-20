/**
 * Speech to Text Plugin Constants
 * Separated to avoid fast refresh warnings
 */

import type { LexicalCommand, LexicalEditor, RangeSelection } from 'lexical';
import { createCommand, REDO_COMMAND, UNDO_COMMAND } from 'lexical';

export const SPEECH_TO_TEXT_COMMAND: LexicalCommand<boolean> = createCommand(
  'SPEECH_TO_TEXT_COMMAND',
);

// Voice commands that can be recognized
export const VOICE_COMMANDS: Readonly<
  Record<
    string,
    (arg0: { editor: LexicalEditor; selection: RangeSelection }) => void
  >
> = {
  '\n': ({ selection }) => {
    selection.insertParagraph();
  },
  'new line': ({ selection }) => {
    selection.insertParagraph();
  },
  'new paragraph': ({ selection }) => {
    selection.insertParagraph();
  },
  redo: ({ editor }) => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  },
  undo: ({ editor }) => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  },
};

// Check if browser supports speech recognition
export const SUPPORT_SPEECH_RECOGNITION: boolean =
  'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;