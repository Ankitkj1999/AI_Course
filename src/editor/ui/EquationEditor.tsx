/**
 * Equation Editor
 * Inline editor for mathematical equations
 */

import type { JSX, Ref, RefObject } from 'react';

import { isHTMLElement } from 'lexical';
import { ChangeEvent, forwardRef } from 'react';

type BaseEquationEditorProps = {
  equation: string;
  inline: boolean;
  setEquation: (equation: string) => void;
};

function EquationEditor(
  { equation, setEquation, inline }: BaseEquationEditorProps,
  forwardedRef: Ref<HTMLInputElement | HTMLTextAreaElement>,
): JSX.Element {
  const onChange = (event: ChangeEvent) => {
    setEquation((event.target as HTMLInputElement).value);
  };

  return inline && isHTMLElement(forwardedRef) ? (
    <span className="equation-editor-input-background">
      <span className="equation-editor-dollar-sign">$</span>
      <input
        className="equation-editor-inline-editor"
        value={equation}
        onChange={onChange}
        autoFocus={true}
        ref={forwardedRef as RefObject<HTMLInputElement>}
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'monospace',
          fontSize: '14px',
          padding: '2px 4px',
        }}
      />
      <span className="equation-editor-dollar-sign">$</span>
    </span>
  ) : (
    <div className="equation-editor-input-background" style={{
      border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '8px',
      background: '#f9f9f9',
      fontFamily: 'monospace',
      fontSize: '14px',
    }}>
      <span className="equation-editor-dollar-sign">{'$$\n'}</span>
      <textarea
        className="equation-editor-block-editor"
        value={equation}
        onChange={onChange}
        ref={forwardedRef as RefObject<HTMLTextAreaElement>}
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'monospace',
          fontSize: '14px',
          resize: 'vertical',
          minHeight: '60px',
          width: '100%',
        }}
      />
      <span className="equation-editor-dollar-sign">{'\n$$'}</span>
    </div>
  );
}

export default forwardRef(EquationEditor);