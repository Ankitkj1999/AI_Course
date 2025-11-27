# AI Slash Commands - Quick Start

## 🚀 What is This?

AI Slash Commands bring Notion-like AI assistance directly into the Milkdown editor. Type `/` anywhere to access 19 powerful AI commands that can generate, enhance, transform, structure, and analyze your content.

## ⚡ Quick Start

1. **Open the editor** at `/test-plate` route
2. **Type some content** (at least a paragraph)
3. **Press `/`** to open the AI command menu
4. **Select a command** or search for one
5. **Watch AI work** - content updates automatically!

## 🎯 Top 5 Commands to Try First

1. **Continue writing** ✍️ - Overcome writer's block
2. **Improve writing** ✨ - Make text clearer and better
3. **Fix spelling & grammar** ✓ - Quick proofreading
4. **Convert to bullet points** • - Organize information
5. **Extract key points** 🎯 - Get the main ideas

## 📋 All Commands

### 📝 GENERATE (Create new content)
- Continue writing
- Explain topic
- Add summary
- Add example

### ✨ ENHANCE (Improve existing content)
- Improve writing
- Make longer
- Make shorter
- Fix spelling & grammar
- Simplify language

### 🎯 TRANSFORM (Change style)
- Change tone: Formal
- Change tone: Casual
- Translate

### 📊 STRUCTURE (Reorganize)
- Convert to bullet points
- Create table
- Create outline

### 🔍 ANALYZE (Extract insights)
- Extract key points
- Generate questions
- Extract action items

## 🎨 Features

- **Slash Menu** - Type `/` to open
- **Search** - Filter commands instantly
- **Custom Prompts** - Any AI task you need
- **Smart Context** - Uses your document automatically
- **Loading States** - Clear visual feedback
- **Error Handling** - Helpful error messages
- **Keyboard Shortcuts** - Fast navigation

## 📖 Documentation

- **Full Guide**: [ai-slash-commands.md](./ai-slash-commands.md)
- **Quick Reference**: [ai-commands-quick-reference.md](./ai-commands-quick-reference.md)
- **Examples**: [examples/ai-slash-commands-demo.md](./examples/ai-slash-commands-demo.md)
- **Implementation**: [AI_SLASH_COMMANDS_IMPLEMENTATION.md](./AI_SLASH_COMMANDS_IMPLEMENTATION.md)
- **UI Structure**: [examples/slash-menu-structure.md](./examples/slash-menu-structure.md)

## 💡 Pro Tips

1. **Write first** - AI works best with context (at least a paragraph)
2. **Use search** - Type in the slash menu to filter commands
3. **Try custom prompts** - For tasks not in the menu
4. **Combine commands** - Run multiple in sequence
5. **Review output** - Always check AI-generated content

## ⌨️ Keyboard Shortcuts

- `/` - Open slash menu
- `Esc` - Close menu
- `Enter` - Submit custom prompt

## 🔧 Technical Details

- **File**: `src/pages/TestPlate.tsx`
- **API**: `/api/llm/generate`
- **Framework**: Milkdown + React
- **UI**: shadcn/ui components
- **Styling**: Tailwind CSS + custom CSS

## 🐛 Troubleshooting

**Menu not appearing?**
- Make sure editor is loaded
- Click in editor to focus it
- Check console for errors

**Commands failing?**
- Verify LLM backend is running
- Check you have enough content
- Review network tab for API errors

**Performance issues?**
- Wait for previous command to finish
- Try with shorter documents
- Check your LLM backend performance

## 🎓 Learning Path

1. **Start simple** - Try "Continue writing" and "Improve writing"
2. **Explore categories** - Test one command from each category
3. **Use custom prompts** - Try specific requests
4. **Read examples** - Check the demo document
5. **Build workflows** - Combine commands for complex tasks

## 🚦 Status

✅ **Production Ready**
- All 19 commands implemented
- Full error handling
- Comprehensive documentation
- Tested and working

## 📞 Support

For issues or questions:
1. Check the [troubleshooting guide](./ai-slash-commands.md#troubleshooting)
2. Review [examples](./examples/ai-slash-commands-demo.md)
3. Read the [full documentation](./ai-slash-commands.md)

## 🎉 Get Started Now!

1. Navigate to the editor
2. Type `/`
3. Start creating amazing content with AI!

---

**Built with ❤️ using Milkdown and your LLM backend**
