# Code Block Enhancement Design

## Overview

This design document outlines the implementation approach for enhancing code block rendering in the AiCourse application. The solution will replace the current basic text rendering with a professional, VS Code-quality syntax highlighting system using Shiki, while maintaining backward compatibility and ensuring optimal performance.

## Architecture

### High-Level Architecture

```
AI Content Generation → JSON Storage → Content Preprocessing → Markdown Processing → Enhanced Code Block Rendering → User Interface
```

### Component Hierarchy

```
StyledText (existing)
├── ReactMarkdown (existing)
│   └── Custom Components Override
│       └── CodeBlock (new)
│           ├── CodeBlockHeader (new)
│           │   ├── Language Badge
│           │   └── Copy Button
│           └── CodeBlockContent (new)
│               └── Shiki Highlighted HTML
```

## Components and Interfaces

### 0. Content Preprocessing Utility

**Purpose:** Processes JSON-stored content to handle escaped characters before markdown parsing.

**Function Interface:**
```typescript
interface ContentProcessor {
  processEscapedContent(content: string): string;
  normalizeNewlines(content: string): string;
  validateMarkdownStructure(content: string): boolean;
}
```

**Responsibilities:**
- Convert escaped newlines (\\n) to actual newlines
- Handle escaped quotes and backslashes in code blocks
- Normalize content for consistent markdown parsing
- Preserve code block structure and language identifiers

### 1. CodeBlock Component

**Purpose:** Main wrapper component that orchestrates the entire code block rendering.

**Props Interface:**
```typescript
interface CodeBlockProps {
  children: string;           // Raw code content
  className?: string;         // Language class from markdown (e.g., "language-javascript")
  inline?: boolean;          // Whether this is inline code or block code
}
```

**Responsibilities:**
- Extract language from className prop
- Coordinate between header and content components
- Handle error boundaries for syntax highlighting failures
- Manage loading states during highlighting

### 2. CodeBlockHeader Component

**Purpose:** Displays language information and provides copy functionality.

**Props Interface:**
```typescript
interface CodeBlockHeaderProps {
  language: string;           // Programming language name
  code: string;              // Raw code for copying
  onCopy?: (success: boolean) => void; // Copy callback
}
```

**Responsibilities:**
- Display formatted language name
- Render copy-to-clipboard button
- Handle copy operations with user feedback
- Provide accessibility features

### 3. CodeBlockContent Component

**Purpose:** Renders syntax-highlighted code using Shiki.

**Props Interface:**
```typescript
interface CodeBlockContentProps {
  code: string;              // Raw code content
  language: string;          // Programming language
  theme?: string;           // Shiki theme (default: 'dark-plus')
}
```

**Responsibilities:**
- Transform code using Shiki highlighter
- Handle unsupported languages gracefully
- Render highlighted HTML safely
- Manage syntax highlighting errors

## Data Models

### Language Configuration

```typescript
interface LanguageConfig {
  id: string;                // Shiki language identifier
  displayName: string;       // Human-readable name
  aliases: string[];         // Alternative names/extensions
  fallback?: string;         // Fallback language if not supported
}
```

### Theme Configuration

```typescript
interface ThemeConfig {
  name: string;              // Theme identifier
  displayName: string;       // Human-readable name
  isDark: boolean;          // Whether theme is dark
  cssVariables: Record<string, string>; // CSS custom properties
}
```

## Error Handling

### Syntax Highlighting Errors

1. **Language Not Supported:**
   - Fallback to 'plaintext' highlighting
   - Log warning for monitoring
   - Display language name as provided

2. **Shiki Initialization Failure:**
   - Fallback to unstyled `<pre><code>` rendering
   - Show error boundary with retry option
   - Maintain copy functionality

3. **Large Code Blocks:**
   - Implement size limits (e.g., 10,000 characters)
   - Show truncation warning for oversized content
   - Provide expand/collapse functionality

### Copy Operation Errors

1. **Clipboard API Unavailable:**
   - Fallback to text selection method
   - Show appropriate user message
   - Graceful degradation on older browsers

2. **Permission Denied:**
   - Inform user about clipboard permissions
   - Provide manual copy instructions
   - Log error for analytics

## Testing Strategy

### Unit Testing

1. **CodeBlock Component:**
   - Language extraction from className
   - Error boundary behavior
   - Props validation and defaults

2. **CodeBlockHeader Component:**
   - Copy functionality across browsers
   - Language display formatting
   - Accessibility compliance

3. **CodeBlockContent Component:**
   - Shiki integration and output
   - Fallback behavior testing
   - XSS prevention validation

### Integration Testing

1. **StyledText Integration:**
   - Markdown parsing with new components
   - Backward compatibility verification
   - Performance impact measurement

2. **Cross-Browser Testing:**
   - Copy functionality on mobile devices
   - Syntax highlighting consistency
   - Responsive design validation

### Performance Testing

1. **Load Testing:**
   - Multiple code blocks per page
   - Large code snippet handling
   - Memory usage monitoring

2. **Rendering Performance:**
   - Time-to-first-paint impact
   - Syntax highlighting duration
   - Mobile device performance

## Implementation Phases

### Phase 1: Foundation Setup
- Install Shiki and remove react-syntax-highlighter
- Create basic component structure
- Implement core CodeBlock component

### Phase 2: Syntax Highlighting
- Integrate Shiki with CodeBlockContent
- Implement language detection and fallbacks
- Add error handling and boundaries

### Phase 3: UI Enhancement
- Develop CodeBlockHeader with copy functionality
- Apply professional styling and theming
- Ensure responsive design

### Phase 4: Integration & Testing
- Integrate with existing StyledText component
- Comprehensive testing across devices
- Performance optimization and monitoring

### Phase 5: Polish & Documentation
- Final styling adjustments
- Documentation and code comments
- Deployment and monitoring setup

## Security Considerations

### XSS Prevention
- Sanitize all code content before rendering
- Use React's dangerouslySetInnerHTML safely with DOMPurify
- Validate language identifiers against whitelist

### Content Security Policy
- Ensure Shiki-generated CSS complies with CSP
- Handle inline styles appropriately
- Test with strict CSP configurations

## Performance Considerations

### Bundle Size Optimization
- Use Shiki's tree-shaking capabilities
- Load only required language grammars
- Implement lazy loading for less common languages

### Runtime Performance
- Cache Shiki highlighter instances
- Implement virtual scrolling for large code blocks
- Use React.memo for component optimization

### Memory Management
- Dispose of unused highlighter instances
- Implement cleanup in useEffect hooks
- Monitor memory usage in production