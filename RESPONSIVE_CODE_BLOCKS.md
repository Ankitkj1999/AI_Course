# Plan to Make Code Blocks Responsive

The current implementation of code blocks using `shiki` does not adapt well to smaller screen sizes, causing horizontal overflow and breaking the page layout. This plan outlines the steps to make them fully responsive.

## 1. The Problem

- The `shiki`-generated `<pre>` element inside the `CodeBlockContent` component does not wrap long lines of code by default.
- While `overflow-x-auto` is correctly applied to the `CodeBlockContent`, the parent container (`.prose`) in `CoursePage.tsx` might not be correctly constraining the width of its children. This can lead to the code block overflowing the main content area instead of scrolling internally.
- The `.not-prose` class on the `CodeBlock` wrapper is intended to isolate it from the typography styles, but we need to ensure it behaves correctly within the flex/grid layout of the course page.

## 2. The Solution: CSS Adjustments

The solution is to apply specific CSS rules to ensure the code block and its parent containers respect the screen boundaries.

### Step 1: Constrain the Code Block Wrapper

In `CodeBlock.tsx`, the main `div` already has `max-w-full`. We need to ensure this is effective. We will add a global style to ensure that `pre` tags inside our code blocks are handled correctly.

### Step 2: Ensure `.prose` Children Behave

We will add CSS to a global stylesheet (e.g., `src/index.css`) to specifically target the containers rendered by `react-markdown`. This will ensure that any direct children of the `.prose` container that we've wrapped in `.not-prose` (like our code blocks) are properly constrained.

**CSS to add to `src/index.css`:**

```css
/* In src/index.css */

/* Ensure that the container for the code block (.not-prose) 
   does not exceed the width of its parent (.prose). */
.prose .not-prose {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

/* Target the shiki <pre> tag directly to ensure it has the correct display properties */
.prose .not-prose pre {
  display: block;
  width: 100%;
  overflow-x: auto;
  white-space: pre; /* Keep code from wrapping */
}
```

### Step 3: Verify and Test

After applying these styles, we will need to:
1.  Run the application.
2.  Open the developer tools and switch to a mobile view (e.g., iPhone 12/13).
3.  Navigate to a course page with a code block.
4.  Verify that the code block has a horizontal scrollbar and does not cause the entire page to scroll horizontally.
5.  Verify that the rest of the content still looks correct on both mobile and desktop.

## 3. Implementation Plan

1.  **Modify `src/index.css`**: Add the CSS rules specified above to this file.
2.  **No component changes needed initially**: The proposed changes are purely CSS-based and should not require modifications to the React components.
3.  **Testing**: Follow the verification steps to confirm the fix.
