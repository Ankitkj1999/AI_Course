# AI Plugin for Milkdown Crepe

This plugin provides AI functionality integration for the Milkdown Crepe editor.

## Structure

```
src/plugins/ai/
├── index.ts          # Main plugin entry point
├── command.ts        # AI command definition
├── slash-menu.ts     # Slash menu item configuration
├── toolbar.ts        # Toolbar item configuration
└── README.md         # This file
```

## Current Status

✅ **Completed:**
- Plugin folder structure created
- Basic plugin architecture implemented
- AI command placeholder created
- Slash menu and toolbar item configurations defined with correct API
- Integration with TestPlate.tsx using proper `buildMenu` and `buildToolbar` APIs

## Discovered API Information

From Milkdown source code analysis:

### buildMenu API (BlockEdit Feature)
```typescript
buildMenu?: (builder: GroupBuilder<SlashMenuItem>) => void

// Usage:
builder.addGroup("groupName", "Group Label").addItem("itemId", {
  label: string,
  icon: string,
  onRun: (ctx) => void
});
```

### buildToolbar API (Toolbar Feature)
```typescript
buildToolbar?: (builder: GroupBuilder<ToolbarItem>) => void

// Usage:
builder.addGroup("groupName", "Group Label").addItem("itemId", {
  icon: string,
  active?: (ctx) => boolean,
  onRun?: (ctx) => void
});
```

## Current Implementation

The plugin is fully implemented with a unified AI modal system:

### **Unified AI Modal**
- **Single Modal**: Opens from both toolbar and slash menu
- **Context-Aware**: Shows different options based on trigger source
- **Input Field**: "Ask AI Anything..." at the top
- **Keyboard Navigation**: Up/down arrows to navigate options, Enter to select
- **Smart Context**: Detects selected text vs empty line scenarios

### **Context-Aware Options**

**Toolbar Actions (Selected Text):**
- ✨ Improve writing
- 📏 Make longer/shorter
- ✂️ Make shorter
- 🔤 Simplify language
- ✓ Fix grammar

**Slash Menu Actions (New Content):**
- ✍️ Continue writing
- 📝 Write introduction
- 💡 Generate ideas
- 📋 Create summary
- 🎯 Write conclusion

### **Integration Points**
- **Slash Menu**: `/` → AI Assistant → Modal opens
- **Toolbar**: Select text → AI button → Modal opens with context
- **Custom Input**: Always available for any AI request

### **Technical Features**
- ✅ Keyboard navigation (↑↓ arrows, Enter, Esc)
- ✅ Context detection (selected text vs empty line)
- ✅ Loading states and error handling
- ✅ Toast notifications
- ✅ Proper editor integration (replace vs insert)

## Usage

1. **For selected text**: Select text → Click AI button → Choose from toolbar actions or type custom prompt
2. **For new content**: Type `/` → Select "AI Assistant" → Choose from generation actions or type custom prompt
3. **Custom requests**: Type any prompt in the input field for full AI flexibility

The implementation provides exactly what you requested: **mandatory custom input + context-aware quick actions + simple, unified UX**.