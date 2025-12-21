# Import/Export Functionality Guide

## Overview

The AI Course Editor now includes comprehensive import/export functionality supporting multiple formats: JSON, HTML, and Markdown. This allows users to save their editor content in various formats and load them back later, providing maximum flexibility for content management.

## Features

### Export Functionality
- **Button Location**: Bottom-left corner of the editor (green button with upload icon and dropdown)
- **Supported Formats**: 
  - **JSON**: Complete editor state with all formatting and structure
  - **HTML**: Standard HTML format for web publishing
  - **Markdown**: Lightweight markup format for documentation
- **File Naming**: Automatically timestamped filenames
- **Dropdown Menu**: Click the export button to see format options

### Import Functionality
- **Button Location**: Bottom-left corner of the editor (blue button with download icon and dropdown)
- **Supported Formats**:
  - **JSON**: Lexical editor state files
  - **HTML**: Standard HTML files (.html, .htm)
  - **Markdown**: Markdown files (.md, .markdown)
- **File Selection**: Click format option to open file picker
- **Behavior**: Replaces current editor content with imported content

## How to Use

### Exporting Content

#### Export as JSON
1. Click the green "Export" button in the bottom-left corner
2. Select "JSON" from the dropdown menu
3. A JSON file with complete editor state will be downloaded
4. Preserves all formatting, custom nodes, and editor structure

#### Export as HTML
1. Click the green "Export" button
2. Select "HTML" from the dropdown menu
3. An HTML file with your content will be downloaded
4. Perfect for web publishing or sharing

#### Export as Markdown
1. Click the green "Export" button
2. Select "Markdown" from the dropdown menu
3. A Markdown file with your content will be downloaded
4. Ideal for documentation and version control

### Importing Content

#### Import from JSON
1. Click the blue "Import" button in the bottom-left corner
2. Select "JSON" from the dropdown menu
3. Choose a previously exported JSON file
4. All formatting and structure will be perfectly preserved

#### Import from HTML
1. Click the blue "Import" button
2. Select "HTML" from the dropdown menu
3. Choose an HTML file from your computer
4. Content will be converted to editor format

#### Import from Markdown
1. Click the blue "Import" button
2. Select "Markdown" from the dropdown menu
3. Choose a Markdown file (.md or .markdown)
4. Content will be parsed and converted to rich text

## Technical Details

### Implementation
- Uses official Lexical packages:
  - `@lexical/file` for JSON import/export
  - `@lexical/html` for HTML conversion
  - `@lexical/markdown` for Markdown conversion
- Follows Lexical's architectural patterns
- Maintains compatibility with Lexical playground

### Export Functions
```javascript
// JSON Export
exportFile(editor, { fileName: 'content.json', source: 'AiCourse' });

// HTML Export
editor.update(() => {
  const htmlString = $generateHtmlFromNodes(editor, null);
  // Download HTML file
});

// Markdown Export
editor.update(() => {
  const markdown = $convertToMarkdownString(TRANSFORMERS);
  // Download Markdown file
});
```

### Import Functions
```javascript
// JSON Import
importFile(editor); // Uses Lexical's built-in file picker

// HTML Import
editor.update(() => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(htmlString, 'text/html');
  const nodes = $generateNodesFromDOM(editor, dom);
  $getRoot().clear();
  $insertNodes(nodes);
});

// Markdown Import
editor.update(() => {
  $getRoot().clear();
  $convertFromMarkdownString(markdown, TRANSFORMERS);
});
```

### File Structure

#### JSON Export
```json
{
  "source": "AiCourse",
  "version": "0.39.0",
  "editorState": {
    "root": {
      "children": [...],
      "direction": "ltr",
      "format": "",
      "indent": 0,
      "type": "root",
      "version": 1
    }
  }
}
```

#### HTML Export
Standard HTML with proper semantic structure:
```html
<h1>Heading</h1>
<p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
<ul>
  <li>List item 1</li>
  <li>List item 2</li>
</ul>
```

#### Markdown Export
Clean Markdown syntax:
```markdown
# Heading

Paragraph with **bold** and *italic* text.

- List item 1
- List item 2
```

### Supported Content Types
- Plain text and rich text formatting (bold, italic, underline, strikethrough)
- Headings (H1-H6)
- Lists (ordered, unordered, checklist)
- Tables with formatting
- Code blocks with syntax highlighting
- Links and images
- Mathematical equations (KaTeX)
- Page breaks
- Custom nodes and formatting

## User Interface

### Dropdown Design
- **Export Button**: Green background with upload icon and chevron
- **Import Button**: Blue background with download icon and chevron
- **Format Icons**: Distinct icons for JSON, HTML, and Markdown
- **Hover Effects**: Smooth animations and visual feedback
- **Click Outside**: Dropdowns close when clicking elsewhere

### Responsive Design
- **Desktop**: Full dropdown menus with icons and text
- **Tablet**: Compact menus with smaller text
- **Mobile**: Stacked layout to prevent overlap
- **Touch Devices**: Larger touch targets for better usability

### Accessibility Features
- Full keyboard navigation support
- Screen reader compatible with ARIA labels
- High contrast mode support
- Focus indicators for all interactive elements
- Reduced motion support for users with vestibular disorders

## Use Cases

1. **Content Backup**: Save work in multiple formats for redundancy
2. **Cross-Platform Sharing**: Export to HTML/Markdown for other platforms
3. **Documentation Workflow**: Use Markdown export for documentation systems
4. **Web Publishing**: Export HTML for direct web use
5. **Version Control**: Use Markdown for Git-friendly version control
6. **Template Creation**: Create reusable content templates in any format
7. **Migration**: Move content between different editor systems
8. **Collaboration**: Share content in universally readable formats

## Format Comparison

| Feature | JSON | HTML | Markdown |
|---------|------|------|----------|
| **Fidelity** | Perfect | High | Good |
| **File Size** | Large | Medium | Small |
| **Readability** | Low | Medium | High |
| **Web Ready** | No | Yes | No |
| **Version Control** | Poor | Fair | Excellent |
| **Universal Support** | No | Yes | Yes |
| **Custom Nodes** | Yes | Partial | Limited |

## Best Practices

### When to Use Each Format

**JSON Export/Import:**
- Backing up complete editor state
- Moving content between Lexical editors
- Preserving custom formatting and nodes
- Development and testing scenarios

**HTML Export/Import:**
- Publishing content to websites
- Sharing formatted content via email
- Converting from other HTML editors
- Creating printable documents

**Markdown Export/Import:**
- Documentation workflows
- Version control systems (Git)
- Platform-independent content storage
- Collaboration with developers
- Blog post creation

### File Management Tips
- Use descriptive filenames with timestamps
- Organize exports by project or date
- Keep JSON backups for important content
- Use Markdown for long-term storage
- Export to HTML for sharing with non-technical users

## Compatibility

- **Lexical Playground**: Full compatibility with JSON format
- **Standard HTML**: Works with any HTML editor or browser
- **GitHub Markdown**: Compatible with GitHub-flavored Markdown
- **Documentation Systems**: Works with GitBook, Docusaurus, etc.
- **Static Site Generators**: Compatible with Jekyll, Hugo, etc.

## Limitations

### HTML Import/Export
- Some custom Lexical nodes may not convert perfectly
- Complex table formatting might be simplified
- Custom styling may be lost in conversion

### Markdown Import/Export
- Limited support for complex formatting
- Tables have basic formatting only
- Custom nodes are not supported
- Images require external hosting

### General
- Large files may take time to process
- Import replaces all current content
- Some browser-specific features may not work across all platforms

## Troubleshooting

### Common Issues
1. **File not downloading**: Check browser popup blockers
2. **Import not working**: Verify file format and extension
3. **Formatting lost**: Use JSON for perfect fidelity
4. **Large file issues**: Break content into smaller sections

### Error Handling
- Invalid files are rejected with user feedback
- Unsupported content is filtered during import
- Network issues are handled gracefully
- File size limits are enforced for performance