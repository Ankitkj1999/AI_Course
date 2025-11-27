# AI Slash Commands for Milkdown Editor

## Overview

The Milkdown editor now includes AI-enhanced slash commands, providing a powerful and intuitive way to interact with AI assistance while writing. Simply type `/` anywhere in the editor to access a comprehensive menu of AI-powered commands.

## Features

### 🎯 Slash Command Menu
- **Trigger**: Type `/` anywhere in the editor
- **Search**: Filter commands by name or category
- **Categories**: Commands organized into 5 categories
- **Keyboard Navigation**: Use `Esc` to close the menu

### 📝 Command Categories

#### 1. GENERATE
Commands that create new content:
- **Continue writing** ✍️ - AI continues your text naturally
- **Explain topic** 💡 - Explains a concept in detail
- **Add summary** 📋 - Creates a concise summary
- **Add example** 📝 - Adds relevant examples

#### 2. ENHANCE
Commands that improve existing content:
- **Improve writing** ✨ - Makes text clearer and better written
- **Make longer** 📏 - Expands content with more details
- **Make shorter** ✂️ - Condenses text while keeping key points
- **Fix spelling & grammar** ✓ - Corrects errors
- **Simplify language** 🔤 - Uses simpler words and sentences

#### 3. TRANSFORM
Commands that change style or format:
- **Change tone: Formal** 🎩 - Rewrites in formal tone
- **Change tone: Casual** 😊 - Rewrites in casual tone
- **Translate** 🌐 - Translates content (default: Spanish)

#### 4. STRUCTURE
Commands that reorganize content:
- **Convert to bullet points** • - Creates organized lists
- **Create table** 📊 - Formats content as a table
- **Create outline** 📑 - Generates structured outline

#### 5. ANALYZE
Commands that extract insights:
- **Extract key points** 🎯 - Lists main points
- **Generate questions** ❓ - Creates thoughtful questions
- **Extract action items** ✅ - Identifies tasks and actions

## Usage

### Basic Workflow

1. **Write content** in the Milkdown editor
2. **Type `/`** to open the AI command menu
3. **Search or browse** commands by category
4. **Click a command** to execute it
5. **Wait for AI** to process (loading indicator shown)
6. **Review results** - content is automatically inserted/replaced

### Custom Prompts

For tasks not covered by preset commands:

1. Click the **"Custom Prompt"** button in the toolbar
2. Enter your custom instruction
3. AI will use your document as context
4. Press `Enter` or click "Generate"

### Keyboard Shortcuts

- `/` - Open slash command menu
- `Esc` - Close slash command menu
- `Enter` - Execute custom prompt (in dialog)

## Command Behavior

### Content Replacement vs. Addition

**Commands that ADD content** (append to document):
- Continue writing
- Add summary
- Add example
- Extract key points
- Generate questions
- Extract action items

**Commands that REPLACE content** (modify entire document):
- Improve writing
- Make longer/shorter
- Fix spelling & grammar
- Simplify language
- Change tone
- Convert to bullets/table/outline
- Translate

## Technical Details

### AI Integration

Commands use the `/api/llm/generate` endpoint with:
- Temperature: 0.7
- Context: Full document content
- Prompts: Optimized for each command type

### Context Awareness

- **Full document context**: Most commands send entire document
- **Smart prompting**: Each command has optimized prompt engineering
- **Markdown preservation**: AI maintains markdown formatting

### Error Handling

- Minimum content requirements enforced
- Clear error messages via toast notifications
- Graceful fallback on API failures
- Loading states prevent multiple simultaneous requests

## UI/UX Features

### Visual Feedback

- **Loading overlay**: Blurred background with spinner during AI processing
- **Toast notifications**: Success/error messages for all operations
- **Smooth animations**: Fade-in effects for slash menu
- **Category organization**: Commands grouped logically

### Accessibility

- Keyboard navigation support
- Clear visual indicators
- Descriptive labels and icons
- Focus management

## Best Practices

### When to Use Each Command

**For drafting:**
- Start with "Continue writing" to overcome writer's block
- Use "Add example" to illustrate points

**For editing:**
- "Improve writing" for general enhancement
- "Fix spelling & grammar" for proofreading
- "Simplify language" for clarity

**For restructuring:**
- "Convert to bullet points" for lists
- "Create outline" for organization
- "Create table" for data presentation

**For analysis:**
- "Extract key points" for summaries
- "Generate questions" for study guides
- "Extract action items" for meeting notes

### Tips for Better Results

1. **Provide context**: Write at least a paragraph before using AI commands
2. **Be specific**: Use custom prompts for unique requirements
3. **Iterate**: Run multiple commands to refine content
4. **Review output**: Always check AI-generated content for accuracy
5. **Combine commands**: Use multiple commands in sequence for best results

## Customization

### Adding New Commands

To add custom commands, edit `src/pages/TestPlate.tsx`:

```typescript
{
  id: 'your-command-id',
  label: 'Your Command Label',
  icon: '🎯',
  category: 'generate', // or 'enhance', 'transform', 'structure', 'analyze'
  needsContext: true, // requires existing content
  action: async (context: string) => {
    const prompt = `Your custom prompt: ${context}`;
    return await callAI(prompt);
  }
}
```

### Modifying Prompts

Each command's prompt can be customized in the `action` function to better suit your needs.

## Troubleshooting

### Slash Menu Not Appearing
- Ensure editor is fully loaded (check for "Editor ready" state)
- Try clicking in the editor first to focus it
- Check browser console for errors

### AI Commands Failing
- Verify LLM backend is running and accessible
- Check `/api/llm/generate` endpoint is responding
- Ensure sufficient content exists (minimum 10 characters for most commands)
- Review browser network tab for API errors

### Performance Issues
- Avoid running multiple commands simultaneously
- Wait for previous command to complete
- Consider shorter documents for faster processing

## Future Enhancements

Potential improvements:
- Keyboard shortcuts for common commands (e.g., `Cmd+K`)
- Preview mode before applying changes
- Undo/redo for AI changes
- Selection-based commands (work on highlighted text only)
- Command history and favorites
- Multi-language translation options
- Custom command templates
- Collaborative AI suggestions

## Related Documentation

- [Milkdown Editor Documentation](https://milkdown.dev/)
- [API Reference](./api-reference.md)
- [LLM Integration Guide](./configuration.md)

---

**Built with Milkdown** - A plugin-driven WYSIWYG markdown editor framework
**Powered by your LLM backend** - Works with any compatible language model
