# Slash Menu (ComponentPickerPlugin) Guide

## Overview
The Slash Menu provides a typeahead interface for quickly inserting various components into the editor. Simply type `/` to trigger the menu.

## How to Use
1. Type `/` anywhere in the editor
2. A dropdown menu will appear with available options
3. Type to filter options (e.g., `/head` to find headings)
4. Use arrow keys to navigate or mouse to hover
5. Press Enter or click to select an option

## Available Options

### Text Formatting
- **Paragraph** - Normal text paragraph
- **Heading 1, 2, 3** - Different heading levels
- **Quote** - Block quote
- **Code** - Code block with syntax highlighting

### Lists
- **Numbered List** - Ordered list (1, 2, 3...)
- **Bulleted List** - Unordered list with bullets
- **Check List** - Todo list with checkboxes

### Content Elements
- **Table** - Insert a table (default 2x2)
- **Divider** - Horizontal rule separator
- **Page Break** - Page break for printing
- **Equation** - Mathematical equation with KaTeX
- **Date** - Insert current date
- **Today** - Insert today's date
- **Tomorrow** - Insert tomorrow's date
- **Yesterday** - Insert yesterday's date

### Alignment
- **Align left** - Left align content
- **Align center** - Center align content
- **Align right** - Right align content
- **Align justify** - Justify content

### Dynamic Options
- **Table Shortcuts** - Type patterns like `3x4` to create specific table sizes

## Search & Filtering
The menu supports intelligent filtering:
- Type partial names: `/head` finds all headings
- Use keywords: `/math` finds equations
- Multiple keywords: `/todo` or `/check` finds check lists

## Keyboard Navigation
- **↑/↓** - Navigate options
- **Enter** - Select highlighted option
- **Escape** - Close menu
- **Tab** - Navigate (same as ↓)

## Implementation Details
- Built using `LexicalTypeaheadMenuPlugin` from `@lexical/react`
- Triggers on `/` character with zero minimum length
- Supports whitespace after trigger
- Integrates with existing editor commands
- Renders using React portals for proper positioning

## Extending the Menu
To add new options, modify `getBaseOptions()` in `ComponentPickerPlugin.tsx`:

```typescript
new ComponentPickerOption('My Option', {
  icon: <i className="icon my-icon" />,
  keywords: ['my', 'option', 'keywords'],
  onSelect: () => {
    // Your command here
    editor.dispatchCommand(MY_COMMAND, payload);
  },
}),
```

## CSS Classes
- `.typeahead-popover` - Main menu container
- `.component-picker-menu` - Menu wrapper
- `.item` - Individual menu items
- `.item.selected` - Highlighted item
- `.icon` - Icon containers
- `.text` - Text labels