# API Migration Quick Reference

## 🎯 Quick Start Guide

### Priority Order (Recommended)
1. **publicContentRoutes.js** - EASIEST - Start here for confidence
2. **learningRoutes.js** - MEDIUM - Good learning experience  
3. **documentRoutes.js** - COMPLEX - Requires careful handling
4. **courseRoutes.js consolidation** - CRITICAL - Most risky, test thoroughly
5. **Miscellaneous distribution** - EASY - Final cleanup

---

## 📋 Pre-Migration Checklist

Before migrating any route file:
- [ ] Create feature branch: `git checkout -b api-migration-<route-name>`
- [ ] Backup current server.js
- [ ] Review dependency requirements in dependency-map.md
- [ ] Create test file: `tests/routes/<route-name>.test.js`
- [ ] Set up staging environment for testing

---

## 🔧 Migration Template

### Step 1: Create Route File Structure
```javascript
/**
 * <Route Name> Routes
 * 
 * Description of what this module handles
 */

import express from 'express';
const router = express.Router();

// Dependencies (to be injected or imported)
let requireAuth, optionalAuth, logger;
let Model1, Model2, Service1;

// Initialize function (if using dependency injection)
export function initializeRoutes(dependencies) {
  requireAuth = dependencies.requireAuth;
  optionalAuth = dependencies.optionalAuth;
  logger = dependencies.logger;
  Model1 = dependencies.Model1;
  Model2 = dependencies.Model2;
  Service1 = dependencies.Service1;
}

// ============================================================================
// ROUTE GROUP 1
// ============================================================================

/**
 * POST /api/endpoint
 * Description of what this does
 */
router.post('/endpoint', requireAuth, async (req, res) => {
  try {
    // Implementation
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`Error: ${error.message}`, { error: error.stack });
    res.status(500).json({ success: false, message: 'Error message' });
  }
});

export default router;
```

### Step 2: Copy Routes from server.js
1. Find route in server.js (use line numbers from migration plan)
2. Copy entire handler function
3. Paste into new route file
4. Update any local variables to use injected dependencies

### Step 3: Update server.js
```javascript
// In server.js imports section
import routeName, { initializeRouteName } from './routes/routeNameRoutes.js';

// In initialization section (before app.listen)
initializeRouteName({
  requireAuth,
  optionalAuth,
  logger,
  Model1,
  Model2,
  Service1
});

// Mount routes
app.use('/api', routeName);
```

### Step 4: Comment Out Original Routes
```javascript
// In server.js - DO NOT DELETE YET, just comment out
// app.post('/api/endpoint', requireAuth, async (req, res) => {
//   ... original implementation ...
// });
```

### Step 5: Test
```bash
# Start server
npm run dev

# Test endpoint
curl -X POST http://localhost:5000/api/endpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"test": "data"}'

# Run tests
npm test -- routes/routeName.test.js
```

### Step 6: Clean Up
After successful testing:
1. Remove commented code from server.js
2. Update line count tracking
3. Commit changes
4. Move to next route

---

## 📊 Route Migration Checklist Template

```markdown
## <Route File Name> Migration

### Routes to Migrate
- [ ] Route 1: `METHOD /path` (lines X-Y)
- [ ] Route 2: `METHOD /path` (lines X-Y)
- [ ] Route 3: `METHOD /path` (lines X-Y)

### Dependencies Required
- [ ] Dependency 1
- [ ] Dependency 2
- [ ] Dependency 3

### Testing
- [ ] Unit tests written
- [ ] Integration tests pass
- [ ] Manual testing complete
- [ ] Backward compatibility verified

### Documentation
- [ ] JSDoc comments added
- [ ] README updated
- [ ] API docs updated

### Cleanup
- [ ] Original code removed from server.js
- [ ] No duplicate routes remain
- [ ] Error handling verified
- [ ] Logging added
```

---

## 🚀 Implementation Examples

### Example 1: Simple Route Migration (publicContentRoutes.js)

**From server.js (lines 5434-5563):**
```javascript
app.get("/api/public/content", optionalAuth, async (req, res) => {
  // ... implementation ...
});
```

**To publicContentRoutes.js:**
```javascript
import express from 'express';
import { Course, Quiz, Flashcard, Guide } from '../models/index.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/public/content
 * Get unified public content endpoint
 */
router.get('/public/content', optionalAuth, async (req, res) => {
  try {
    // ... implementation (copy from server.js) ...
  } catch (error) {
    logger.error(`Get public content error: ${error.message}`, {
      error: error.stack,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve public content'
    });
  }
});

export default router;
```

**In server.js:**
```javascript
import publicContentRoutes from './routes/publicContentRoutes.js';
app.use('/api', publicContentRoutes);
```

---

### Example 2: Complex Route with Dependency Injection (learningRoutes.js)

**Structure:**
```javascript
import express from 'express';
const router = express.Router();

// Dependencies to inject
let requireAuth, optionalAuth, logger, llmService;
let Quiz, Flashcard, Guide, Notes, Exam;
let unsplash, generateUniqueSlug, extractTitleFromContent;

// Initialization function
export function initializeLearningRoutes(deps) {
  requireAuth = deps.requireAuth;
  optionalAuth = deps.optionalAuth;
  logger = deps.logger;
  llmService = deps.llmService;
  Quiz = deps.Quiz;
  Flashcard = deps.Flashcard;
  Guide = deps.Guide;
  Notes = deps.Notes;
  Exam = deps.Exam;
  unsplash = deps.unsplash;
  generateUniqueSlug = deps.generateUniqueSlug;
  extractTitleFromContent = deps.extractTitleFromContent;
}

// Routes use injected dependencies
router.post('/quiz/create', requireAuth, async (req, res) => {
  // Use injected dependencies: logger, llmService, Quiz, etc.
});

export default router;
```

**In server.js:**
```javascript
import learningRoutes, { initializeLearningRoutes } from './routes/learningRoutes.js';

// Initialize with dependencies
initializeLearningRoutes({
  requireAuth,
  optionalAuth,
  logger,
  llmService,
  Quiz,
  Flashcard,
  Guide,
  Notes,
  Exam,
  unsplash,
  generateUniqueSlug,
  extractTitleFromContent
});

// Mount routes
app.use('/api', learningRoutes);
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "X is not defined"
**Cause**: Dependency not injected or imported
**Solution**: Add to initialization function or import statement

### Issue 2: "Cannot read property of undefined"
**Cause**: Initialization function not called in server.js
**Solution**: Ensure `initializeRoutes()` is called before mounting

### Issue 3: Routes not responding
**Cause**: Wrong base path or mounting order
**Solution**: Check `app.use('/api', routes)` order in server.js

### Issue 4: Tests failing
**Cause**: Test mocks not updated for new structure
**Solution**: Update test file to mock injected dependencies

### Issue 5: Circular dependency
**Cause**: Route imports service that imports route
**Solution**: Use dependency injection to break the cycle

---

## 📏 Code Quality Standards

### Required for Each Route File
1. **Documentation**
   - File header with description
   - JSDoc for each route
   - Parameter descriptions
   - Response format examples

2. **Error Handling**
   - Try-catch blocks
   - Appropriate status codes
   - Logged errors with context
   - User-friendly error messages

3. **Validation**
   - Input validation
   - Authentication checks
   - Authorization checks
   - Type checking

4. **Logging**
   - Request start (with context)
   - Success completion
   - Error details
   - Performance metrics

5. **Testing**
   - Unit test for each route
   - Integration test for workflows
   - Edge case coverage
   - Mock external dependencies

---

## 📈 Progress Tracking

### Track in Each PR
```markdown
## Migration Progress

### Metrics
- Lines migrated: XXX
- Routes migrated: XX
- server.js before: 5,931 lines
- server.js after: XXXX lines
- Reduction: XX%

### Tests
- Unit tests: XX/XX passing
- Integration tests: XX/XX passing
- Coverage: XX%

### Performance
- Response time: No regression
- Memory usage: No regression
- Error rate: 0%
```

---

## 🎬 Implementation Order

### Week 1: Foundation
**Monday-Tuesday**: publicContentRoutes.js
- Simplest file to build confidence
- Clear boundaries
- ~430 lines, 6 routes

**Wednesday-Thursday**: learningRoutes.js (partial)
- Migrate Quiz routes first
- Then Flashcard routes
- ~600 lines migrated

**Friday**: Testing & Documentation
- Integration tests
- Update docs
- Code review

### Week 2: Main Migration
**Monday-Tuesday**: learningRoutes.js (complete)
- Guide routes
- Notes & Exam routes
- ~600 lines migrated

**Wednesday-Thursday**: documentRoutes.js
- Document processing
- Document-to-content generation
- ~800 lines

**Friday**: Testing & Documentation

### Week 3: Consolidation
**Monday-Tuesday**: courseRoutes.js consolidation
- Remove duplicates
- Maintain backward compatibility
- ~800 lines cleaned

**Wednesday**: Miscellaneous distribution
- Profile to userRoutes
- Contact/Settings to utilityRoutes
- ~200 lines

**Thursday**: Final cleanup
- Remove all migrated code from server.js
- Verify < 1,000 lines
- Full regression testing

**Friday**: Documentation & Deployment
- Update all docs
- Prepare deployment
- Team review

---

## ✅ Definition of Done

### For Each Route File
- [ ] All routes migrated and working
- [ ] Dependencies properly injected
- [ ] Tests written and passing (>80% coverage)
- [ ] Documentation complete
- [ ] Code reviewed and approved
- [ ] No console.log statements (use logger)
- [ ] Error handling complete
- [ ] Logging comprehensive
- [ ] Performance validated
- [ ] Security validated

### For Overall Migration
- [ ] server.js < 1,000 lines
- [ ] All tests passing
- [ ] No breaking changes
- [ ] Documentation updated
- [ ] Deployment guide updated
- [ ] Team trained on new structure
- [ ] Monitoring alerts updated
- [ ] Performance metrics validated

---

## 🔐 Security Checklist

### Before Migration
- [ ] Review authentication requirements
- [ ] Check authorization logic
- [ ] Identify sensitive data handling
- [ ] Review rate limiting needs

### During Migration
- [ ] Maintain authentication middleware
- [ ] Preserve authorization checks
- [ ] Validate all inputs
- [ ] Sanitize outputs
- [ ] Keep secrets secure

### After Migration
- [ ] Security audit
- [ ] Penetration testing
- [ ] Dependency vulnerability scan
- [ ] Access log review

---

## 🎯 Success Criteria

### Technical
1. ✅ server.js reduced to < 1,000 lines
2. ✅ All routes modularized
3. ✅ 100% test coverage for critical paths
4. ✅ No performance regression
5. ✅ Zero breaking changes for clients

### Process
1. ✅ Code reviews completed
2. ✅ Documentation updated
3. ✅ Team trained
4. ✅ Deployment successful
5. ✅ Monitoring in place

### Business
1. ✅ No downtime during migration
2. ✅ All features working
3. ✅ No customer complaints
4. ✅ Developer velocity improved
5. ✅ Technical debt reduced

---

## 📞 Getting Help

### Resources
- **Migration Plan**: `plans/api-migration-plan.md`
- **Dependency Map**: `plans/dependency-map.md`
- **Code Examples**: Existing route files (llmRoutes.js, paymentRoutes.js)

### When Stuck
1. Review similar existing route file
2. Check dependency-map.md
3. Review error logs
4. Ask for code review
5. Pair program on complex routes

### Review Points
- Before starting each route file
- After completing each route file
- Before removing code from server.js
- After full migration complete
