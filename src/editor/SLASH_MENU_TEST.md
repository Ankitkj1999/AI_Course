# Slash Menu Test Instructions

## How to Test the Slash Menu

1. **Open the Editor**: Navigate to http://localhost:8081 in your browser
2. **Click in the Editor**: Click inside the editor area to focus it
3. **Type the Slash**: Type `/` character
4. **Verify Menu Appears**: A dropdown menu should appear with options
5. **Test Filtering**: Type additional characters to filter (e.g., `/head` for headings)
6. **Test Navigation**: Use arrow keys to navigate up/down
7. **Test Selection**: Press Enter or click to select an option

## Expected Behavior

### Menu Appearance
- Menu should appear immediately after typing `/`
- Menu should be positioned near the cursor
- Menu should have a white background with shadow
- Icons should be visible for each option

### Available Options (should see these)
- Paragraph
- Heading 1, 2, 3
- Table
- Numbered List
- Bulleted List  
- Check List
- Quote
- Code
- Divider
- Page Break
- Date/Today/Tomorrow/Yesterday
- Equation
- Align options (left, center, right, justify)

### Filtering
- `/head` should show only heading options
- `/list` should show list options
- `/math` or `/equation` should show equation option
- `/table` should show table options

### Dynamic Tables
- `/2x3` should show "2x3 Table" option
- `/5x2` should show "5x2 Table" option

## Troubleshooting

### Menu Not Appearing
- Check browser console for errors
- Verify you're typing `/` in the editor (not address bar)
- Make sure editor has focus (cursor blinking)

### Icons Not Showing
- Check Network tab for 404 errors on icon files
- Icons should load from `/public/icons/` directory

### Commands Not Working
- Check console for command dispatch errors
- Verify plugins are loaded (EquationsPlugin, PageBreakPlugin, etc.)

## Test Cases

1. **Basic Slash Menu**:
   - Type `/` → Menu appears
   - Type `Escape` → Menu disappears

2. **Text Formatting**:
   - Type `/head` → Select "Heading 1" → Should create H1
   - Type `/para` → Select "Paragraph" → Should create paragraph
   - Type `/quote` → Select "Quote" → Should create blockquote

3. **Lists**:
   - Type `/num` → Select "Numbered List" → Should create ordered list
   - Type `/bullet` → Select "Bulleted List" → Should create unordered list
   - Type `/check` → Select "Check List" → Should create checklist

4. **Content Elements**:
   - Type `/table` → Select "Table" → Should insert 2x2 table
   - Type `/3x4` → Select "3x4 Table" → Should insert 3x4 table
   - Type `/div` → Select "Divider" → Should insert horizontal rule
   - Type `/page` → Select "Page Break" → Should insert page break
   - Type `/date` → Select "Date" → Should insert current date
   - Type `/equation` → Select "Equation" → Should insert equation

5. **Alignment**:
   - Type `/center` → Select "Align center" → Should center align
   - Type `/right` → Select "Align right" → Should right align

## Success Criteria

✅ Menu appears on `/` character
✅ All options are visible with icons
✅ Filtering works correctly
✅ Keyboard navigation works (arrows, enter, escape)
✅ Mouse interaction works (hover, click)
✅ Commands execute successfully
✅ Content is inserted correctly
✅ Dynamic table creation works
✅ No console errors