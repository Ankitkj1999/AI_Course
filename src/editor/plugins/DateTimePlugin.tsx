/**
 * DateTime Plugin
 * Simple implementation for inserting date/time
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from 'lexical';
import { useEffect } from 'react';

export interface DateTimePayload {
  dateTime: Date;
}

export const INSERT_DATETIME_COMMAND: LexicalCommand<DateTimePayload> = createCommand();

export default function DateTimePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INSERT_DATETIME_COMMAND,
        (payload: DateTimePayload) => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection)) {
            return false;
          }

          const { dateTime } = payload;
          const dateString = dateTime.toLocaleDateString();
          selection.insertText(dateString);

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  return null;
}