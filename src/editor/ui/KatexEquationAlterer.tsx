/**
 * KaTeX Equation Alterer
 * Dialog for inserting and editing mathematical equations
 */

import type { JSX } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import * as React from 'react';
import { useCallback, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import KatexRenderer from './KatexRenderer';

type Props = {
  initialEquation?: string;
  onConfirm: (equation: string, inline: boolean) => void;
};

export default function KatexEquationAlterer({
  onConfirm,
  initialEquation = '',
}: Props): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [equation, setEquation] = useState<string>(initialEquation);
  const [inline, setInline] = useState<boolean>(true);

  const onClick = useCallback(() => {
    onConfirm(equation, inline);
  }, [onConfirm, equation, inline]);

  const onCheckboxChange = useCallback(() => {
    setInline(!inline);
  }, [setInline, inline]);

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label>
          <input type="checkbox" checked={inline} onChange={onCheckboxChange} />
          Inline
        </label>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Equation
        </label>
        {inline ? (
          <input
            onChange={(event) => {
              setEquation(event.target.value);
            }}
            value={equation}
            placeholder="Enter LaTeX equation (e.g., x^2 + y^2 = z^2)"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '14px',
            }}
          />
        ) : (
          <textarea
            onChange={(event) => {
              setEquation(event.target.value);
            }}
            value={equation}
            placeholder="Enter LaTeX equation (e.g., \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi})"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '14px',
              minHeight: '80px',
              resize: 'vertical',
            }}
          />
        )}
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Preview
        </label>
        <div style={{
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          padding: '16px',
          minHeight: '60px',
          background: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ErrorBoundary onError={(e) => console.error(e)} fallback={
            <div style={{ color: '#cc0000', fontStyle: 'italic' }}>
              Invalid equation syntax
            </div>
          }>
            {equation ? (
              <KatexRenderer
                equation={equation}
                inline={false}
                onDoubleClick={() => null}
              />
            ) : (
              <div style={{ color: '#999', fontStyle: 'italic' }}>
                Enter an equation to see preview
              </div>
            )}
          </ErrorBoundary>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          onClick={onClick}
          disabled={!equation.trim()}
          style={{
            padding: '8px 16px',
            background: equation.trim() ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: equation.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
          }}
        >
          Insert Equation
        </button>
      </div>
    </div>
  );
}