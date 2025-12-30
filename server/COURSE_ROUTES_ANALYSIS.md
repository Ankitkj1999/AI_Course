# Course Routes Analysis

## Current State

### Existing courseRoutes.js Module
- **Status**: EXISTS but NOT REGISTERED in server.js
- **Size**: 11KB
- **Routes**: 12 modern RESTful routes
- **Architecture**: Uses CourseService and SectionService

### Routes in courseRoutes.js (NOT ACTIVE)
1. `POST /api/courses` - Create course
2. `GET /api/courses/:id` - Get single course
3. `PUT /api/courses/:id` - Update course
4. `DELETE /api/courses/:id` - Delete course
5. `POST /api/courses/:id/fork` - Fork course
6. `GET /api/courses` - List courses with filtering
7. `PUT /api/courses/:id/visibility` - Update visibility
8. `PUT /api/courses/:id/stats` - Update stats
9. `GET /api/courses/:id/analytics` - Get analytics
10. `GET /api/courses/:id/hierarchy` - Get hierarchy
11. `POST /api/courses/:id/validate-hierarchy` - Validate hierarchy

### Routes Still in server.js (ACTIVE)
1. `POST /api/course` - Store course (legacy)
2. `POST /api/courseshared` - Store shared course
3. `POST /api/course/convert/:courseId` - Convert legacy course
4. `GET /api/course/architecture/:courseId` - Get architecture
5. `GET /api/course/stats/:courseId` - Get stats
6. `GET /api/course/:courseId/progress` - Get progress (duplicate!)
7. `POST /api/update` - Update course (legacy)
8. `POST /api/deletecourse` - Delete course (legacy)
9. `POST /api/finish` - Finish course
10. `GET /api/courses` - Get courses list (duplicate!)
11. `GET /api/shareable` - Get shared course
12. `GET /api/course/:slug` - Get course by slug
13. `GET /api/course/:courseId/content` - Get course content
14. `GET /api/course/id/:id` - Get course by ID (legacy)
15. `POST /api/updateresult` - Update result
16. `GET /api/course/:courseId/progress` - Get progress (duplicate!)
17. `POST /api/course/from-document` - Generate from document

## Issues Found

### 1. Unused Module
- courseRoutes.js exists but is never imported or registered
- Modern RESTful routes are not being used
- Legacy routes in server.js are still active

### 2. Duplicate Routes
- `/api/courses` - Exists in both files
- `/api/course/:courseId/progress` - Defined twice in server.js!

### 3. Inconsistent Naming
- Legacy: `/api/course` (singular)
- Modern: `/api/courses` (plural, RESTful)
- Legacy: `/api/deletecourse` (verb in path)
- Modern: `DELETE /api/courses/:id` (HTTP verb)

## Migration Strategy

### Option 1: Use Existing courseRoutes.js (Recommended)
1. Register the existing courseRoutes.js
2. Migrate remaining routes from server.js to courseRoutes.js
3. Update frontend to use new RESTful endpoints (if needed)
4. Keep legacy routes for backward compatibility (temporarily)

### Option 2: Consolidate Everything
1. Move all course routes from server.js to courseRoutes.js
2. Keep both legacy and modern endpoints
3. Gradually deprecate legacy endpoints

## Recommendation

**Use Option 1** - The existing courseRoutes.js is well-structured with:
- Modern RESTful design
- Proper validation middleware
- Service layer separation
- Good error handling

We should:
1. Register courseRoutes.js
2. Add missing routes to it
3. Keep legacy routes for backward compatibility
4. Document the migration path for frontend

## Routes to Add to courseRoutes.js

### High Priority (Core Functionality)
- `POST /api/course` → Map to existing `POST /api/courses`
- `GET /api/course/:slug` → Add slug lookup
- `GET /api/course/:courseId/content` → Add content endpoint
- `POST /api/course/from-document` → Add document generation

### Medium Priority (Legacy Support)
- `POST /api/courseshared` → Add shared course creation
- `POST /api/update` → Map to existing `PUT /api/courses/:id`
- `POST /api/deletecourse` → Map to existing `DELETE /api/courses/:id`
- `POST /api/finish` → Add finish endpoint
- `GET /api/shareable` → Add shareable lookup

### Low Priority (Specialized)
- `POST /api/course/convert/:courseId` → Add conversion
- `GET /api/course/architecture/:courseId` → Add architecture
- `GET /api/course/stats/:courseId` → Map to existing stats endpoint
- `GET /api/course/:courseId/progress` → Add progress tracking
- `POST /api/updateresult` → Add result update
- `GET /api/course/id/:id` → Map to existing `GET /api/courses/:id`

## Next Steps

1. Import and register courseRoutes.js in server.js
2. Add missing routes to courseRoutes.js
3. Test that both old and new endpoints work
4. Document the migration for frontend team
5. Remove old routes from server.js once frontend is updated
