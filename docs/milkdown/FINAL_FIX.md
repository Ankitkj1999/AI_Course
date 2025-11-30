# Milkdown AI Plugin - Final Fix

## The Real Problem

The error `Context "editorViewCtx" not found` occurred because we were trying to access Milkdown's context directly via `editor.ctx.get()`, but the context wasn't available at that time.

## The Solution

Use Milkdown's `editor.action()` method, which is the **proper way** to access the context safely.

### Before (Broken)
```typescript
private getView(): EditorView | null {
  if (!this.crepe?.editor) return null;
  
  try {
    // Direct access - context not available!
    return this.crepe.editor.ctx.get('editorViewCtx') as EditorView;
  } catch (error) {
    return null;
  }
}
```

### After (Working)
```typescript
getSelectedText(): string {
  if (!this.crepe?.editor) return '';
  
  try {
    // Use action() method - context is guaranteed to be available
    return this.crepe.editor.action((ctx) => {
      const view = ctx.get('editorViewCtx' as never);
      if (!view || typeof view !== 'object') return '';
      
      const editorView = view as EditorViewLike;
      const { from, to } = editorView.state.selection;
      
      if (from === to) return '';
      return editorView.state.doc.textBetween(from, to, ' ');
    });
  } catch (error) {
    console.error('Failed to get selected text:', error);
    return '';
  }
}
```

## Why This Works

The `editor.action()` method:
1. **Ensures context is available** - It's called at the right time in Milkdown's lifecycle
2. **Provides safe access** - The context is passed as a parameter
3. **Handles errors gracefully** - If context isn't ready, it fails safely

## Key Changes

### 1. All operations now use `editor.action()`

```typescript
// Get selected text
this.crepe.editor.action((ctx) => {
  const view = ctx.get('editorViewCtx' as never);
  // ... use view
});

// Replace text
this.crepe.editor.action((ctx) => {
  const view = ctx.get('editorViewCtx' as never);
  const { state, dispatch } = view as EditorViewLike;
  const tr = state.tr.replaceWith(from, to, state.schema.text(text));
  dispatch(tr);
});

// Insert text
this.crepe.editor.action((ctx) => {
  const view = ctx.get('editorViewCtx' as never);
  const { state, dispatch } = view as EditorViewLike;
  const tr = state.tr.insert(from, state.schema.text(text));
  dispatch(tr);
});
```

### 2. Type-safe interface

```typescript
interface EditorViewLike {
  state: {
    selection: { from: number; to: number };
    doc: { textBetween: (from: number, to: number, separator?: string) => string };
    tr: {
      replaceWith: (from: number, to: number, node: unknown) => unknown;
      insert: (pos: number, node: unknown) => unknown;
    };
    schema: { text: (text: string) => unknown };
  };
  dispatch: (tr: unknown) => void;
}
```

### 3. Proper readiness check

```typescript
isReady(): boolean {
  // Don't use action() here - just check if editor exists
  // The action() method will handle context access when called
  return this.crepe !== null && this.crepe.editor !== undefined;
}
```

**Critical:** Don't try to access the context in `isReady()` - just check if the editor instance exists. The `action()` method will handle context access when you actually call the editor methods.

## Testing

The implementation should now:
- ✅ Initialize without "context not found" errors
- ✅ Properly access editor state through `action()`
- ✅ Insert/replace text successfully
- ✅ Handle errors gracefully
- ✅ Work reliably every time

## Milkdown API Patterns

### ❌ Don't Do This
```typescript
// Direct context access - unreliable
const view = editor.ctx.get('editorViewCtx');
```

### ✅ Do This Instead
```typescript
// Use action() method - reliable
editor.action((ctx) => {
  const view = ctx.get('editorViewCtx' as never);
  // ... use view safely
});
```

## Why Previous Attempts Failed

1. **Attempt 1**: Tried to use `commandsCtx` - doesn't exist in Crepe
2. **Attempt 2**: Tried direct `ctx.get('editorViewCtx')` - context not available
3. **Attempt 3**: Used `editor.action()` - proper API, but...
4. **Attempt 4 (Success)**: Used `editor.action()` AND called it at the right time

## Critical Timing Issue

**Problem:** Calling `getSelectedText()` in the toolbar/slash menu `onRun` callback fails because the context isn't available yet.

**Solution:** Defer getting selected text until AI execution time:

```typescript
// ❌ WRONG - Called too early (in click handler)
const handleToolbarAIClick = () => {
  const selectedText = milkdownAIUtils.getSelectedText(); // Context not available!
  aiModal.openModal('toolbar', selectedText);
};

// ✅ CORRECT - Called at execution time
const handleAIExecute = async (option, customPrompt) => {
  // Get selected text NOW when context is available
  const selectedText = milkdownAIUtils.getSelectedText(); // Works!
  // ... use selectedText
};
```

## Conclusion

The `editor.action()` method is the **correct and only reliable way** to access Milkdown's context in Crepe. This is documented in Milkdown's API but easy to miss.

**Key Takeaway:** Always use `editor.action()` when you need to access Milkdown's internal context.

---

**Status: FIXED** ✅

The AI plugin now works correctly with proper context access through Milkdown's action API.
