// Enhanced content detection and parsing utility

/**
 * Preprocess content to handle escaped characters from JSON storage
 */
export const preprocessEscapedContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return content;
  }
  // This function handles escaped characters like \n, \", etc.
  try {
    return JSON.parse(`"${content}"`);
  } catch {
    let processed = content.replace(/\\n/g, '\n');
    processed = processed.replace(/\\"/g, '"');
    processed = processed.replace(/'/g, "'");
    processed = processed.replace(/\\\\/g, '\\');
    processed = processed.replace(/\\t/g, '\t');
    processed = processed.replace(/\\r/g, '\r');
    return processed;
  }
};

/**
 * New function to specifically extract a fenced code block if it's the ONLY content.
 */
const extractFencedCodeBlock = (content: string): { language: string; code: string } | null => {
  const match = content.trim().match(/^```(\w+)?\s*\n([\s\S]+)```$/);
  if (match) {
    const language = match[1] || 'plaintext';
    const code = match[2].trim();
    return { language, code };
  }
  return null;
};

/**
 * Safely parse JSON content.
 */
export const safeJsonParse = (content: string): unknown => {
  if (!content) return null;
  const trimmed = content.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return null;
  }
  try {
    return JSON.parse(content);
  } catch (error) {
    console.warn('Failed to parse JSON-like content:', error);
    return null;
  }
};

/**
 * Detects content type, now correctly ignoring inline code for markdown detection.
 */
export const detectContentType = (content: string): 'html' | 'markdown' | 'json' | 'text' => {
  if (!content) return 'text';

  if (safeJsonParse(content)) return 'json';
  
  // Enhanced HTML detection for TipTap editor output
  const htmlTagPatterns = [
    /<\/?[a-z][a-z0-9]*[^<>]*>/i,  // Standard HTML tags
    /<p[^>]*>/i,                    // Paragraph tags (common in TipTap)
    /<div[^>]*>/i,                  // Div tags
    /<h[1-6][^>]*>/i,              // Heading tags
    /<strong[^>]*>/i,              // Strong tags
    /<em[^>]*>/i,                  // Emphasis tags
    /<ul[^>]*>/i,                  // Unordered list
    /<ol[^>]*>/i,                  // Ordered list
    /<li[^>]*>/i,                  // List items
    /<br\s*\/?>/i,                 // Line breaks
    /<a[^>]*>/i,                   // Links
  ];
  
  const hasHtmlTags = htmlTagPatterns.some(pattern => pattern.test(content));

  // If we detect HTML tags, prioritize HTML over markdown
  if (hasHtmlTags) {
    return 'html';
  }

  // Check for markdown patterns only if no HTML detected
  const markdownPatterns = [
    { pattern: /^#{1,6}\s+/m, name: 'Header' },
    { pattern: /\*\*.*?\*\*|\*.*?\*/, name: 'Bold/Italic' },
    { pattern: /```[\s\S]*?```/, name: 'Code Block' },
    { pattern: /^\s*[-*+]\s+/m, name: 'List' },
    { pattern: /^\s*\d+\.\s+/m, name: 'Numbered List' },
  ];
  
  for (const { pattern } of markdownPatterns) {
    if (pattern.test(content)) {
      return 'markdown';
    }
  }
  
  return 'text';
};


/**
 * Main function to prepare content for rendering, now with dedicated code block extraction.
 */
export const prepareContentForRendering = (content: string, contentType?: string): {
  type: 'codeblock' | 'html' | 'markdown' | 'json' | 'text';
  content: string;
  language?: string;
  code?: string;
  parsedJson?: unknown;
} => {
  if (!content) {
    return { type: 'text', content: '' };
  }

  const preprocessedContent = preprocessEscapedContent(content);

  const codeBlock = extractFencedCodeBlock(preprocessedContent);
  if (codeBlock) {
    return {
      type: 'codeblock',
      content: '',
      language: codeBlock.language,
      code: codeBlock.code,
    };
  }

  // If contentType is explicitly provided, use it; otherwise detect it
  const detectedType = contentType || detectContentType(preprocessedContent);

  if (detectedType === 'json') {
    const parsed = safeJsonParse(preprocessedContent);
    if (parsed) {
      return {
        type: 'json',
        content: JSON.stringify(parsed, null, 2),
        parsedJson: parsed,
      };
    }
  }

  return {
    type: detectedType as 'html' | 'markdown' | 'text',
    content: preprocessedContent,
  };
};

/**
 * Sanitize HTML content to prevent XSS while allowing safe TipTap editor tags.
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  // Remove dangerous tags and attributes
  const sanitized = html
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove object and embed tags
    .replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: links
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  
  return sanitized;
};

/**
 * This function is no longer needed as the logic is handled by the markdown renderer.
 */
export const formatCodeBlocks = (content: string): string => {
  return content;
};