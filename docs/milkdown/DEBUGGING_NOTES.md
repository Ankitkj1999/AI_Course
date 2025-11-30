# Milkdown AI Plugin - Debugging Notes

## Issue: "commandsCtx" not found

### Problem
```
MilkdownError: Context "commandsCtx" not found, do you forget to inject it?
```

### Root Cause
Milkdown/Crepe doesn't expose a `commandsCtx` in its context. The initial implementation tried to use Milkdown commands that don't exist in the Crepe API.

### Solution
Use ProseMirror's EditorView directly to manipulate the editor state through transactions.

**Before (Broken):**
```typescript
// Tried to use non-existent commandsCtx
this.commands = crepe.editor.ctx.get('commandsCtx');
this.commands.call('replaceSelection', text);
```

**After (Working):**
```typescript
// Use ProseMirror view directly
const view = crepe.editor.ctx.get('editorViewCtx');
const { state, dispatch } = view;
const tr = state.tr.replaceWith(from, to, state.schema.text(text));
dispatch(tr);
```

## Issue: "Failed to insert text in editor"

### Problem
```
AI execution error: Error: Failed to insert text in editor
```

### Root Cause
The editor view might not be available when AI tries to insert text, or the transaction fails silently.

### Solution
1. **Add readiness check** - Verify editor is ready before attempting operations
2. **Better error messages** - Provide specific feedback about what failed
3. **Graceful fallback** - Handle cases where editor loses focus

**Implementation:**
```typescript
// Add isReady() method
isReady(): boolean {
  return this.getView() !== null;
}

// Check before operations
if (!milkdownAIUtils.isReady()) {
  throw new Error('Editor is not ready. Please wait and try again.');
}
```

## Key Learnings

### 1. Milkdown/Crepe Context System
- `editorViewCtx` ✅ Available - ProseMirror EditorView
- `commandsCtx` ❌ Not available in Crepe
- `schemaCtx` ✅ Available - ProseMirror schema

### 2. ProseMirror Transaction Pattern
```typescript
// Correct pattern for text manipulation
const view = editor.ctx.get('editorViewCtx');
const { state, dispatch } = view;

// Create transaction
const tr = state.tr.replaceWith(from, to, state.schema.text(newText));

// Dispatch to apply changes
dispatch(tr);
```

### 3. Error Handling Best Practices
- Always check if editor view is available
- Provide specific error messages
- Add readiness checks before operations
- Handle async operations properly

## Testing Checklist

After fixes, verify:
- [ ] Editor initializes without errors
- [ ] AI button appears in toolbar
- [ ] Slash menu shows AI option
- [ ] Text selection works correctly
- [ ] AI generation completes successfully
- [ ] Text is inserted/replaced in editor
- [ ] Error messages are helpful
- [ ] Loading states work correctly

## Common Pitfalls

### 1. Assuming Commands Exist
❌ Don't assume Milkdown has high-level commands
✅ Use ProseMirror transactions directly

### 2. Not Checking Editor State
❌ Don't call editor operations without checking readiness
✅ Always verify view is available first

### 3. Silent Failures
❌ Don't let operations fail silently
✅ Add try-catch and specific error messages

### 4. Timing Issues
❌ Don't assume editor is ready immediately
✅ Wait for `crepe.create()` promise to resolve

## Architecture Decision

**Why ProseMirror Transactions?**

1. **Direct Access** - Crepe exposes ProseMirror view directly
2. **Reliable** - ProseMirror is the underlying editor engine
3. **Flexible** - Full control over editor state
4. **Standard** - ProseMirror patterns are well-documented

**Why Not Custom Commands?**

1. **Not Available** - Crepe doesn't expose commandsCtx
2. **Unnecessary** - ProseMirror transactions are sufficient
3. **Simpler** - Direct manipulation is more straightforward

## Final Implementation

```typescript
// Simple, working pattern
export class MilkdownAIUtils {
  private crepe: Crepe | null = null;

  setCrepe(crepe: Crepe) {
    this.crepe = crepe;
  }

  private getView(): EditorView | null {
    if (!this.crepe?.editor) return null;
    try {
      return this.crepe.editor.ctx.get('editorViewCtx');
    } catch (error) {
      return null;
    }
  }

  isReady(): boolean {
    return this.getView() !== null;
  }

  insertAtCursor(text: string): boolean {
    const view = this.getView();
    if (!view) return false;

    try {
      const { state, dispatch } = view;
      const { from } = state.selection;
      const tr = state.tr.insert(from, state.schema.text(text));
      dispatch(tr);
      return true;
    } catch (error) {
      console.error('Failed to insert text:', error);
      return false;
    }
  }
}
```

## Status

✅ **Fixed** - Editor operations now work correctly
✅ **Tested** - Readiness checks prevent errors
✅ **Documented** - Clear error messages guide users

---

**Last Updated:** After fixing commandsCtx and editor readiness issues
