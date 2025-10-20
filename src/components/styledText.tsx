// Enhanced StyledText Component
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './code';
import { type BundledLanguage } from './code/CodeBlockContent';
import { 
  prepareContentForRendering, 
  sanitizeHtml, 
  formatCodeBlocks 
} from '@/utils/contentHandler';

interface StyledTextProps {
  text: string;
  contentType?: 'html' | 'markdown' | 'json' | 'text';
  className?: string;
}

const StyledText: React.FC<StyledTextProps> = ({
  text, 
  contentType: providedType,
  className = '' 
}) => {
  const [preparedContent, setPreparedContent] = useState({
    type: 'html' as 'html' | 'markdown' | 'json' | 'text',
    content: '',
    parsedJson: undefined as any | undefined
  });

  useEffect(() => {
    if (text) {
      const prepared = prepareContentForRendering(text, providedType);
      setPreparedContent(prepared);
    }
  }, [text, providedType]);

  if (!preparedContent || !preparedContent.content) {
    return <div className={`animate-pulse ${className}`}>Loading content...</div>;
  }

  // Render based on content type
  switch (preparedContent.type) {
    case 'html':
      return (
        <div 
          className={`prose prose-lg dark:prose-invert max-w-none 
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
            prose-p:text-base prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-muted prose-pre:border prose-pre:border-border
            prose-pre:rounded-lg prose-pre:p-4
            prose-img:rounded-lg prose-img:shadow-md
            prose-ul:list-disc prose-ol:list-decimal
            prose-li:marker:text-primary
            ${className}`}
          dangerouslySetInnerHTML={{ 
            __html: sanitizeHtml(preparedContent.content) 
          }}
        />
      );

    case 'markdown':
      const formattedMarkdown = formatCodeBlocks(preparedContent.content);
      return (
        <div className={`prose prose-lg dark:prose-invert max-w-none ${className}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, className, children, ...props }: any) {
                // Check if this is inline code (no language class and single line)
                const inline = !className && !String(children).includes('\n');
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : 'plaintext';
                const code = String(children).replace(/\n$/, '');

                if (inline) {
                  return (
                    <code 
                      className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" 
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                return (
                  <CodeBlock
                    code={code}
                    language={language as BundledLanguage}
                  />
                );
              },
              pre({ children }) {
                return <>{children}</>;
              },
              h1({ children }) {
                return <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>;
              },
              h3({ children }) {
                return <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>;
              },
              p({ children }) {
                return <p className="text-base leading-relaxed my-4">{children}</p>;
              },
              a({ href, children }) {
                return (
                  <a 
                    href={href}
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                );
              },
              ul({ children }) {
                return <ul className="list-disc pl-6 my-4 space-y-2">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal pl-6 my-4 space-y-2">{children}</ol>;
              },
              li({ children }) {
                return <li className="leading-relaxed">{children}</li>;
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                    {children}
                  </blockquote>
                );
              },
              img({ src, alt }) {
                return (
                  <img 
                    src={src} 
                    alt={alt || ''}
                    className="rounded-lg shadow-md my-4 max-w-full h-auto"
                  />
                );
              },
            }}
          >
            {formattedMarkdown}
          </ReactMarkdown>
        </div>
      );

    case 'json':
      return (
        <div className={`space-y-4 ${className}`}>
          <div className="bg-muted border border-border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Structured Content</h3>
            <CodeBlock
              code={preparedContent.content}
              language="json"
            />
          </div>
          
          {/* Render parsed JSON in a user-friendly way if it has a specific structure */}
          {preparedContent.parsedJson && (
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {renderJsonContent(preparedContent.parsedJson)}
            </div>
          )}
        </div>
      );

    case 'text':
    default:
      return (
        <div className={`prose prose-lg dark:prose-invert max-w-none ${className}`}>
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {preparedContent.content}
          </p>
        </div>
      );
  }
};

/**
 * Helper function to render JSON content in a structured way
 */
const renderJsonContent = (json: any): React.ReactNode => {
  if (!json || typeof json !== 'object') {
    return null;
  }

  // Check if it's an array of topics (like your course structure)
  if (Array.isArray(json)) {
    return (
      <div className="space-y-6">
        {json.map((item, index) => (
          <div key={index}>
            {renderJsonObject(item)}
          </div>
        ))}
      </div>
    );
  }

  // Handle object with topic structure
  return renderJsonObject(json);
};

const renderJsonObject = (obj: any): React.ReactNode => {
  if (!obj || typeof obj !== 'object') {
    return <span className="text-muted-foreground">{String(obj)}</span>;
  }

  // Special handling for course topic structure
  if (obj.title && obj.subtopics) {
    return (
      <div className="border border-border rounded-lg p-4 space-y-3">
        <h4 className="text-lg font-semibold">{obj.title}</h4>
        {obj.subtopics && Array.isArray(obj.subtopics) && (
          <div className="space-y-2 pl-4">
            {obj.subtopics.map((subtopic: any, idx: number) => (
              <div key={idx} className="border-l-2 border-primary/30 pl-3">
                <p className="font-medium">{subtopic.title}</p>
                {subtopic.theory && (
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    {subtopic.theory.substring(0, 150)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Generic object rendering
  return (
    <div className="space-y-2">
      {Object.entries(obj).map(([key, value], index) => (
        <div key={index}>
          <span className="font-semibold">{key}: </span>
          {typeof value === 'object' ? (
            <div className="pl-4">{renderJsonObject(value)}</div>
          ) : (
            <span>{String(value)}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default StyledText;