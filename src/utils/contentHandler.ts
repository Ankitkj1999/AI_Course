// Enhanced content detection and parsing utility

/**
 * Safely parse JSON content that might be double-encoded or escaped
 */
export const safeJsonParse = (content: string): unknown => {
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
  parsedJson?: Record<string, unknown> | unknown[];
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
        parsedJson: parsed as Record<string, unknown> | unknown[]
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
export const extractNestedContent = (content: unknown): string => {
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
    return "\n```" + (lang || '') + "\n";
  }).replace(/\n```/g, '\n```\n');
};
