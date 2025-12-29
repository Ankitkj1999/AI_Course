# Frontend API Endpoints Usage Analysis

## Overview
Complete list of API endpoints actively used by the frontend, organized by priority for migration planning.

## 🔥 HIGH PRIORITY (Core Functionality - Migrate First)

### Authentication & User Management
- `POST /api/signin` - User login (Login.tsx)
- `POST /api/signup` - User registration (Signup.tsx) 
- `POST /api/logout` - User logout (Header.tsx, Profile.tsx, AppSidebar.tsx, AdminLayout.tsx)
- `POST /api/social` - Social authentication (Login.tsx, Signup.tsx)

### Course Management (Most Critical)
- `POST /api/course` - Create course (CoursePreview.tsx)
- `GET /api/courses` - Get user courses (Dashboard.tsx, Certificate.tsx)
- `GET /api/course/:slug` - Get course by slug (CoursePage.tsx)
- `GET /api/v2/courses/:courseId/hierarchy` - Course hierarchy (Dashboard.tsx, CoursePage.tsx, CoursePreview.tsx)
- `POST /api/deletecourse` - Delete course (Dashboard.tsx, Courses.tsx)
- `POST /api/finish` - Mark course complete (CoursePage.tsx)
- `PATCH /api/course/:slug/visibility` - Toggle course visibility (Courses.tsx)

### Content Generation (AI Features)
- `POST /api/generate` - Generate content (CoursePage.tsx, CoursePreview.tsx)
- `POST /api/chat` - AI chat (CoursePage.tsx)
- `POST /api/prompt` - AI prompts (GenerateCourse.tsx)

### LLM Services
- `POST /api/llm/generate` - LLM content generation (TestLLM.tsx, TestPlate.tsx, ProviderComparison.tsx)
- `GET /api/llm/providers` - Get LLM providers (TestLLM.tsx, ProviderPerformanceIndicator.tsx, ProviderSelector.tsx)
- `GET /api/llm/health/:providerId` - Provider health check (ProviderPerformanceIndicator.tsx)
- `GET /api/llm/health` - All providers health (ProviderSelector.tsx)

### Section Content Management
- `POST /api/sections/:sectionId/content` - Update section content (CoursePage.tsx)

## 🟡 MEDIUM PRIORITY (Important Features - Migrate Second)

### Media & Content
- `POST /api/image` - Generate images (CoursePage.tsx, CoursePreview.tsx)
- `POST /api/yt` - YouTube video search (CoursePage.tsx, CoursePreview.tsx)
- `POST /api/transcript` - Get video transcripts (CoursePage.tsx, CoursePreview.tsx)

### Notes System
- `POST /api/getnotes` - Get course notes (CoursePage.tsx)
- `POST /api/savenotes` - Save course notes (CoursePage.tsx)

### User Profile & Settings
- `POST /api/profile` - Update user profile (Profile.tsx)
- `POST /api/deleteuser` - Delete user account (Profile.tsx)
- `GET /api/public/settings` - Get public settings (useSettings.ts)

### Course Sharing & Discovery
- `GET /api/shareable` - Get shareable course (Login.tsx)
- `POST /api/courseshared` - Create shared course (Login.tsx)
- `GET /api/blogs/public` - Get public blogs (Blog.tsx)

## 🟢 LOWER PRIORITY (Administrative & Special Features - Migrate Last)

### Admin Functions
- `POST /api/dashboard` - Admin dashboard (AdminDashboard.tsx)
- `GET /api/admin/settings` - Get admin settings (AdminSettings.tsx)
- `PUT /api/admin/settings/:key` - Update admin setting (AdminSettings.tsx)
- `GET /api/policies` - Get policies (Multiple admin pages)
- `POST /api/saveadmin` - Save admin data (Multiple admin pages)
- `POST /api/addadmin` - Add admin user (AdminAdmins.tsx)
- `POST /api/removeadmin` - Remove admin user (AdminAdmins.tsx)
- `POST /api/updateblogs` - Update blog (AdminBlogs.tsx)
- `POST /api/deleteblogs` - Delete blog (AdminBlogs.tsx)
- `POST /api/createblog` - Create blog (AdminCreateBlog.tsx)

### Payment & Billing
- `POST /api/stripepayment` - Stripe payment (PaymentDetails.tsx)
- `POST /api/stripedetails` - Stripe details (PaymentSuccess.tsx)
- `POST /api/stripecancel` - Cancel Stripe (Profile.tsx)
- `POST /api/paypal` - PayPal payment (PaymentDetails.tsx)
- `POST /api/paypaldetails` - PayPal details (PaymentSuccess.tsx)
- `POST /api/paypalcancel` - Cancel PayPal (Profile.tsx)
- `POST /api/razorapypending` - Razorpay pending (PaymentPending.tsx)
- `POST /api/razorapycancel` - Cancel Razorpay (Profile.tsx)
- `POST /api/razorpaycreate` - Create Razorpay (PaymentDetails.tsx)
- `POST /api/razorapydetails` - Razorpay details (PaymentSuccess.tsx)
- `POST /api/paystackpayment` - Paystack payment (PaymentDetails.tsx)
- `POST /api/paystackfetch` - Paystack details (PaymentSuccess.tsx)
- `POST /api/paystackcancel` - Cancel Paystack (Profile.tsx)
- `POST /api/flutterwavecancel` - Cancel Flutterwave (Profile.tsx)
- `POST /api/flutterdetails` - Flutterwave details (PaymentSuccess.tsx)
- `POST /api/sendreceipt` - Send receipt (PaymentSuccess.tsx)
- `POST /api/subscriptiondetail` - Subscription details (Profile.tsx)

### Learning Content
- `POST /api/aiexam` - Generate AI exam (CoursePage.tsx)
- `POST /api/updateresult` - Update quiz result (QuizPage.tsx)
- `GET /api/guide/:slug` - Get guide (GuideEditor.tsx)
- `PATCH /api/guide/:slug` - Update guide (GuideEditor.tsx)

### Document Processing
- `POST /api/document/upload` - Upload document (DocumentUpload.tsx)
- `POST /api/document/extract-url` - Extract from URL (URLInput.tsx)
- `GET /api/document/status/:id` - Get processing status (URLInput.tsx, DocumentUpload.tsx)
- `GET /api/document/text/:id` - Get extracted text (ExtractionPreview.tsx)
- `POST /api/course/from-document` - Generate course from document (GenerateCourse.tsx)

### Communication & Utilities
- `POST /api/contact` - Contact form (Contact.tsx)
- `POST /api/data` - Send email (Signup.tsx, ResetPassword.tsx)
- `POST /api/sendcertificate` - Send certificate (CoursePage.tsx)

### Password Management
- `POST /api/forgot` - Forgot password (ForgotPassword.tsx)
- `POST /api/reset-password` - Reset password (ResetPassword.tsx)

### Course Content Operations
- `POST /api/update` - Update course
- `GET /api/course/:courseId/progress` - Get course progress
- `GET /api/course/:courseId/content` - Get course content
- `GET /api/course/id/:id` - Get course by ID (CourseRedirect.tsx)

## Migration Priority Recommendations

1. **Start with HIGH PRIORITY endpoints** - These are core to user experience
2. **Focus on authentication and course management first** - Foundation features
3. **Move content generation and LLM services next** - AI features
4. **Handle administrative endpoints last** - Lower user impact during migration
5. **Test thoroughly after each batch** - Ensure no breaking changes

## Notes
- Total endpoints found: 80+ unique endpoints
- Most heavily used: Course management, authentication, and content generation
- Payment endpoints are numerous but follow similar patterns
- Admin endpoints can be migrated as a group since they're isolated to admin users