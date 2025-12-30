# Route Inventory - server.js

This document tracks all routes currently defined directly in server.js that need to be migrated to route modules.

## Status: Initial Inventory (Pre-Migration)

### Utility & Communication Routes (Step 1)
- [ ] `POST /api/data` - Send email
- [ ] `POST /api/sendcertificate` - Send certificate email  
- [ ] `POST /api/downloadreceipt` - Download receipt email
- [ ] `POST /api/sendreceipt` - Send receipt email
- [ ] `GET /api/health` - Health check endpoint
- [ ] `GET /api/public/settings` - Get public settings
- [ ] `POST /api/contact` - Submit contact form

### AI & Content Generation Routes (Step 2)
- [ ] `POST /api/prompt` - Generate from prompt
- [ ] `GET /api/llm/providers` - List LLM providers
- [ ] `POST /api/llm/generate` - Generate content with multi-LLM
- [ ] `GET /api/llm/health/:providerId` - Check provider health
- [ ] `GET /api/llm/health` - Check all providers health
- [ ] `POST /api/generate` - Generate theory content
- [ ] `POST /api/image` - Search images
- [ ] `POST /api/yt` - Search YouTube videos
- [ ] `POST /api/transcript` - Get YouTube transcript
- [ ] `POST /api/chat` - Chat functionality

### Course Management Routes (Step 3)
- [ ] `POST /api/course` - Create new course
- [ ] `POST /api/courseshared` - Create shared course
- [ ] `POST /api/course/convert/:courseId` - Convert legacy course
- [ ] `GET /api/course/architecture/:courseId` - Get architecture info
- [ ] `GET /api/course/stats/:courseId` - Get generation stats
- [ ] `POST /api/sections/:sectionId/content` - Update section content
- [ ] `GET /api/course/:courseId/progress` - Get course progress
- [ ] `GET /api/v2/courses/:courseId/hierarchy` - Get course hierarchy
- [ ] `POST /api/update` - Update course
- [ ] `POST /api/deletecourse` - Delete course
- [ ] `POST /api/finish` - Mark course completed
- [ ] `GET /api/courses` - List user courses (paginated)
- [ ] `GET /api/shareable` - Get shareable course
- [ ] `GET /api/course/:slug` - Get course by slug
- [ ] `GET /api/course/:courseId/content` - Get course content with sections
- [ ] `GET /api/course/id/:id` - Get course by ID (legacy)
- [ ] `GET /api/seo/course/:slug` - Get SEO data for course
- [ ] `POST /api/profile` - Update profile details

### Learning Content Routes (Step 4)
- [ ] `POST /api/getnotes` - Get notes
- [ ] `POST /api/savenotes` - Save notes (if exists)
- [ ] Quiz routes (if in server.js)
- [ ] Flashcard routes (if in server.js)
- [ ] Guide routes (if in server.js)
- [ ] Exam routes (if in server.js)

### Content Processing & Discovery Routes (Step 5)
- [ ] Document processing routes (if in server.js)
- [ ] Public content discovery routes (if in server.js)
- [ ] Content forking routes (if in server.js)

### Payment/Subscription Routes (Already in paymentRoutes.js)
- [x] PayPal webhooks
- [x] Subscription management
- [x] Payment processing

### Already Modularized
- [x] Authentication routes → `authRoutes.js`
- [x] Admin routes → `adminRoutes.js`
- [x] Payment routes → `paymentRoutes.js`
- [x] User routes → `userRoutes.js`
- [x] Content generation routes → `contentGenerationRoutes.js`

## Migration Progress

- **Total routes to migrate**: ~40+
- **Routes migrated**: 0
- **Completion**: 0%

## Notes

- File currently has 6024 lines
- Target: < 1000 lines
- Lines to remove: ~5000+
- Many routes already use proper error handling and logging
- Authentication middleware already in place
- External service integrations (Unsplash, YouTube, etc.) need to be preserved
