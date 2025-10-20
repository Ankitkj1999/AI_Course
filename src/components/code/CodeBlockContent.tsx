import {
    transformerNotationDiff,
    transformerNotationErrorLevel,
    transformerNotationFocus,
    transformerNotationHighlight,
    transformerNotationWordHighlight,
  } from '@shikijs/transformers';
  import { useLayoutEffect, useState, type HTMLAttributes } from 'react';
  import { type BundledLanguage, codeToHtml } from 'shiki';
  import { cn } from '../../lib/utils';
  
  export type { BundledLanguage } from 'shiki';
  
  interface CodeBlockContentProps extends HTMLAttributes<HTMLDivElement> {
    children: string;
    language: BundledLanguage;
  }
  
  export function CodeBlockContent({
    children,
    language,
    className,
    ...rest
  }: CodeBlockContentProps) {
    const [html, setHtml] = useState('');
    const [error, setError] = useState<string | null>(null);
  
    useLayoutEffect(() => {
      (async () => {
        try {
          const highlighter = await codeToHtml(children, {
            lang: language,
            theme: 'dark-plus',
            transformers: [
              transformerNotationDiff(),
              transformerNotationHighlight(),
              transformerNotationWordHighlight(),
              transformerNotationFocus(),
              transformerNotationErrorLevel(),
            ],
          });
  
          setHtml(highlighter);
          setError(null);
        } catch (err) {
          console.error('Shiki highlighting error:', err);
          setError('Failed to highlight code');
          // Fallback to plain text
          setHtml(`<pre><code>${escapeHtml(children)}</code></pre>`);
        }
      })();
    }, [children, language]);

    // Escape HTML to prevent XSS in fallback
    const escapeHtml = (unsafe: string): string => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };
  
    if (error) {
      return (
        <div
          className={cn(
            'overflow-x-auto bg-[#1e1e1e] p-4 text-sm text-red-400',
            className
          )}
          {...rest}
        >
          <p className="text-xs mb-2">Error: {error}</p>
          <pre className="text-gray-300 whitespace-pre-wrap font-mono">
            {children}
          </pre>
        </div>
      );
    }

    if (!html) {
      return (
        <div
          className={cn(
            'overflow-x-auto bg-[#1e1e1e] p-4 text-sm',
            className
          )}
          {...rest}
        >
          <div className="animate-pulse">
            <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-2/3"></div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          'overflow-x-auto bg-[#1e1e1e] p-4 text-sm',
          className
        )}
        dangerouslySetInnerHTML={{ __html: html }}
        {...rest}
      />
    );
  }
  