# Visibility Toggle Implementation - TODO

## ✅ Frontend Implementation (COMPLETED)

### Components Created
- ✅ `src/components/CreationVisibilityToggle.tsx` - Reusable visibility toggle component
- ✅ `src/hooks/useVisibilityPreference.ts` - Hook for managing visibility preferences

### Forms Updated
- ✅ `src/components/quiz/QuizCreator.tsx` - Added visibility toggle
- ✅ `src/components/flashcard/FlashcardCreator.tsx` - Added visibility toggle
- ✅ `src/components/guide/GuideCreator.tsx` - Added visibility toggle
- ✅ `src/pages/GenerateCourse.tsx` - Added visibility toggle
- ✅ `src/components/CoursePreview.tsx` - Updated to pass isPublic to API

### Type Definitions Updated
- ✅ `src/types/quiz.ts` - Added `isPublic?: boolean` to CreateQuizRequest
- ✅ `src/types/flashcard.ts` - Added `isPublic?: boolean` to CreateFlashcardRequest
- ✅ `src/types/guide.ts` - Added `isPublic?: boolean` to CreateGuideRequest

### Features Implemented
- ✅ Toggle defaults to public (true)
- ✅ Preferences stored in localStorage per content type
- ✅ Globe icon for public, Lock icon for private
- ✅ Informational tooltip explaining visibility
- ✅ Success messages include visibility status
- ✅ Consistent UI across all content types

## ✅ Backend Implementation (COMPLETED)

### API Endpoints Updated

#### 1. Quiz Creation Endpoint ✅
**File:** `server/server.js` (line ~3899)
**Changes made:**
```javascript
// Accept isPublic in request body
const { userId, keyword, title, format, provider, model, isPublic } = req.body;

// Set isPublic on new quiz document (default to false if not provided)
const quiz = new Quiz({
  userId,
  keyword,
  title,
  format,
  provider,
  model,
  isPublic: isPublic ?? false, // Default to false for backward compatibility
  // ... other fields
});

// Include isPublic in response
res.json({
  success: true,
  quiz: {
    _id: quiz._id,
    slug: quiz.slug,
    title: quiz.title,
    isPublic: quiz.isPublic,
    // ... other fields
  }
});
```

#### 2. Flashcard Creation Endpoint ✅
**File:** `server/server.js` (line ~4203)
**Changes made:**
```javascript
// Accept isPublic in request body
const { userId, keyword, title, provider, model, isPublic } = req.body;

// Set isPublic on new flashcard document
const flashcardSet = new FlashcardSet({
  userId,
  keyword,
  title,
  provider,
  model,
  isPublic: isPublic ?? false,
  // ... other fields
});

// Include isPublic in response
res.json({
  success: true,
  slug: flashcardSet.slug,
  cards: flashcardSet.cards,
  isPublic: flashcardSet.isPublic,
  // ... other fields
});
```

#### 3. Guide Creation Endpoint ✅
**File:** `server/server.js` (line ~4499)
**Changes made:**
```javascript
// Accept isPublic in request body
const { userId, keyword, title, customization, provider, model, isPublic } = req.body;

// Set isPublic on new guide document
const guide = new Guide({
  userId,
  keyword,
  title,
  customization,
  provider,
  model,
  isPublic: isPublic ?? false,
  // ... other fields
});

// Include isPublic in response
res.json({
  success: true,
  slug: guide.slug,
  guide: {
    _id: guide._id,
    title: guide.title,
    isPublic: guide.isPublic,
    // ... other fields
  }
});
```

#### 4. Course Creation Endpoint ✅
**File:** `server/server.js` (line ~1200)
**Changes made:**
```javascript
// Accept isPublic in request body
const { user, content, type, mainTopic, lang, isPublic } = req.body;

// Set isPublic on new course document
const course = new Course({
  user,
  content,
  type,
  mainTopic,
  lang,
  isPublic: isPublic ?? false,
  // ... other fields
});

// Include isPublic in response
res.json({
  success: true,
  courseId: course._id,
  isPublic: course.isPublic,
  // ... other fields
});
```

### Database Schema Updates ✅

The `isPublic` field already exists in all schemas (added in previous migration):

```javascript
// In Quiz schema
isPublic: {
  type: Boolean,
  default: false
}

// In FlashcardSet schema
isPublic: {
  type: Boolean,
  default: false
}

// In Guide schema
isPublic: {
  type: Boolean,
  default: false
}

// In Course schema
isPublic: {
  type: Boolean,
  default: false
}
```

## 🧪 Testing Checklist

### Manual Testing (After Backend Implementation)
- [ ] Create a quiz with public visibility → Verify isPublic=true in database
- [ ] Create a quiz with private visibility → Verify isPublic=false in database
- [ ] Create flashcards with public visibility → Verify isPublic=true in database
- [ ] Create flashcards with private visibility → Verify isPublic=false in database
- [ ] Create a guide with public visibility → Verify isPublic=true in database
- [ ] Create a guide with private visibility → Verify isPublic=false in database
- [ ] Create a course with public visibility → Verify isPublic=true in database
- [ ] Create a course with private visibility → Verify isPublic=false in database
- [ ] Verify preferences are remembered when returning to forms
- [ ] Verify each content type has independent preferences
- [ ] Test with localStorage disabled (should gracefully fallback to default)
- [ ] Test on mobile devices (responsive design)
- [ ] Test with screen reader (accessibility)

### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## 📝 Notes

- Frontend is fully implemented and ready to use
- Backend needs to be updated to accept and store the `isPublic` parameter
- The `isPublic` field defaults to `false` for backward compatibility
- User preferences are stored per content type in localStorage
- Success notifications now include visibility status
- All TypeScript types have been updated

## 🚀 Next Steps

1. Update backend API endpoints to accept `isPublic` parameter
2. Ensure database schemas include `isPublic` field
3. Test the complete flow end-to-end
4. Deploy backend changes
5. Monitor for any issues

### Issues

1: Add a toogle button to change the visibility of the course, on the more three dot icon on the course card.
2: On the `Discover` screen the cards are not showing the correct lable and content. Everything shows the lable as `Guide` we need to show correct lables on the card.
3: Also when we tap on the content card on the the `Discover` screen it tries to redirect on the guide for all regardlless of the type.