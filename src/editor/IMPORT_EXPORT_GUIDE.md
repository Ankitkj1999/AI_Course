# Import/Export Functionality Guide

## Overview

The AI Course Editor now includes import/export functionality similar to the Lexical playground. This allows users to save their editor content as JSON files and load them back later.

## Features

### Export Functionality
- **Button Location**: Bottom-left corner of the editor (green button with upload icon)
- **File Format**: JSON format containing the complete editor state
- **File Naming**: Automatically named as `AiCourse-Editor-{timestamp}.json`
- **Content**: Includes all editor content, formatting, and structure

### Import Functionality
- **Button Location**: Bottom-left corner of the editor (blue button with download icon)
- **File Format**: Accepts JSON files exported from Lexical editors
- **Compatibility**: Works with files exported from this editor or the Lexical playground
- **Behavior**: Replaces current editor content with imported content

## How to Use

### Exporting Content
1. Create some content in the editor (text, headings, lists, tables, etc.)
2. Click the green "Export" button in the bottom-left corner
3. The browser will download a JSON file with your content
4. Save the file for later use

### Importing Content
1. Click the blue "Import" button in the bottom-left corner
2. Select a previously exported JSON file from your computer
3. The editor content will be replaced with the imported content
4. All formatting and structure will be preserved

## Technical Details

### Implementation
- Uses `@lexical/file` package for import/export functionality
- Follows the same pattern as the Lexical playground
- Maintains compatibility with Lexical's serialization format

### File Structure
The exported JSON contains:
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

### Supported Content Types
- Plain text and rich text formatting
- Headings (H1-H6)
- Lists (ordered, unordered, checklist)
- Tables with formatting
- Code blocks with syntax highlighting
- Links and images
- Mathematical equations
- Page breaks
- Custom nodes and formatting

## User Interface

### Button Styling
- **Import Button**: Blue background with download icon
- **Export Button**: Green background with upload icon
- **Positioning**: Fixed position in bottom-left corner
- **Responsive**: Adapts to different screen sizes
- **Accessibility**: Full keyboard navigation and screen reader support

### Visual Feedback
- Hover effects with subtle animations
- Clear icons and text labels
- Consistent with overall editor design
- High contrast mode support

## Use Cases

1. **Content Backup**: Save your work as JSON files for backup
2. **Content Sharing**: Share editor content between users
3. **Template Creation**: Create reusable content templates
4. **Migration**: Move content between different Lexical editor instances
5. **Version Control**: Maintain different versions of your content

## Compatibility

- Compatible with Lexical playground exports
- Works with any Lexical editor using the same node types
- Maintains formatting across different editor instances
- Preserves custom styling and attributes

## Notes

- Import will replace all current editor content
- Large files may take a moment to process
- Unsupported node types will be filtered out during import
- Custom styling is preserved where supported