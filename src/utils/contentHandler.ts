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
    processed = processed.replace(/\'/g, "'");
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
  
  const htmlTagPattern = /<\/?\[a-z][\s\S]*>/i;
  const hasHtmlTags = htmlTagPattern.test(content);

  // Check for markdown patterns
  const markdownPatterns = [
    { pattern: /^#{1,6}\s+/m, name: 'Header' },
    { pattern: /\*\*.*?\*\*|\*.*?\*/, name: 'Bold/Italic' },
    { pattern: /```[\s\S]*?```/, name: 'Code Block' },
    { pattern: /^\s*[-*+]\s+/m, name: 'List' },
    { pattern: /^\s*\d+\.\s+/m, name: 'Numbered List' },
  ];
  
  for (const { pattern, name } of markdownPatterns) {
    if (pattern.test(content)) {
      console.log(`Detected markdown content due to pattern: ${name}`);
      return 'markdown';
    }
  }
  
  if (hasHtmlTags) {
    console.log('Detected HTML content');
    return 'html';
  }
  
  console.log('Detected plain text content');
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
  parsedJson?: any;
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
 * Sanitize HTML content to prevent XSS.
 */
export const sanitizeHtml = (html: string): string => {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

/**
 * This function is no longer needed as the logic is handled by the markdown renderer.
 */
export const formatCodeBlocks = (content: string): string => {
  return content;
};