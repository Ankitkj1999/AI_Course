// src/components/CodeBlock.tsx

import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from '@shikijs/transformers';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useLayoutEffect, useState, useCallback } from 'react';
import { type BundledLanguage, codeToHtml } from 'shiki';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language: BundledLanguage;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [html, setHtml] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Copy to clipboard logic
  const copyText = useCallback((text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, []);

  // Shiki highlighting effect
  useLayoutEffect(() => {
    (async () => {
      const highlightedHtml = await codeToHtml(code, {
        lang: language,
        theme: 'dark-plus', // Using a dark theme consistent with VS Code
        transformers: [
          transformerNotationDiff(),
          transformerNotationHighlight(),
          transformerNotationWordHighlight(),
          transformerNotationFocus(),
          transformerNotationErrorLevel(),
        ],
      });
      setHtml(highlightedHtml);
    })();
  }, [code, language]);

  return (
    <div className="not-prose code-block-container my-6 rounded-lg border bg-gray-900 text-sm dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-lg bg-gray-800 px-4 py-2">
        <span className="font-mono text-xs font-semibold text-gray-300">
          {language}
        </span>
        <button
          onClick={() => copyText(code)}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
        >
          {isCopied ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Content - This is the crucial part for responsiveness */}
      <div
        className="overflow-x-auto p-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
