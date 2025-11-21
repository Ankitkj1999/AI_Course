# Discover Page Fixes ✅

## Issues Fixed

### Issue 1: All Cards Showing "Guide" Label
**Problem:** All content cards on the Discover page were showing "Guide" as the content type, regardless of the actual content type.

**Root Cause:** The `getContentType` function was using property detection to determine content type, but it was checking for properties that don't exist or aren't unique enough. It always fell through to the default `return 'guide'` at the end.

**Solution:** 
1. Updated `getContentType` to first check for the `contentType` field that the backend adds to each item
2. Improved the fallback property detection logic
3. Added proper type checking for each content type

```typescript
// Before
const getContentType = (content: ContentItem): ContentType => {
  if ('questions' in content) return 'quiz';
  if ('cards' in content) return 'flashcard';
  if ('sections' in content && 'modules' in content) return 'course';
  return 'guide'; // Always defaulted to guide
};

// After
const getContentType = (content: ContentItem & { contentType?: ContentType }): ContentType => {
  // Use the contentType field added by the backend
  if (content.contentType) {
    return content.contentType;
  }
  
  // Fallback to property detection
  if ('questionAndAnswers' in content) return 'quiz';
  if ('cards' in content) return 'flashcard';
  if ('mainTopic' in content && 'type' in content) return 'course';
  return 'guide';
};
```

### Issue 2: All Cards Redirecting to Guide Routes
**Problem:** Clicking on any content card would redirect to `/guide/:slug`, regardless of the actual content type.

**Root Cause:** The navigation was using the wrong type because `getContentType` was always returning 'guide'. Additionally, courses use `_id` in their routes instead of `slug`.

**Solution:**
1. Fixed `getContentType` to return the correct type (see above)
2. Updated navigation to handle courses differently (they use `_id` instead of `slug`)

```typescript
// Before
const handleContentClick = (content: ContentItem) => {
  const type = getContentType(content);
  const slug = content.slug;
  navigate(`/${type}/${slug}`); // Wrong for courses
};

// After
const handleContentClick = (content: ContentItem & { contentType?: ContentType }) => {
  const type = getContentType(content);
  
  // Course uses _id instead of slug in the route
  if (type === 'course') {
    navigate(`/course/${content._id}`);
  } else {
    navigate(`/${type}/${content.slug}`);
  }
};
```

### Issue 3: TypeScript Errors with Course Properties
**Problem:** TypeScript errors because Course has different property names (`mainTopic` instead of `title`, no `keyword` field).

**Solution:** Created helper functions to get the correct display values for each content type:

```typescript
// Get display title for content item
const getContentTitle = (content: ContentItem): string => {
  if ('mainTopic' in content) {
    return content.mainTopic; // Course
  }
  return content.title; // Quiz, Flashcard, Guide
};

// Get display description for content item
const getContentDescription = (content: ContentItem): string => {
  if ('mainTopic' in content && 'type' in content) {
    return content.type; // Course type (e.g., "Text & Image Course")
  }
  return content.keyword || 'No description available';
};
```

## What Now Works

✅ **Correct Labels:** Each card now shows the correct content type badge:
- 📘 Course (blue)
- 🧠 Quiz (purple)
- 📚 Flashcard (green)
- 📄 Guide (orange)

✅ **Correct Navigation:** Clicking on a card now navigates to the correct viewer:
- Courses → `/course/:id`
- Quizzes → `/quiz/:slug`
- Flashcards → `/flashcard/:slug`
- Guides → `/guide/:slug`

✅ **Correct Titles:** Each card displays the appropriate title:
- Courses show `mainTopic`
- Others show `title`

✅ **Correct Descriptions:** Each card displays the appropriate description:
- Courses show their `type` (e.g., "Text & Image Course")
- Others show their `keyword`

## Files Modified

- `src/components/PublicContentBrowser.tsx` - Fixed content type detection, navigation, and display helpers

## Testing Checklist

- [ ] Navigate to `/discover` page
- [ ] Verify course cards show "Course" badge (blue)
- [ ] Verify quiz cards show "Quiz" badge (purple)
- [ ] Verify flashcard cards show "Flashcard" badge (green)
- [ ] Verify guide cards show "Guide" badge (orange)
- [ ] Click on a course card → Should navigate to `/course/:id`
- [ ] Click on a quiz card → Should navigate to `/quiz/:slug`
- [ ] Click on a flashcard card → Should navigate to `/flashcard/:slug`
- [ ] Click on a guide card → Should navigate to `/guide/:slug`
- [ ] Verify course cards show the course topic as title
- [ ] Verify course cards show the course type as description
- [ ] Test with different content type filters
- [ ] Test search functionality
- [ ] Test sorting options

## Backend Context

The backend endpoint `/api/public/content` adds a `contentType` field to each item:

```javascript
// Backend adds this field (server/server.js line ~5106)
return items.map(item => ({
  ...item,
  contentType: type, // 'course', 'quiz', 'flashcard', or 'guide'
  createdAt: item.createdAt || item.date
}));
```

This field is now being used by the frontend to correctly identify content types.
