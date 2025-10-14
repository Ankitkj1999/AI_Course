import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface StyledTextProps {
  text: string;
  contentType?: 'html' | 'markdown';
}

const StyledText: React.FC<StyledTextProps> = ({
  text,
  contentType = 'html' // Default to HTML for backward compatibility
}) => {
  // If it's markdown content, use ReactMarkdown with beautiful formatting
  if (contentType === 'markdown') {
    return (
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown
          components={{
            code(props: any) {
              const { node, inline, className, children, ...rest } = props;
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={tomorrow}
                  language={match[1]}
                  PreTag="div"
                  {...rest}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...rest}>
                  {children}
                </code>
              );
            },
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  }

  // Fallback to HTML for existing content (backward compatibility)
  return (
    <div
      className="prose prose-lg dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
};

export default StyledText;