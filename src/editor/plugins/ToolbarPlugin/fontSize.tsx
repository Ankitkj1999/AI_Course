/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import './fontSize.css';

import {LexicalEditor} from 'lexical';
import * as React from 'react';

import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
} from 'lexical';
import {
  $patchStyleText,
} from '@lexical/selection';

const MIN_ALLOWED_FONT_SIZE = 8;
const MAX_ALLOWED_FONT_SIZE = 72;

function parseFontSize(input: string): [number, string] | null {
  const match = input.match(/^(\d+(?:\.\d+)?)(px|pt)$/);
  return match ? [Number(match[1]), match[2]] : null;
}

function normalizeToPx(fontSize: number, unit: string): number {
  return unit === 'pt' ? Math.round((fontSize * 4) / 3) : fontSize;
}

function isValidFontSize(fontSizePx: number): boolean {
  return (
    fontSizePx >= MIN_ALLOWED_FONT_SIZE && fontSizePx <= MAX_ALLOWED_FONT_SIZE
  );
}

export function parseFontSizeForToolbar(input: string): string {
  const parsed = parseFontSize(input);
  if (!parsed) {
    return '';
  }

  const [fontSize, unit] = parsed;
  const fontSizePx = normalizeToPx(fontSize, unit);
  return `${fontSizePx}px`;
}

export function parseAllowedFontSize(input: string): string {
  const parsed = parseFontSize(input);
  if (!parsed) {
    return '';
  }

  const [fontSize, unit] = parsed;
  const fontSizePx = normalizeToPx(fontSize, unit);
  return isValidFontSize(fontSizePx) ? input : '';
}

export function updateFontSizeInSelection(
  editor: LexicalEditor,
  fontSize: string,
) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $patchStyleText(selection, {
        'font-size': fontSize,
      });
    }
  });
}

export function decreaseFontSize(editor: LexicalEditor, currentSize: string) {
  const parsed = parseFontSize(currentSize);
  if (!parsed) return;
  
  const [fontSize, unit] = parsed;
  const fontSizePx = normalizeToPx(fontSize, unit);
  const newSize = Math.max(MIN_ALLOWED_FONT_SIZE, fontSizePx - 1);
  
  updateFontSizeInSelection(editor, `${newSize}px`);
}

export function increaseFontSize(editor: LexicalEditor, currentSize: string) {
  const parsed = parseFontSize(currentSize);
  if (!parsed) return;
  
  const [fontSize, unit] = parsed;
  const fontSizePx = normalizeToPx(fontSize, unit);
  const newSize = Math.min(MAX_ALLOWED_FONT_SIZE, fontSizePx + 1);
  
  updateFontSizeInSelection(editor, `${newSize}px`);
}

export default function FontSize({
  selectionFontSize,
  disabled,
  editor,
}: {
  selectionFontSize: string;
  disabled: boolean;
  editor: LexicalEditor;
}) {
  const [inputValue, setInputValue] = React.useState<string>(
    selectionFontSize ? parseFontSizeForToolbar(selectionFontSize).slice(0, -2) : '15'
  );
  const [isMouseMode, setIsMouseMode] = React.useState(false);

  React.useEffect(() => {
    if (selectionFontSize) {
      setInputValue(parseFontSizeForToolbar(selectionFontSize).slice(0, -2));
    }
  }, [selectionFontSize]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setInputValue(value);
    }
  };

  const handleInputBlur = () => {
    setIsMouseMode(false);
    const numValue = parseInt(inputValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(MIN_ALLOWED_FONT_SIZE, Math.min(MAX_ALLOWED_FONT_SIZE, numValue));
      setInputValue(String(clampedValue));
      updateFontSizeInSelection(editor, `${clampedValue}px`);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      handleInputBlur();
    }
  };

  const handleDecrease = () => {
    decreaseFontSize(editor, inputValue + 'px');
    const newValue = Math.max(MIN_ALLOWED_FONT_SIZE, parseInt(inputValue) - 1);
    setInputValue(String(newValue));
  };

  const handleIncrease = () => {
    increaseFontSize(editor, inputValue + 'px');
    const newValue = Math.min(MAX_ALLOWED_FONT_SIZE, parseInt(inputValue) + 1);
    setInputValue(String(newValue));
  };

  const currentSize = parseInt(inputValue) || 15;

  return (
    <>
      <button
        type="button"
        disabled={disabled || currentSize <= MIN_ALLOWED_FONT_SIZE}
        onClick={handleDecrease}
        className="toolbar-item font-decrement"
        aria-label="Decrease font size"
        title="Decrease font size">
        <i className="format minus-icon" />
      </button>

      <input
        type="number"
        title="Font size"
        value={inputValue}
        disabled={disabled}
        className="toolbar-item font-size-input"
        min={MIN_ALLOWED_FONT_SIZE}
        max={MAX_ALLOWED_FONT_SIZE}
        onChange={handleInputChange}
        onClick={() => setIsMouseMode(true)}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
      />

      <button
        type="button"
        disabled={disabled || currentSize >= MAX_ALLOWED_FONT_SIZE}
        onClick={handleIncrease}
        className="toolbar-item font-increment"
        aria-label="Increase font size"
        title="Increase font size">
        <i className="format add-icon" />
      </button>
    </>
  );
}
