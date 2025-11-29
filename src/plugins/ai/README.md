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

The plugin components are properly structured and integrated into `TestPlate.tsx`:

- **Slash Menu**: AI Assistant appears in the `/` menu under "AI" group
- **Toolbar**: AI button appears in toolbar under "AI" group
- **Icons**: Both use the custom logo SVG from `src/res/logo.svg`

## Next Steps

1. Implement actual AI functionality (LLM integration)
2. Add keyboard navigation support
3. Test integration thoroughly
4. Add error handling and loading states
5. Create proper plugin registration if needed

## Usage

Currently integrated into TestPlate.tsx with placeholder functionality. The AI items will log to console when activated.