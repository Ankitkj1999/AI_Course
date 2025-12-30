# API Routes Migration Plan

## Current Status Analysis

### Server.js Statistics
- **Total Lines**: 5,931 lines
- **Target**: < 1,000 lines (after migration)
- **Reduction Goal**: ~83% reduction

### Existing Route Files (✅ Already Modular)
1. [`authRoutes.js`](../server/routes/authRoutes.js) - Authentication & user management
2. [`adminRoutes.js`](../server/routes/adminRoutes.js) - Admin operations
3. [`paymentRoutes.js`](../server/routes/paymentRoutes.js) - ✅ **Complete** - All payment providers
4. [`llmRoutes.js`](../server/routes/llmRoutes.js) - ✅ **Complete** - LLM & content generation
5. [`userRoutes.js`](../server/routes/userRoutes.js) - User profile operations
6. [`contentGenerationRoutes.js`](../server/routes/contentGenerationRoutes.js) - Content creation
7. [`utilityRoutes.js`](../server/routes/utilityRoutes.js) - Utility endpoints
8. [`courseRoutes.js`](../server/routes/courseRoutes.js) - ⚠️ **Partial** - Modern course routes
9. [`learningRoutes.js`](../server/routes/learningRoutes.js) - ⚠️ **Incomplete** - Skeleton only

### Routes Still in Server.js (❌ Need Migration)

#### 1. **Learning Content Routes** (~1,200 lines)
**Complexity**: Medium | **Priority**: HIGH | **Target File**: `learningRoutes.js`

- ✅ Quiz Management (3 routes)
  - `POST /api/quiz/create` (lines 3218-3368)
  - `GET /api/quizzes` (lines 3370-3418)
  - `GET /api/quiz/:slug` (lines 3420-3466)
  - `GET /api/quiz/id/:id` (lines 3468-3512)
  - `DELETE /api/quiz/:slug` (lines 3514-3552)

- ✅ Flashcard Management (4 routes)
  - `POST /api/flashcard/create` (lines 3554-3729)
  - `GET /api/flashcards` (lines 3731-3789)
  - `GET /api/flashcard/:slug` (lines 3791-3835)
  - `DELETE /api/flashcard/:slug` (lines 3837-3877)

- ✅ Guide Management (5 routes)
  - `POST /api/guide/create` (lines 3879-4156)
  - `GET /api/guides` (lines 4168-4217)
  - `GET /api/guide/:slug` (lines 4219-4263)
  - `DELETE /api/guide/:slug` (lines 4265-4305)
  - `PATCH /api/guide/:slug` (lines 4307-4348)

- ✅ Notes & Exam (4 routes)
  - `POST /api/getnotes` (lines 2748-2762)
  - `POST /api/savenotes` (lines 2764-2785)
  - `POST /api/aiexam` (lines 2787-2882)
  - `POST /api/updateresult` (lines 2884-2901)
  - `POST /api/sendexammail` (lines 2903-2933)
  - `GET /api/course/:courseId/progress` (lines 2935-2990)
  - `POST /api/getmyresult` (lines 2992-3029) - DEPRECATED

**Dependencies**: Quiz, Flashcard, Guide, Notes, Exam models, llmService, logger, unsplash

---

#### 2. **Document Processing Routes** (~790 lines)
**Complexity**: High | **Priority**: HIGH | **Target**: `documentRoutes.js` (new file)

- ✅ Document Upload & Extraction (4 routes)
  - `POST /api/document/upload` (lines 4353-4417)
  - `POST /api/document/extract-url` (lines 4420-4467)
  - `GET /api/document/status/:id` (lines 4470-4509)
  - `GET /api/document/text/:id` (lines 4512-4556)

- ✅ Content Generation from Documents (4 routes)
  - `POST /api/course/from-document` (lines 4561-4748)
  - `POST /api/quiz/from-document` (lines 4750-4940)
  - `POST /api/flashcard/from-document` (lines 4942-5125)
  - `POST /api/guide/from-document` (lines 5127-5284)

**Dependencies**: DocumentProcessing model, llmService, unsplash, Course/Quiz/Flashcard/Guide models

---

#### 3. **Visibility & Public Content Routes** (~430 lines)
**Complexity**: Medium | **Priority**: MEDIUM | **Target**: `publicContentRoutes.js` (new file)

- ✅ Visibility Management (2 routes)
  - `PATCH /api/:contentType/:slug/visibility` (lines 5300-5373)
  - `GET /api/:contentType/:slug/visibility` (lines 5376-5429)

- ✅ Public Content Discovery (3 routes)
  - `GET /api/public/content` (lines 5434-5563)
  - `GET /api/public/:contentType` (lines 5566-5666)
  - `GET /api/public/:contentType/:slug` (lines 5669-5730)

- ✅ Fork Functionality (1 route)
  - `POST /api/:contentType/:slug/fork` (lines 5735-5839)

**Dependencies**: Course, Quiz, Flashcard, Guide models

---

#### 4. **Legacy Course Routes** (~800 lines)
**Complexity**: High | **Priority**: HIGH | **Target**: `courseRoutes.js` (consolidate)

- ✅ Course CRUD Operations
  - `POST /api/course` (lines 270-579) - Main course creation
  - `POST /api/courseshared` (lines 581-700) - Shared course creation
  - `POST /api/course/convert/:courseId` (lines 702-730)
  - `GET /api/course/architecture/:courseId` (lines 732-782)
  - `GET /api/course/stats/:courseId` (lines 784-807)
  - `POST /api/update` (lines 1068-1086)
  - `POST /api/deletecourse` (lines 1088-1098)
  - `POST /api/finish` (lines 1100-1120)
  - `GET /api/courses` (lines 1123-1202)
  - `GET /api/shareable` (lines 1204-1218)
  - `GET /api/course/:slug` (lines 1220-1259)
  - `GET /api/course/:courseId/content` (lines 1262-1377)
  - `GET /api/course/id/:id` (lines 1379-1416)
  - `GET /api/seo/course/:slug` (lines 1418-1448)

- ✅ Section Operations
  - `POST /api/sections/:sectionId/content` (lines 809-905)
  - `GET /api/course/:courseId/progress` (lines 907-973)
  - `GET /api/v2/courses/:courseId/hierarchy` (lines 975-1065)

**Dependencies**: Course, Section, Language models, CourseGenerationService, unsplash

---

#### 5. **Miscellaneous Routes** (~200 lines)
**Complexity**: Low | **Priority**: LOW | **Target**: Various files

- ✅ Profile Management
  - `POST /api/profile` (lines 1450-1485) → `userRoutes.js`

- ✅ Contact & Blog
  - `POST /api/contact` (lines 2268-2279) → `utilityRoutes.js`
  - `GET /api/blogs/public` (lines 3053-3063) → `adminRoutes.js`

- ✅ Settings
  - `GET /api/public/settings` (lines 2284-2302) → `utilityRoutes.js`

- ✅ User Deletion
  - `POST /api/deleteuser` (lines 3031-3049) → `userRoutes.js`

---

## Migration Strategy

### Phase 1: High-Impact Routes (Week 1)
**Goal**: Migrate 60% of code (~3,500 lines)**

1. **✅ Create documentRoutes.js** (~800 lines)
   - All document processing endpoints
   - Document-to-content generation
   - Requires: DocumentProcessing model, llmService

2. **✅ Complete learningRoutes.js** (~1,200 lines)
   - Quiz, Flashcard, Guide CRUD
   - Notes and Exam operations
   - Requires: Quiz, Flashcard, Guide, Notes, Exam models

3. **✅ Consolidate courseRoutes.js** (~800 lines)
   - Remove duplicate routes from server.js
   - Keep only modern RESTful endpoints
   - Maintain backward compatibility with redirects

### Phase 2: Medium-Impact Routes (Week 2)
**Goal**: Migrate 25% of code (~1,500 lines)**

4. **✅ Create publicContentRoutes.js** (~430 lines)
   - Visibility management
   - Public content discovery
   - Fork functionality

5. **✅ Distribute miscellaneous routes** (~200 lines)
   - Move profile to userRoutes.js
   - Move contact/settings to utilityRoutes.js
   - Move blog endpoints to adminRoutes.js

### Phase 3: Cleanup & Testing (Week 3)
**Goal**: Final cleanup and verification**

6. **✅ Clean up server.js**
   - Remove all migrated code
   - Keep only core setup and mounting
   - Target: < 1,000 lines

7. **✅ Test all endpoints**
   - Verify backward compatibility
   - Test all existing integrations
   - Performance testing

8. **✅ Update documentation**
   - API reference
   - Integration guides
   - Migration notes

---

## Dependency Analysis

### Shared Dependencies (Must be accessible to all route files)

#### Services
- `llmService` - AI content generation (used by: learning, document, course routes)
- `CourseGenerationService` - Course creation logic
- `SectionService` - Section management
- `ContentConverter` - Format conversion
- `ContentManager` - Content operations

#### Models
- `Course`, `Section`, `Language` (course routes)
- `Quiz`, `Flashcard`, `Guide` (learning routes)
- `Notes`, `Exam` (learning routes)
- `DocumentProcessing` (document routes)
- `User`, `Admin`, `Subscription` (all routes)

#### Middleware
- `requireAuth` - Authentication
- `optionalAuth` - Optional authentication
- `requireAdmin` - Admin access
- `uploadSingle` - File upload

#### Utilities
- `logger` - Logging service
- `unsplash` - Image API
- `generateUniqueSlug` - Slug generation
- `extractTitleFromContent` - Title extraction
- `safeGet`, `safeGetFirst`, `safeGetArray` - Safe access utilities

### Injection Pattern (Recommended)

All route files should use **dependency injection** pattern like [`llmRoutes.js`](../server/routes/llmRoutes.js:23-27):

```javascript
// Dependencies will be injected
let requireAuth, logger, llmService, Course, Quiz;

// Initialize function to inject dependencies
export function initializeRoutes(dependencies) {
  requireAuth = dependencies.requireAuth;
  logger = dependencies.logger;
  llmService = dependencies.llmService;
  Course = dependencies.Course;
  Quiz = dependencies.Quiz;
}
```

**Benefits**:
- Clean separation of concerns
- Easy testing (mock dependencies)
- No circular dependency issues
- Clear dependency documentation

---

## File Structure After Migration

```
server/
├── server.js (< 1,000 lines) ✅ CORE ONLY
│   ├── Setup & configuration
│   ├── Database connection
│   ├── Route mounting
│   └── Error handling
│
├── routes/
│   ├── authRoutes.js ✅ COMPLETE
│   ├── adminRoutes.js ✅ COMPLETE
│   ├── paymentRoutes.js ✅ COMPLETE (~720 lines)
│   ├── llmRoutes.js ✅ COMPLETE (~642 lines)
│   ├── userRoutes.js ✅ COMPLETE
│   ├── utilityRoutes.js ✅ COMPLETE
│   │
│   ├── courseRoutes.js ⚠️ CONSOLIDATE
│   │   └── All course operations (create, update, delete, list, get)
│   │
│   ├── learningRoutes.js ❌ INCOMPLETE → ✅ MIGRATE
│   │   ├── Quiz operations
│   │   ├── Flashcard operations
│   │   ├── Guide operations
│   │   ├── Notes operations
│   │   └── Exam operations
│   │
│   ├── documentRoutes.js ❌ NEW → ✅ CREATE
│   │   ├── Document upload & extraction
│   │   └── Document-to-content generation
│   │
│   ├── publicContentRoutes.js ❌ NEW → ✅ CREATE
│   │   ├── Visibility management
│   │   ├── Public content discovery
│   │   └── Fork functionality
│   │
│   └── contentRoutes.js ✅ COMPLETE (content management)
│
└── services/
    ├── llmService.js
    ├── courseGenerationService.js
    ├── sectionService.js
    ├── contentConverter.js
    └── documentExtraction.js
```

---

## Testing Checklist

### Before Migration
- [ ] Document all endpoints in server.js
- [ ] Create test suite for critical paths
- [ ] Backup current server.js
- [ ] Set up staging environment

### During Migration
- [ ] Test each migrated endpoint individually
- [ ] Verify dependency injection works
- [ ] Check authentication/authorization
- [ ] Test error handling

### After Migration
- [ ] Run full regression test suite
- [ ] Performance comparison (before/after)
- [ ] Frontend integration testing
- [ ] Load testing for high-traffic routes
- [ ] Review logs for any issues

---

## Risk Mitigation

### High-Risk Areas

1. **Course Creation Flow**
   - Complex Unsplash integration
   - Multiple service dependencies
   - **Mitigation**: Thorough unit tests, staging deployment

2. **Document Processing**
   - File upload handling
   - Async processing
   - **Mitigation**: File size limits, timeout handling, cleanup jobs

3. **LLM Integration**
   - Multiple provider fallbacks
   - Rate limiting
   - **Mitigation**: Already well-abstracted in llmService

4. **Payment Webhooks**
   - Already migrated ✅
   - Must maintain backward compatibility

### Backward Compatibility Strategy

1. **Route Aliases**: Keep old routes pointing to new handlers
2. **Deprecation Headers**: Add `X-Deprecated` headers with migration path
3. **Logging**: Track usage of old endpoints
4. **Documentation**: Clear migration guide for frontend team

---

## Success Metrics

- [ ] Server.js reduced to < 1,000 lines (from 5,931)
- [ ] All tests passing
- [ ] No increase in response times
- [ ] Zero breaking changes for existing clients
- [ ] Clear documentation for all new route files
- [ ] 100% endpoint coverage in tests

---

## Timeline Estimate

- **Week 1**: Phase 1 - High-impact routes (documentRoutes, learningRoutes, courseRoutes)
- **Week 2**: Phase 2 - Medium-impact routes (publicContentRoutes, miscellaneous)
- **Week 3**: Phase 3 - Cleanup, testing, documentation
- **Week 4**: Buffer for issues, performance tuning, deployment

**Total Estimate**: 3-4 weeks for complete migration

---

## Next Steps

1. Review this plan with the team
2. Get approval for breaking down into phases
3. Set up feature branch for migration work
4. Start with Phase 1 - documentRoutes.js (highest value, clear boundaries)
5. Implement continuous testing throughout migration
