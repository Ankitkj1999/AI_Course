# Course Routes Removal Plan

## Summary

There are approximately **27 course route definitions** in server.js totaling an estimated **2000-2500 lines** of code that need to be removed or migrated.

## Routes to Remove

### 1. POST /api/course (Line ~270)
- **Size**: ~310 lines
- **Function**: Store course with Unsplash integration
- **Replacement**: Use `POST /api/courses` in courseRoutes.js
- **Status**: ⚠️ COMPLEX - Has Unsplash API, diagnostics, logging

### 2. POST /api/courseshared (Line ~582)
- **Size**: ~120 lines  
- **Function**: Store shared course
- **Replacement**: Add to courseRoutes.js or use existing endpoint
- **Status**: ⚠️ MEDIUM

### 3. POST /api/course/convert/:courseId (Line ~703)
- **Size**: ~30 lines
- **Function**: Convert legacy course format
- **Replacement**: Add to courseRoutes.js
- **Status**: ✅ SAFE TO REMOVE

### 4. GET /api/course/architecture/:courseId (Line ~733)
- **Size**: ~50 lines
- **Function**: Get course architecture info
- **Replacement**: Add to courseRoutes.js
- **Status**: ✅ SAFE TO REMOVE

### 5. GET /api/course/stats/:courseId (Line ~785)
- **Size**: ~25 lines
- **Function**: Get course generation stats
- **Replacement**: Use `PUT /api/courses/:id/stats` in courseRoutes.js
- **Status**: ✅ SAFE TO REMOVE

### 6. GET /api/course/:courseId/progress (Line ~908) **DUPLICATE #1**
- **Size**: ~65 lines
- **Function**: Get course progress
- **Replacement**: Keep one, remove duplicate
- **Status**: ⚠️ DUPLICATE - Remove this one, keep line 2936

### 7. GET /api/courses (Line ~1123) **DUPLICATE**
- **Size**: ~80 lines
- **Function**: List courses with pagination
- **Replacement**: Use `GET /api/courses` in courseRoutes.js
- **Status**: ⚠️ DUPLICATE - Already in courseRoutes.js

### 8. POST /api/update (Line ~1067)
- **Size**: ~20 lines
- **Function**: Update course
- **Replacement**: Use `PUT /api/courses/:id` in courseRoutes.js
- **Status**: ✅ SAFE TO REMOVE

### 9. POST /api/deletecourse (Line ~1088)
- **Size**: ~10 lines
- **Function**: Delete course
- **Replacement**: Use `DELETE /api/courses/:id` in courseRoutes.js
- **Status**: ✅ SAFE TO REMOVE

### 10. POST /api/finish (Line ~1096)
- **Size**: ~25 lines
- **Function**: Mark course as finished
- **Replacement**: Add to courseRoutes.js
- **Status**: ✅ SAFE TO REMOVE

### 11. GET /api/shareable (Line ~1204)
- **Size**: ~15 lines
- **Function**: Get shared course
- **Replacement**: Add to courseRoutes.js
- **Status**: ✅ SAFE TO REMOVE

### 12. GET /api/course/:slug (Line ~1221)
- **Size**: ~40 lines
- **Function**: Get course by slug
- **Replacement**: Add to courseRoutes.js
- **Status**: ⚠️ MEDIUM - Important for public access

### 13. GET /api/course/:courseId/content (Line ~1262)
- **Size**: ~115 lines
- **Function**: Get course content with sections
- **Replacement**: Add to courseRoutes.js
- **Status**: ⚠️ COMPLEX

### 14. GET /api/course/id/:id (Line ~1380)
- **Size**: ~40 lines
- **Function**: Get course by ID (legacy)
- **Replacement**: Use `GET /api/courses/:id` in courseRoutes.js
- **Status**: ✅ SAFE TO REMOVE

### 15. POST /api/updateresult (Line ~2881)
- **Size**: ~50 lines
- **Function**: Update exam results
- **Replacement**: Move to learning routes (not course routes)
- **Status**: ⚠️ WRONG MODULE - Should be in learningRoutes

### 16. GET /api/course/:courseId/progress (Line ~2936) **DUPLICATE #2**
- **Size**: ~50 lines
- **Function**: Get course progress
- **Replacement**: Keep this one, remove line 908
- **Status**: ✅ KEEP THIS ONE

### 17. POST /api/course/from-document (Line ~4561)
- **Size**: ~150 lines
- **Function**: Generate course from document
- **Replacement**: Add to courseRoutes.js
- **Status**: ⚠️ COMPLEX

## Removal Strategy

### Phase 1: Remove Safe Duplicates and Simple Routes ✅
Remove routes that have direct replacements in courseRoutes.js:
- POST /api/update → PUT /api/courses/:id
- POST /api/deletecourse → DELETE /api/courses/:id  
- GET /api/course/id/:id → GET /api/courses/:id
- GET /api/courses (duplicate)
- GET /api/course/:courseId/progress (line 908, keep 2936)

**Estimated reduction**: ~200 lines

### Phase 2: Remove Specialized Routes ⚠️
Remove routes that need to be added to courseRoutes.js first:
- POST /api/finish
- GET /api/shareable
- POST /api/course/convert/:courseId
- GET /api/course/architecture/:courseId
- GET /api/course/stats/:courseId

**Estimated reduction**: ~150 lines

### Phase 3: Migrate Complex Routes ⚠️⚠️
These require careful migration:
- POST /api/course (main course creation)
- POST /api/courseshared
- GET /api/course/:slug
- GET /api/course/:courseId/content
- POST /api/course/from-document

**Estimated reduction**: ~750 lines

### Phase 4: Move Misplaced Routes
- POST /api/updateresult → Should be in learningRoutes.js

**Estimated reduction**: ~50 lines

## Risk Assessment

### Low Risk (Safe to Remove Now)
- ✅ POST /api/update
- ✅ POST /api/deletecourse
- ✅ GET /api/course/id/:id
- ✅ GET /api/courses (duplicate)
- ✅ GET /api/course/:courseId/progress (line 908 duplicate)

### Medium Risk (Need Testing)
- ⚠️ POST /api/finish
- ⚠️ GET /api/shareable
- ⚠️ POST /api/course/convert/:courseId
- ⚠️ GET /api/course/architecture/:courseId
- ⚠️ GET /api/course/stats/:courseId
- ⚠️ GET /api/course/:slug

### High Risk (Need Careful Migration)
- ⚠️⚠️ POST /api/course
- ⚠️⚠️ POST /api/courseshared
- ⚠️⚠️ GET /api/course/:courseId/content
- ⚠️⚠️ POST /api/course/from-document

## Recommendation

**Execute Phase 1 Now** - Remove the safe, duplicate routes that have direct replacements. This will:
- Reduce server.js by ~200 lines
- Remove duplicate code
- No risk of breaking functionality
- Modern endpoints already work

**Defer Phases 2-4** - These require:
- Adding routes to courseRoutes.js
- Extensive testing
- Potential frontend updates
- More time and careful validation

## Execution Plan for Phase 1

1. Remove duplicate `GET /api/courses` (line ~1123)
2. Remove duplicate `GET /api/course/:courseId/progress` (line ~908)
3. Remove `POST /api/update` (line ~1067)
4. Remove `POST /api/deletecourse` (line ~1088)
5. Remove `GET /api/course/id/:id` (line ~1380)

Total lines removed: ~200
Risk level: LOW ✅
Testing required: Minimal (modern endpoints already tested)
