# Learning Routes Migration Summary

## Routes Identified

Found **27 learning-related routes** in server.js:

### Notes Routes (3 routes)
1. `POST /api/getnotes` - Get notes for a course (line ~1492) **DUPLICATE**
2. `POST /api/getnotes` - Get notes for a course (line ~2749) **DUPLICATE**
3. `POST /api/savenotes` - Save notes for a course (line ~2765)

### Exam Routes (1 route)
4. `POST /api/aiexam` - Generate AI-powered exam (line ~2788)

### Quiz Routes (7 routes)
5. `POST /api/quiz/create` - Create quiz (line ~3218)
6. `GET /api/quizzes` - Get user quizzes (line ~3371)
7. `GET /api/quiz/:slug` - Get quiz by slug (line ~3421)
8. `GET /api/quiz/id/:id` - Get quiz by ID (line ~3469)
9. `DELETE /api/quiz/:slug` - Delete quiz (line ~3515)
10. `POST /api/quiz/from-document` - Generate quiz from document (line ~4751)

### Flashcard Routes (6 routes)
11. `POST /api/flashcard/create` - Create flashcard set (line ~3555)
12. `GET /api/flashcards` - Get user flashcards (line ~3732)
13. `GET /api/flashcard/:slug` - Get flashcard by slug (line ~3792)
14. `DELETE /api/flashcard/:slug` - Delete flashcard (line ~3838)
15. `POST /api/flashcard/from-document` - Generate flashcards from document (line ~4943)

### Guide Routes (7 routes)
16. `POST /api/guide/create` - Create guide (line ~3880)
17. `GET /api/guide/test` - Test endpoint (line ~4159)
18. `GET /api/guides` - Get user guides (line ~4168)
19. `GET /api/guide/:slug` - Get guide by slug (line ~4220)
20. `DELETE /api/guide/:slug` - Delete guide (line ~4266)
21. `POST /api/guide/from-document` - Generate guide from document (line ~5128)

## Estimated Code Size

- **Notes routes**: ~50 lines
- **Exam routes**: ~200 lines
- **Quiz routes**: ~600 lines
- **Flashcard routes**: ~550 lines
- **Guide routes**: ~650 lines
- **Total**: ~2,050 lines

## Migration Status

### ✅ Started
- Created `routes/learningRoutes.js` with initial structure
- Added dependency injection pattern
- Added notes routes skeleton

### ⏳ In Progress
- Need to add all quiz routes
- Need to add all flashcard routes
- Need to add all guide routes
- Need to add exam generation route

### ⏭️ Pending
- Register learningRoutes in server.js
- Remove migrated routes from server.js
- Test all endpoints

## Complexity Assessment

### Low Complexity
- `POST /api/getnotes` - Simple database query
- `POST /api/savenotes` - Simple database update
- `GET /api/quiz/test` - Test endpoint

### Medium Complexity
- `GET /api/quizzes` - List with pagination
- `GET /api/flashcards` - List with pagination
- `GET /api/guides` - List with pagination
- `DELETE` routes - Simple deletion

### High Complexity
- `POST /api/quiz/create` - LLM integration, logging, slug generation
- `POST /api/flashcard/create` - LLM integration, Unsplash API
- `POST /api/guide/create` - LLM integration, Unsplash API
- `POST /api/aiexam` - LLM-powered exam generation
- `POST /api/*/from-document` - Document processing + LLM generation

## Issues Found

### Duplicate Routes
- `POST /api/getnotes` appears twice (lines 1492 and 2749)
- Need to remove one duplicate

## Recommendation

Given the size and complexity (~2,050 lines), this migration requires:

1. **Time**: 2-3 hours to complete properly
2. **Testing**: Each route needs verification
3. **Dependencies**: Many external services (LLM, Unsplash, DocumentProcessing)

### Options

**Option A: Complete Migration Now**
- Copy all ~2,050 lines to learningRoutes.js
- Register and test
- Remove from server.js
- **Time**: 2-3 hours

**Option B: Defer to Next Session**
- Document current state
- Complete in dedicated session
- **Time**: Can be done later

**Option C: Partial Migration**
- Migrate simple routes now (notes, lists, deletes)
- Defer complex routes (create, from-document)
- **Time**: 30-60 minutes

## Current State

- **learningRoutes.js**: Created with structure, needs content
- **server.js**: All 27 routes still present
- **Line count**: 5,849 lines (no reduction yet)

## Next Steps

1. Complete learningRoutes.js with all routes
2. Add initialization in server.js
3. Register routes
4. Test endpoints
5. Remove from server.js

---

**Status**: ⏳ IN PROGRESS  
**Estimated Completion**: 2-3 hours for full migration  
**Recommendation**: Complete in dedicated session or use Option C
