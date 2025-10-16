// Enhanced content detection and parsing utility

/**
 * Safely parse JSON content that might be double-encoded or escaped
 */
export const safeJsonParse = (content: string): any => {
  if (!content) return null;
  
  try {
    // Try to parse once
    let parsed = JSON.parse(content);
    
    // If the result is still a string, try parsing again (double-encoded case)
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        // If second parse fails, return first parse result
        return parsed;
      }
    }
    
    return parsed;
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
};

/**
 * Enhanced content type detection
 */
export const detectContentType = (content: string): 'html' | 'markdown' | 'json' | 'text' => {
  if (!content) return 'html';
  
  // First, check if it's JSON
  try {
    const parsed = safeJsonParse(content);
    if (parsed && typeof parsed === 'object') {
      return 'json';
    }
  } catch {
    // Not JSON, continue with other checks
  }
  
  // Check for HTML tags (more comprehensive)
  const htmlTagPattern = /<\/?[a-z][\s\S]*>/i;
  const hasHtmlTags = htmlTagPattern.test(content);
  
  // Check for markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s+/m,           // Headers (# ## ###)
    /\*\*.*?\*\*/,           // Bold text
    /\*.*?\*/,               // Italic text
    /```[\s\S]*?```/,        // Code blocks
    /`.*?`/,                 // Inline code
    /^\s*[-*+]\s+/m,         // Lists
    /^\s*\d+\.\s+/m,         // Numbered lists
  ];
  
  const hasMarkdownPatterns = markdownPatterns.some(pattern => pattern.test(content));
  
  // If it has HTML tags and no clear markdown patterns, it's HTML
  if (hasHtmlTags && !hasMarkdownPatterns) {
    console.log('Detected HTML content');
    return 'html';
  }
  
  // If it has markdown patterns, it's markdown
  if (hasMarkdownPatterns) {
    console.log('Detected markdown content');
    return 'markdown';
  }
  
  // Default to text for plain content
  console.log('Detected plain text content');
  return 'text';
};

/**
 * Prepare content for rendering based on type
 */
export const prepareContentForRendering = (content: string, contentType?: string): {
  type: 'html' | 'markdown' | 'json' | 'text';
  content: string;
  parsedJson?: any;
} => {
  if (!content) {
    return { type: 'html', content: '' };
  }
  
  // Detect content type if not provided
  const detectedType = contentType || detectContentType(content);
  
  // Handle JSON content specially
  if (detectedType === 'json') {
    const parsed = safeJsonParse(content);
    if (parsed) {
      return {
        type: 'json',
        content: JSON.stringify(parsed, null, 2),
        parsedJson: parsed
      };
    }
  }
  
  return {
    type: detectedType as 'html' | 'markdown' | 'json' | 'text',
    content: content
  };
};

/**
 * Extract and format nested content structures
 */
export const extractNestedContent = (content: any): string => {
  if (typeof content === 'string') {
    return content;
  }
  
  if (typeof content === 'object' && content !== null) {
    // If it's a structured object, format it nicely
    return JSON.stringify(content, null, 2);
  }
  
  return String(content);
};

/**
 * Sanitize HTML content to prevent XSS
 */
export const sanitizeHtml = (html: string): string => {
  // Basic XSS prevention - you should use a library like DOMPurify in production
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '');
};

/**
 * Format code blocks for better readability
 */
export const formatCodeBlocks = (content: string): string => {
  // Ensure code blocks have proper spacing
  return content.replace(/```(\w+)?\n/g, (match, lang) => {
    return `\n\`\`\`${lang || ''}\n`;
  }).replace(/\n```/g, '\n```\n');
};


// Enhanced StyledText Component
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { 
  prepareContentForRendering, 
  sanitizeHtml, 
  formatCodeBlocks 
} from './contentHandler';

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
  const [preparedContent, setPreparedContent] = useState<{
    type: 'html' | 'markdown' | 'json' | 'text';
    content: string;
    parsedJson?: any;
  } | null>(null);

  useEffect(() => {
    if (text) {
      const prepared = prepareContentForRendering(text, providedType);
      setPreparedContent(prepared);
    }
  }, [text, providedType]);

  if (!preparedContent) {
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
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                
                return !inline && language ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    className="rounded-lg"
                    customStyle={{
                      margin: '1rem 0',
                      padding: '1rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code 
                    className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" 
                    {...props}
                  >
                    {children}
                  </code>
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
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1rem',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                maxHeight: '500px',
                overflow: 'auto',
              }}
            >
              {preparedContent.content}
            </SyntaxHighlighter>
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

// Key updates needed in your CoursePage component

// 1. Import the new utilities
import { detectContentType, prepareContentForRendering } from './utils/contentHandler';

// 2. Update the handleSelect function to better handle content
const handleSelect = (topics, sub) => {
  if (!isLoading) {
    const mTopic = jsonData[mainTopic.toLowerCase()].find(topic => topic.title === topics);
    const mSubTopic = mTopic?.subtopics.find(subtopic => subtopic.title === sub);

    if (mSubTopic.theory === '' || mSubTopic.theory === undefined || mSubTopic.theory === null) {
      if (type === 'video & text course') {
        const query = `${mSubTopic.title} ${mainTopic} in english`;
        setIsLoading(true);
        sendVideo(query, topics, sub, mSubTopic.title);
      } else {
        const prompt = `Strictly in ${lang}, Explain me about this subtopic of ${mainTopic} with examples :- ${mSubTopic.title}. Please Strictly Don't Give Additional Resources And Images.`;
        const promptImage = `Example of ${mSubTopic.title} in ${mainTopic}`;
        setIsLoading(true);
        sendPrompt(prompt, promptImage, topics, sub);
      }
    } else {
      setSelected(mSubTopic.title);
      
      // Prepare content properly before setting
      const prepared = prepareContentForRendering(
        mSubTopic.theory, 
        mSubTopic.contentType
      );
      
      setTheory(prepared.content);
      setContentType(prepared.type);
      
      if (type === 'video & text course') {
        setMedia(mSubTopic.youtube);
      } else {
        setMedia(mSubTopic.image);
      }
    }
  }
};

// 3. Update sendData to store content type properly
async function sendData(image, theory, topics, sub, contentType = 'html') {
  const mTopic = jsonData[mainTopic.toLowerCase()].find(topic => topic.title === topics);
  const mSubTopic = mTopic?.subtopics.find(subtopic => subtopic.title === sub);
  
  // Prepare the content before storing
  const prepared = prepareContentForRendering(theory, contentType);
  
  mSubTopic.theory = prepared.content;
  mSubTopic.contentType = prepared.type;
  mSubTopic.image = image;
  
  setSelected(mSubTopic.title);
  setIsLoading(false);
  setTheory(prepared.content);
  setContentType(prepared.type);
  
  if (type === 'video & text course') {
    setMedia(mSubTopic.youtube);
  } else {
    setMedia(image);
  }
  
  mSubTopic.done = true;
  updateCourse();
}

// 4. Update sendDataVideo similarly
async function sendDataVideo(image, theory, topics, sub, contentType = 'html') {
  const mTopic = jsonData[mainTopic.toLowerCase()].find(topic => topic.title === topics);
  const mSubTopic = mTopic?.subtopics.find(subtopic => subtopic.title === sub);
  
  // Prepare the content before storing
  const prepared = prepareContentForRendering(theory, contentType);
  
  mSubTopic.theory = prepared.content;
  mSubTopic.contentType = prepared.type;
  mSubTopic.youtube = image;
  
  setSelected(mSubTopic.title);
  setIsLoading(false);
  setTheory(prepared.content);
  setContentType(prepared.type);
  
  if (type === 'video & text course') {
    setMedia(image);
  } else {
    setMedia(mSubTopic.image);
  }
  
  mSubTopic.done = true;
  updateCourse();
}

// 5. Update the initial useEffect
useEffect(() => {
  loadMessages();
  getNotes();
  
  // Ensure the page starts at the top when loaded
  if (mainContentRef.current) {
    mainContentRef.current.scrollTop = 0;
  }
  window.scrollTo(0, 0);

  const CountDoneTopics = () => {
    let doneCount = 0;
    let totalTopics = 0;

    jsonData[mainTopic.toLowerCase()].forEach((topic) => {
      topic.subtopics.forEach((subtopic) => {
        if (subtopic.done) {
          doneCount++;
        }
        totalTopics++;
      });
    });
    
    totalTopics = totalTopics + 1;
    if (pass) {
      doneCount = doneCount + 1;
    }
    
    const completionPercentage = Math.round((doneCount / totalTopics) * 100);
    setPercentage(completionPercentage);
    if (completionPercentage >= 100) {
      setIsCompleted(true);
    }
  };

  if (!mainTopic) {
    navigate("/create");
  } else {
    if (percentage >= 100) {
      setIsCompleted(true);
    }

    const mainTopicData = jsonData[mainTopic.toLowerCase()][0];
    const firstSubtopic = mainTopicData.subtopics[0];
    firstSubtopic.done = true;
    
    setSelected(firstSubtopic.title);
    
    // Properly prepare content
    const prepared = prepareContentForRendering(
      firstSubtopic.theory,
      firstSubtopic.contentType
    );
    
    setTheory(prepared.content);
    setContentType(prepared.type);

    if (type === 'video & text course') {
      setMedia(firstSubtopic.youtube);
    } else {
      setMedia(firstSubtopic.image);
    }
    
    setIsLoading(false);
    sessionStorage.setItem('jsonData', JSON.stringify(jsonData));
    CountDoneTopics();
  }
}, []);

// 6. In the JSX, render the content properly
<div className="space-y-4">
  {type === 'video & text course' ? (
    <div>
      <YouTube 
        key={media} 
        className='mb-5' 
        videoId={media} 
        opts={isMobile ? optsMobile : opts} 
      />
    </div>
  ) : (
    <div>
      <img 
        className='w-full h-auto rounded-md' 
        src={media} 
        alt="Media" 
      />
    </div>
  )}
  <StyledText 
    text={theory} 
    contentType={contentType} 
    className="mt-6"
  />
</div>


# Content Rendering Fix - Installation Guide

## Required Dependencies

Install these packages to properly handle markdown and code syntax highlighting:

```bash
npm install react-markdown remark-gfm react-syntax-highlighter
npm install --save-dev @types/react-syntax-highlighter
```

## File Structure

Create the following files in your project:

```
src/
├── utils/
│   └── contentHandler.ts         # Content detection and parsing utilities
├── components/
│   └── styledText.tsx            # Enhanced StyledText component
└── pages/
    └── CoursePage.tsx            # Your existing course page (with updates)
```

## Implementation Steps

### Step 1: Create the Content Handler Utility

Create `src/utils/contentHandler.ts` with the content from the first artifact.

### Step 2: Update/Create StyledText Component

Replace or update your existing `styledText.tsx` with the enhanced version from the second artifact.

### Step 3: Update CoursePage Component

Apply the changes from the third artifact to your existing `CoursePage.tsx`.

Key changes:
- Import the new utilities
- Update `handleSelect` function
- Update `sendData` and `sendDataVideo` functions
- Update the initial `useEffect`
- Ensure proper content preparation before rendering

### Step 4: Backend Updates (Important!)

Update your backend API responses to include content type:

```typescript
// In your /api/generate endpoint
{
  text: generatedContent,
  contentType: 'markdown' // or 'html', 'json', 'text'
}
```

## Key Features

✅ **Automatic Content Detection**: Detects HTML, Markdown, JSON, or plain text
✅ **JSON Handling**: Properly parses and displays nested JSON structures
✅ **Code Syntax Highlighting**: Beautiful code blocks with syntax highlighting
✅ **Responsive**: Works on mobile and desktop
✅ **XSS Protection**: Sanitizes HTML to prevent security issues
✅ **Type-Safe**: Full TypeScript support

## Content Type Handling

The system now handles:

1. **HTML Content**: Sanitized and rendered with dangerouslySetInnerHTML
2. **Markdown Content**: Parsed with ReactMarkdown + code highlighting
3. **JSON Content**: Displayed as formatted code + structured view
4. **Plain Text**: Rendered with proper whitespace preservation

## Troubleshooting

### Issue: Code blocks not highlighting
**Solution**: Ensure `react-syntax-highlighter` is properly installed and imported

### Issue: Content still not rendering
**Solution**: Check browser console for errors. Verify content is properly stored in `jsonData`

### Issue: JSON content shows as string
**Solution**: The system now auto-detects and parses double-encoded JSON strings

### Issue: Styles not applying
**Solution**: Ensure Tailwind CSS is configured to process prose classes:

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

## Example Usage

```typescript
// Rendering different content types
<StyledText 
  text={htmlContent} 
  contentType="html" 
/>

<StyledText 
  text={markdownContent} 
  contentType="markdown" 
/>

<StyledText 
  text={jsonString} 
  contentType="json" 
/>

// Auto-detect content type
<StyledText 
  text={unknownContent} 
/>
```

## Testing

Test with different content types:

```typescript
// Test HTML
const htmlTest = '<h1>Hello</h1><p>World</p>';

// Test Markdown
const mdTest = '# Hello\n\n```javascript\nconsole.log("test");\n```';

// Test JSON
const jsonTest = JSON.stringify({
  title: "Test",
  subtopics: [{ title: "Sub1" }]
});
```

## Performance Considerations

- Content is prepared once when loading
- Memoization prevents unnecessary re-renders
- Large JSON structures are handled efficiently
- Code highlighting uses optimized syntax highlighter

## Security Notes

- All HTML is sanitized before rendering
- External links open in new tabs with `noopener noreferrer`
- JSON parsing has error handling to prevent crashes
- XSS protection is built-in

## Next Steps

After implementation:

1. Test with your existing course content
2. Verify all content types render correctly
3. Check mobile responsiveness
4. Test with complex nested JSON structures
5. Validate code block highlighting works

## Support

If you encounter issues:

1. Check that all dependencies are installed
2. Verify file paths match your project structure
3. Ensure TypeScript types are properly configured
4. Check console for specific error messages