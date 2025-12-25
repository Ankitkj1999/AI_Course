import showdown from 'showdown';

/**
 * Content Conversion Service
 * Handles conversion between Markdown, HTML, and Lexical JSON formats
 */
class ContentConverter {
    
    constructor() {
        // Initialize Showdown converter with options
        this.markdownConverter = new showdown.Converter({
            tables: true,
            strikethrough: true,
            tasklists: true,
            ghCodeBlocks: true,
            smoothLivePreview: true,
            simplifiedAutoLink: true,
            excludeTrailingPunctuationFromURLs: true,
            literalMidWordUnderscores: true,
            simpleLineBreaks: true
        });
    }
    
    /**
     * Convert Markdown to HTML
     */
    markdownToHtml(markdown) {
        if (!markdown || typeof markdown !== 'string') {
            return '';
        }
        
        try {
            return this.markdownConverter.makeHtml(markdown);
        } catch (error) {
            console.error('Error converting Markdown to HTML:', error);
            return markdown; // Fallback to original content
        }
    }
    
    /**
     * Convert HTML to Markdown
     */
    htmlToMarkdown(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }
        
        try {
            return this.markdownConverter.makeMarkdown(html);
        } catch (error) {
            console.error('Error converting HTML to Markdown:', error);
            return html; // Fallback to original content
        }
    }
    
    /**
     * Convert Lexical JSON to HTML
     */
    lexicalToHtml(lexicalState) {
        if (!lexicalState || typeof lexicalState !== 'object') {
            return '';
        }
        
        try {
            // This is a simplified conversion - in a real implementation,
            // you'd use Lexical's built-in serialization methods
            return this.convertLexicalNodeToHtml(lexicalState.root);
        } catch (error) {
            console.error('Error converting Lexical to HTML:', error);
            return JSON.stringify(lexicalState); // Fallback
        }
    }
    
    /**
     * Convert Lexical JSON to Markdown
     */
    lexicalToMarkdown(lexicalState) {
        if (!lexicalState || typeof lexicalState !== 'object') {
            return '';
        }
        
        try {
            const html = this.lexicalToHtml(lexicalState);
            return this.htmlToMarkdown(html);
        } catch (error) {
            console.error('Error converting Lexical to Markdown:', error);
            return JSON.stringify(lexicalState); // Fallback
        }
    }
    
    /**
     * Convert HTML to Lexical JSON (simplified)
     */
    htmlToLexical(html) {
        if (!html || typeof html !== 'string') {
            return this.createEmptyLexicalState();
        }
        
        try {
            // This is a simplified conversion - in a real implementation,
            // you'd use Lexical's HTML import functionality
            return this.convertHtmlToLexicalNode(html);
        } catch (error) {
            console.error('Error converting HTML to Lexical:', error);
            return this.createEmptyLexicalState();
        }
    }
    
    /**
     * Convert Markdown to Lexical JSON
     */
    markdownToLexical(markdown) {
        if (!markdown || typeof markdown !== 'string') {
            return this.createEmptyLexicalState();
        }
        
        try {
            const html = this.markdownToHtml(markdown);
            return this.htmlToLexical(html);
        } catch (error) {
            console.error('Error converting Markdown to Lexical:', error);
            return this.createEmptyLexicalState();
        }
    }
    
    /**
     * Helper: Convert Lexical node to HTML recursively
     */
    convertLexicalNodeToHtml(node) {
        if (!node || !node.children) {
            return '';
        }
        
        let html = '';
        
        for (const child of node.children) {
            switch (child.type) {
                case 'paragraph':
                    html += `<p>${this.convertLexicalNodeToHtml(child)}</p>`;
                    break;
                case 'heading':
                    const level = child.tag || 'h1';
                    html += `<${level}>${this.convertLexicalNodeToHtml(child)}</${level}>`;
                    break;
                case 'text':
                    let text = child.text || '';
                    if (child.format) {
                        if (child.format & 1) text = `<strong>${text}</strong>`; // Bold
                        if (child.format & 2) text = `<em>${text}</em>`; // Italic
                        if (child.format & 4) text = `<u>${text}</u>`; // Underline
                        if (child.format & 8) text = `<s>${text}</s>`; // Strikethrough
                        if (child.format & 16) text = `<code>${text}</code>`; // Code
                    }
                    html += text;
                    break;
                case 'linebreak':
                    html += '<br>';
                    break;
                case 'list':
                    const listTag = child.listType === 'number' ? 'ol' : 'ul';
                    html += `<${listTag}>${this.convertLexicalNodeToHtml(child)}</${listTag}>`;
                    break;
                case 'listitem':
                    html += `<li>${this.convertLexicalNodeToHtml(child)}</li>`;
                    break;
                case 'quote':
                    html += `<blockquote>${this.convertLexicalNodeToHtml(child)}</blockquote>`;
                    break;
                case 'code':
                    const language = child.language || '';
                    html += `<pre><code class="language-${language}">${child.text || ''}</code></pre>`;
                    break;
                default:
                    // For unknown types, try to process children
                    html += this.convertLexicalNodeToHtml(child);
            }
        }
        
        return html;
    }
    
    /**
     * Helper: Convert HTML to Lexical node (simplified)
     */
    convertHtmlToLexicalNode(html) {
        // This is a very simplified implementation
        // In a real application, you'd use a proper HTML parser
        const textContent = html.replace(/<[^>]*>/g, '');
        
        return {
            root: {
                children: [
                    {
                        type: 'paragraph',
                        children: [
                            {
                                type: 'text',
                                text: textContent,
                                format: 0
                            }
                        ]
                    }
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'root',
                version: 1
            }
        };
    }
    
    /**
     * Helper: Create empty Lexical state
     */
    createEmptyLexicalState() {
        return {
            root: {
                children: [],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'root',
                version: 1
            }
        };
    }
    
    /**
     * Calculate word count from text content
     */
    calculateWordCount(content, format = 'markdown') {
        let text = '';
        
        switch (format) {
            case 'markdown':
                text = content || '';
                break;
            case 'html':
                text = (content || '').replace(/<[^>]*>/g, '');
                break;
            case 'lexical':
                text = this.extractTextFromLexical(content);
                break;
            default:
                text = content || '';
        }
        
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    
    /**
     * Extract plain text from Lexical JSON
     */
    extractTextFromLexical(lexicalState) {
        if (!lexicalState || !lexicalState.root) {
            return '';
        }
        
        return this.extractTextFromLexicalNode(lexicalState.root);
    }
    
    /**
     * Helper: Extract text from Lexical node recursively
     */
    extractTextFromLexicalNode(node) {
        if (!node) return '';
        
        if (node.type === 'text') {
            return node.text || '';
        }
        
        if (node.children && Array.isArray(node.children)) {
            return node.children
                .map(child => this.extractTextFromLexicalNode(child))
                .join(' ');
        }
        
        return '';
    }
    
    /**
     * Calculate estimated read time (words per minute)
     */
    calculateReadTime(wordCount, wordsPerMinute = 200) {
        return Math.ceil(wordCount / wordsPerMinute);
    }
    
    /**
     * Convert content between any two formats
     */
    convertContent(content, fromFormat, toFormat) {
        if (fromFormat === toFormat) {
            return content;
        }
        
        const conversionMap = {
            'markdown-html': this.markdownToHtml.bind(this),
            'html-markdown': this.htmlToMarkdown.bind(this),
            'markdown-lexical': this.markdownToLexical.bind(this),
            'lexical-markdown': this.lexicalToMarkdown.bind(this),
            'html-lexical': this.htmlToLexical.bind(this),
            'lexical-html': this.lexicalToHtml.bind(this)
        };
        
        const conversionKey = `${fromFormat}-${toFormat}`;
        const converter = conversionMap[conversionKey];
        
        if (converter) {
            return converter(content);
        }
        
        throw new Error(`Conversion from ${fromFormat} to ${toFormat} not supported`);
    }
}

export default new ContentConverter();