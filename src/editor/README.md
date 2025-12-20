# AI Course Lexical Editor Implementation

## Overview

This is a comprehensive Lexical editor implementation for the AI Course project, built following official Lexical documentation and playground patterns. The editor includes all core features for rich text editing, code highlighting, tables, images, links, and markdown support.

## Features Implemented

### ✅ Core Features

1. **Code Highlighting** - Using `@lexical/code` with proper syntax highlighting
   - Syntax highlighting for multiple languages
   - Code block formatting
   - Inline code formatting

2. **Rich Text Formatting** - Bold, italic, underline, strikethrough
   - Complete text formatting toolbar
   - Keyboard shortcuts support
   - Proper selection handling

3. **Lists** - Ordered, unordered, and checklist support
   - Bulleted lists (unordered)
   - Numbered lists (ordered)
   - Checklist support with interactive checkboxes
   - Nested list support

4. **Tables** - Full table support with cell merging, resizing
   - Table insertion and editing
   - Cell resizing capabilities
   - Table navigation

5. **Links** - Link nodes with floating editor
   - Link insertion and editing
   - Floating link editor for easy modification
   - Auto-link detection
   - Clickable links

6. **Images** - Image nodes with resizing and captions
   - Image insertion via URL
   - Drag and drop support
   - Image resizing
   - Proper image handling

7. **Markdown** - Import/export and shortcuts
   - Markdown shortcuts (e.g., `**bold**`, `*italic*`)
   - Full markdown transformer support
   - Import/export capabilities

## Architecture

### File Structure

```
src/editor/
├── Editor.tsx              # Main editor component
├── Editor.css              # Comprehensive styling
├── ExampleTheme.ts         # Theme configuration
├── styleConfig.ts          # Style parsing utilities
├── README.md              # This documentation
├── nodes/
│   ├── index.ts           # Node exports
│   └── ImageNode.tsx      # Custom image node
└── plugins/
    ├── CodeHighlightPlugin.tsx      # Code syntax highlighting
    ├── FloatingLinkEditorPlugin.tsx # Floating link editor
    ├── ImagesPlugin.tsx             # Image handling
    ├── TableCellResizerPlugin.tsx   # Table cell resizing
    ├── ToolbarPlugin.tsx            # Main toolbar
    └── TreeViewPlugin.tsx           # Debug tree view
```

### Key Components

#### Editor.tsx
- Main editor component using `LexicalComposer`
- Configures all nodes and plugins
- Handles editor initialization and configuration
- Implements proper plugin composition

#### ToolbarPlugin.tsx
- Comprehensive formatting toolbar
- Block type selection (headings, quotes, code blocks)
- Text formatting controls
- List and table insertion
- Link and image insertion

#### Plugins
- **CodeHighlightPlugin**: Provides syntax highlighting for code blocks
- **FloatingLinkEditorPlugin**: Floating toolbar for link editing
- **ImagesPlugin**: Handles image insertion and drag & drop
- **TableCellResizerPlugin**: Enables table cell resizing

### Node Configuration

The editor is configured with all necessary nodes:

```typescript
nodes: [
  // Core nodes
  ParagraphNode,
  TextNode,
  // Rich text nodes
  HeadingNode,
  QuoteNode,
  // Code nodes
  CodeNode,
  CodeHighlightNode,
  // Link nodes
  LinkNode,
  AutoLinkNode,
  // List nodes
  ListNode,
  ListItemNode,
  // Table nodes
  TableNode,
  TableCellNode,
  TableRowNode,
  // Image node
  ImageNode,
]
```

## Usage

### Basic Usage

```tsx
import Editor from './editor/Editor';

function App() {
  return (
    <div className="app">
      <Editor />
    </div>
  );
}
```

### Customization

The editor can be customized by:

1. **Modifying the theme** in `ExampleTheme.ts`
2. **Adding new plugins** to the plugin composition
3. **Extending the toolbar** in `ToolbarPlugin.tsx`
4. **Adding custom nodes** following Lexical patterns

## Styling

The editor includes comprehensive CSS styling in `Editor.css` covering:

- Editor container and layout
- Text formatting styles
- List and table styles
- Code block syntax highlighting
- Toolbar styling
- Responsive design
- Focus states and interactions

## Best Practices Followed

1. **Lexical Architecture Patterns**
   - Proper use of `$` functions within update/read contexts
   - Command-based interactions
   - Plugin composition pattern
   - Node immutability and key management

2. **React Integration**
   - Proper use of `LexicalComposer` and context
   - Plugin lifecycle management
   - State management with hooks

3. **Performance**
   - Efficient update listeners
   - Proper cleanup of event handlers
   - Optimized re-renders

4. **Accessibility**
   - Proper ARIA labels
   - Keyboard navigation support
   - Screen reader compatibility

## Dependencies

The editor uses the following Lexical packages:

- `lexical` - Core framework
- `@lexical/react` - React bindings
- `@lexical/rich-text` - Rich text features
- `@lexical/list` - List support
- `@lexical/table` - Table support
- `@lexical/code` - Code highlighting
- `@lexical/link` - Link support
- `@lexical/markdown` - Markdown support
- `@lexical/utils` - Utility functions

## Future Enhancements

Potential areas for future development:

1. **Collaboration** - Real-time collaborative editing
2. **More Node Types** - Custom decorators, embeds
3. **Advanced Formatting** - Font size, colors, alignment
4. **Export Options** - PDF, Word document export
5. **Plugin Ecosystem** - Additional specialized plugins

## Troubleshooting

### Common Issues

1. **Plugin not working**: Ensure the plugin is properly registered in the editor configuration
2. **Styling issues**: Check that `Editor.css` is properly imported
3. **Node not recognized**: Verify the node is included in the `nodes` array
4. **Commands not working**: Ensure commands are dispatched within proper update contexts

### Debug Tools

The editor includes a TreeViewPlugin for debugging the editor state. This shows the current node tree structure and can help identify issues with node composition.

## Contributing

When adding new features:

1. Follow Lexical architectural patterns
2. Add proper TypeScript types
3. Include comprehensive CSS styling
4. Update this documentation
5. Test thoroughly with different content types

## References

- [Lexical Documentation](https://lexical.dev/)
- [Lexical Playground](https://playground.lexical.dev/)
- [React Integration Guide](https://lexical.dev/docs/getting-started/react)