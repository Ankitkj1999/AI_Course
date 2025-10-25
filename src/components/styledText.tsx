// Enhanced StyledText Component
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';
import { type BundledLanguage } from 'shiki';
import {
  prepareContentForRendering,
  sanitizeHtml
} from '@/utils/contentHandler';

interface StyledTextProps {
  text: string;
  contentType?: string; // Allow any string for contentType
  className?: string;
}

// Define the shape of our prepared content state
type PreparedContent = {
  type: 'codeblock' | 'html' | 'markdown' | 'json' | 'text';
  content: string;
  language?: BundledLanguage;
  code?: string;
  parsedJson?: any;
};


const StyledText: React.FC<StyledTextProps> = ({
  text,
  contentType,
  className = ''
}) => {
  const [preparedContent, setPreparedContent] = useState<PreparedContent | null>(null);

  useEffect(() => {
    if (text) {
      console.log('StyledText received:', { text: text.substring(0, 100), contentType });
      const prepared = prepareContentForRendering(text, contentType);
      console.log('StyledText prepared content:', prepared);
      setPreparedContent(prepared as PreparedContent);
    }
  }, [text, contentType]);

  if (!preparedContent) {
    return <div className={`animate-pulse ${className}`}>Loading content...</div>;
  }

  // Render based on the new, more specific content type
  switch (preparedContent.type) {
    case 'codeblock':
      // Render the dedicated CodeBlock component for extracted fenced code blocks
      return (
        <CodeBlock
          code={preparedContent.code!}
          language={preparedContent.language!}
        />
      );

    case 'html':
      return (
        <div
          className={`prose prose-lg dark:prose-invert ${className}`}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(preparedContent.content) }}
        />
      );

    case 'markdown':
    case 'text': // Treat 'text' as markdown to correctly render inline code
      return (
        <div className={`prose prose-lg dark:prose-invert max-w-none prose-code:bg-transparent prose-code:p-0 prose-code:before:content-none prose-code:after:content-none ${className}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // This renderer now correctly handles fenced code blocks *within* a larger markdown document
              code({ node, inline, className, children, ...props }: {
                node?: any;
                inline?: boolean;
                className?: string;
                children: React.ReactNode;
                [key: string]: any;
              }) {
                const codeContent = String(children);
                
                // Debug logging to understand what's happening
                console.log('Code element:', { inline, className, codeContent: codeContent.substring(0, 50) });
                
                // Check if this is truly inline code (no newlines, short content)
                const isReallyInline = inline || (!className && !codeContent.includes('\n') && codeContent.length < 100);
                
                if (isReallyInline) {
                  return (
                    <code
                      className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1 py-0.5 rounded text-sm font-mono"
                      style={{ display: 'inline' }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                // Only render as CodeBlock if it's a proper fenced code block with language
                const match = /language-(\w+)/.exec(className || '');
                if (match) {
                  const language = match[1] as BundledLanguage;
                  const code = codeContent.replace(/\n$/, '');
                  return <CodeBlock code={code} language={language} />;
                }

                // Fallback for code blocks without language - render as simple pre/code
                return (
                  <pre className="bg-muted p-3 rounded-md overflow-x-auto">
                    <code className="text-sm font-mono" {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
            }}
          >
            {preparedContent.content}
          </ReactMarkdown>
        </div>
      );

    case 'json':
      return (
        <div className={`space-y-4 ${className}`}>
          <CodeBlock
            code={preparedContent.content}
            language="json"
          />
        </div>
      );

    default:
      return (
        <div className={`prose prose-lg dark:prose-invert ${className}`}>
          <p className="whitespace-pre-wrap">{preparedContent.content}</p>
        </div>
      );
  }
};

export default StyledText;