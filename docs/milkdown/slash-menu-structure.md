# Slash Menu UI Structure

## Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│  Milkdown AI Editor                                     │
│  Type / for AI commands                                 │
├─────────────────────────────────────────────────────────┤
│  [Copy] [Download] [Custom Prompt]  [AI Assistant ▼]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  # Welcome to Milkdown                                  │
│  Type / to open AI menu...                              │
│                                                         │
│  ┌──────────────────────────────────────┐              │
│  │  Search AI commands...               │              │
│  ├──────────────────────────────────────┤              │
│  │  📝 GENERATE                         │              │
│  │  ✍️  Continue writing                │              │
│  │  💡  Explain topic                   │              │
│  │  📋  Add summary                     │              │
│  │  📝  Add example                     │              │
│  │                                      │              │
│  │  ✨ ENHANCE                          │              │
│  │  ✨  Improve writing                 │              │
│  │  📏  Make longer                     │              │
│  │  ✂️  Make shorter                    │              │
│  │  ✓   Fix spelling & grammar          │              │
│  │  🔤  Simplify language               │              │
│  │                                      │              │
│  │  🎯 TRANSFORM                        │              │
│  │  🎩  Change tone: Formal             │              │
│  │  😊  Change tone: Casual             │              │
│  │  🌐  Translate                       │              │
│  │                                      │              │
│  │  📊 STRUCTURE                        │              │
│  │  •   Convert to bullet points        │              │
│  │  📊  Create table                    │              │
│  │  📑  Create outline                  │              │
│  │                                      │              │
│  │  🔍 ANALYZE                          │              │
│  │  🎯  Extract key points              │              │
│  │  ❓  Generate questions              │              │
│  │  ✅  Extract action items            │              │
│  │                                      │              │
│  │  ────────────────────────────────    │              │
│  │  🪄  Custom AI prompt...             │              │
│  │                                      │              │
│  │  Press Esc to close                  │              │
│  └──────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
TestPlate
├── Header
│   ├── Title
│   └── Description (with keyboard hint)
│
├── Editor Container
│   ├── Toolbar
│   │   ├── Left Actions
│   │   │   ├── Copy Button
│   │   │   ├── Download Button
│   │   │   └── Custom Prompt Button
│   │   └── Right Actions
│   │       └── AI Assistant Dropdown
│   │           ├── Improve Writing
│   │           ├── Continue Writing
│   │           ├── Summarize
│   │           ├── Make Longer/Shorter
│   │           └── Change Tone Options
│   │
│   ├── Milkdown Editor
│   │   └── (Content area with / trigger)
│   │
│   ├── Slash Menu (conditional)
│   │   ├── Search Input
│   │   ├── Command Categories
│   │   │   ├── GENERATE
│   │   │   ├── ENHANCE
│   │   │   ├── TRANSFORM
│   │   │   ├── STRUCTURE
│   │   │   └── ANALYZE
│   │   ├── Custom Prompt Option
│   │   └── Help Text
│   │
│   └── Loading Overlay (conditional)
│       └── Spinner + Message
│
├── Custom Prompt Dialog (conditional)
│   ├── Title
│   ├── Description
│   ├── Input Field
│   └── Actions (Cancel / Generate)
│
└── Features Section
    ├── Editor Features
    ├── AI Commands
    ├── Quick Actions
    └── Pro Tips
```

## State Flow Diagram

```
┌─────────────┐
│   Initial   │
│   State     │
└──────┬──────┘
       │
       ▼
┌─────────────┐     Type '/'      ┌──────────────┐
│   Editor    │ ─────────────────> │ Slash Menu   │
│   Ready     │                    │   Open       │
└─────────────┘                    └──────┬───────┘
       │                                  │
       │                                  │ Select Command
       │                                  │
       │                           ┌──────▼───────┐
       │                           │   Execute    │
       │                           │   Command    │
       │                           └──────┬───────┘
       │                                  │
       │                           ┌──────▼───────┐
       │                           │  AI Loading  │
       │                           │   Overlay    │
       │                           └──────┬───────┘
       │                                  │
       │                           ┌──────▼───────┐
       │                           │   Content    │
       │                           │   Updated    │
       │                           └──────┬───────┘
       │                                  │
       │                           ┌──────▼───────┐
       │                           │    Toast     │
       │                           │ Notification │
       │                           └──────┬───────┘
       │                                  │
       └──────────────────────────────────┘
```

## Interaction Patterns

### Pattern 1: Quick Command
```
User Action          System Response
───────────         ────────────────
Type '/'        →   Show slash menu
Click command   →   Close menu, show loading
AI processes    →   Loading overlay visible
Complete        →   Update content, show toast
```

### Pattern 2: Search & Execute
```
User Action          System Response
───────────         ────────────────
Type '/'        →   Show slash menu
Type 'improve'  →   Filter to matching commands
Click result    →   Execute command
Wait            →   Loading overlay
Done            →   Content updated
```

### Pattern 3: Custom Prompt
```
User Action          System Response
───────────         ────────────────
Click button    →   Open dialog
Type prompt     →   Enable generate button
Press Enter     →   Close dialog, show loading
AI processes    →   Loading overlay
Complete        →   Insert content, toast
```

### Pattern 4: Cancel
```
User Action          System Response
───────────         ────────────────
Type '/'        →   Show slash menu
Press Esc       →   Close menu
Continue typing →   Normal editing
```

## Responsive Behavior

### Desktop (> 768px)
- Slash menu: 320px width, centered
- Full toolbar visible
- All commands shown
- Hover effects enabled

### Tablet (768px - 1024px)
- Slash menu: 280px width
- Toolbar wraps if needed
- Scrollable command list
- Touch-friendly targets

### Mobile (< 768px)
- Slash menu: Full width - 32px padding
- Toolbar stacks vertically
- Larger touch targets
- Simplified animations

## Accessibility Features

### Keyboard Navigation
- `Tab` - Navigate between elements
- `Enter` - Execute command
- `Esc` - Close menu/dialog
- `/` - Open slash menu
- Arrow keys - Navigate commands (future)

### Screen Reader Support
- Descriptive labels on all buttons
- ARIA roles for menu items
- Status announcements for loading
- Error message announcements

### Visual Indicators
- Focus rings on interactive elements
- Loading spinners
- Color-coded categories
- Icon + text labels

## Animation Timing

```
Slash Menu Open:    150ms ease-out
Slash Menu Close:   100ms ease-in
Loading Overlay:    200ms fade-in
Toast Notification: 300ms slide-in
Command Hover:      100ms ease
```

## Color Scheme

```
Background:     hsl(var(--background))
Foreground:     hsl(var(--foreground))
Border:         hsl(var(--border))
Muted:          hsl(var(--muted))
Accent:         hsl(var(--accent))
Primary:        hsl(var(--primary))
```

## Z-Index Layers

```
Layer 0:  Editor content
Layer 10: Toolbar
Layer 40: Loading overlay
Layer 50: Slash menu
Layer 60: Dialog
Layer 100: Toast notifications
```

## Performance Metrics

Target performance:
- Menu open: < 50ms
- Command execution: < 100ms (UI response)
- AI processing: 2-10s (depends on LLM)
- Animation frame rate: 60fps
- Memory usage: < 50MB additional

---

This structure ensures a smooth, intuitive user experience while maintaining performance and accessibility standards.
