# 🔌 API Reference

Complete reference for AiCourse REST API endpoints.

## Base URL
```
http://localhost:5010/api
```

## Authentication

Most endpoints require user authentication. Include user ID in request body where specified.

## User Management

### Sign Up
Create a new user account.

**Endpoint:** `POST /signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "mName": "John Doe",
  "password": "securepassword",
  "type": "free"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "userId": "64f8a1b2c3d4e5f6g7h8i9j0"
}
```

### Sign In
Authenticate existing user.

**Endpoint:** `POST /signin`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SignIn Successful",
  "userData": {
    "_id": "64f8a1b2c3d4e5f6g7h8i9j0",
    "email": "user@example.com",
    "mName": "John Doe",
    "type": "free"
  }
}
```

### Social Login
Sign in with social media accounts.

**Endpoint:** `POST /social`

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

### Password Reset
Request password reset link.

**Endpoint:** `POST /forgot`

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "AiCourse",
  "company": "Spacester",
  "logo": "https://example.com/logo.png"
}
```

### Reset Password
Reset password with token.

**Endpoint:** `POST /reset-password`

**Request Body:**
```json
{
  "password": "newpassword",
  "token": "reset_token_here"
}
```

## Course Management

### Create Course
Generate a new AI course.

**Endpoint:** `POST /course`

**Request Body:**
```json
{
  "user": "64f8a1b2c3d4e5f6g7h8i9j0",
  "content": "Course content in JSON format",
  "type": "ai_generated",
  "mainTopic": "JavaScript Fundamentals",
  "lang": "en"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course created successfully",
  "courseId": "64f8a1b2c3d4e5f6g7h8i9j1"
}
```

### Get User Courses
Retrieve courses for a user with pagination.

**Endpoint:** `GET /courses`

**Query Parameters:**
- `userId` (required): User ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 9)

**Response:**
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6g7h8i9j1",
    "user": "64f8a1b2c3d4e5f6g7h8i9j0",
    "content": "Course content",
    "type": "ai_generated",
    "mainTopic": "JavaScript Fundamentals",
    "photo": "https://images.unsplash.com/photo-123",
    "date": "2023-09-06T10:30:00.000Z",
    "completed": false
  }
]
```

### Update Course
Update existing course content.

**Endpoint:** `POST /update`

**Request Body:**
```json
{
  "content": "Updated course content",
  "courseId": "64f8a1b2c3d4e5f6g7h8i9j1"
}
```

### Delete Course
Delete a course.

**Endpoint:** `POST /deletecourse`

**Request Body:**
```json
{
  "courseId": "64f8a1b2c3d4e5f6g7h8i9j1"
}
```

### Complete Course
Mark course as completed.

**Endpoint:** `POST /finish`

**Request Body:**
```json
{
  "courseId": "64f8a1b2c3d4e5f6g7h8i9j1"
}
```

### Get Shareable Course
Get course by ID for sharing.

**Endpoint:** `GET /shareable`

**Query Parameters:**
- `id`: Course ID

## AI Content Generation

### Generate Content
Generate AI content using prompts.

**Endpoint:** `POST /prompt`

**Request Body:**
```json
{
  "prompt": "Explain JavaScript closures with examples"
}
```

**Response:**
```json
{
  "generatedText": "JavaScript closures are..."
}
```

### Generate Theory
Generate formatted theory content.

**Endpoint:** `POST /generate`

**Request Body:**
```json
{
  "prompt": "Create a lesson about React hooks"
}
```

**Response:**
```json
{
  "text": "<h1>React Hooks</h1><p>React hooks are...</p>"
}
```

## Media Services

### Get Image
Search for course-related images.

**Endpoint:** `POST /image`

**Request Body:**
```json
{
  "prompt": "javascript programming"
}
```

**Response:**
```json
{
  "url": "https://example.com/image.jpg"
}
```

### Get YouTube Video
Search for educational videos.

**Endpoint:** `POST /yt`

**Request Body:**
```json
{
  "prompt": "javascript tutorial"
}
```

**Response:**
```json
{
  "url": "dQw4w9WgXcQ"
}
```

### Get Video Transcript
Get transcript for YouTube video.

**Endpoint:** `POST /transcript`

**Request Body:**
```json
{
  "prompt": "dQw4w9WgXcQ"
}
```

## Email Services

### Send Email
Send custom emails.

**Endpoint:** `POST /data`

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Course Completion",
  "html": "<h1>Congratulations!</h1>"
}
```

### Send Certificate
Email course completion certificate.

**Endpoint:** `POST /sendcertificate`

**Request Body:**
```json
{
  "html": "<html>Certificate content</html>",
  "email": "user@example.com"
}
```

## Payment Integration

### PayPal Subscription
Create PayPal subscription.

**Endpoint:** `POST /paypal`

**Request Body:**
```json
{
  "planId": "P-1EM732768S920784HMWKW3OA",
  "email": "user@example.com",
  "name": "John",
  "lastName": "Doe",
  "post": "12345",
  "address": "123 Main St, City",
  "country": "US",
  "brand": "AiCourse",
  "admin": "State"
}
```

### Get Subscription Details
Get user subscription information.

**Endpoint:** `POST /subscriptiondetail`

**Request Body:**
```json
{
  "uid": "64f8a1b2c3d4e5f6g7h8i9j0",
  "email": "user@example.com"
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Quiz Management

### Create Quiz
Generate a new AI quiz.

**Endpoint:** `POST /quiz/create`

**Request Body:**
```json
{
  "userId": "64f8a1b2c3d4e5f6g7h8i9j0",
  "keyword": "Node.js fundamentals",
  "title": "Node.js Fundamentals Quiz",
  "format": "mixed",
  "questionAndAnswers": []
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz created successfully",
  "quiz": {
    "_id": "64f8a1b2c3d4e5f6g7h8i9j2",
    "slug": "nodejs-fundamentals-quiz-1234567890",
    "title": "Node.js Fundamentals Quiz",
    "keyword": "Node.js fundamentals"
  }
}
```

### Get User Quizzes
Retrieve quizzes for a user with pagination.

**Endpoint:** `GET /quizzes`

**Query Parameters:**
- `userId` (required): User ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6g7h8i9j2",
      "userId": "64f8a1b2c3d4e5f6g7h8i9j0",
      "keyword": "Node.js fundamentals",
      "title": "Node.js Fundamentals Quiz",
      "slug": "nodejs-fundamentals-quiz-1234567890",
      "format": "mixed",
      "tokens": {
        "prompt": 1034,
        "completion": 2233,
        "total": 3267
      },
      "viewCount": 8,
      "lastVisitedAt": "2025-10-13T12:52:56.496Z",
      "createdAt": "2025-08-15T17:15:25.640Z",
      "updatedAt": "2025-10-13T12:52:56.497Z"
    }
  ],
  "totalCount": 1,
  "totalPages": 1,
  "currPage": 1,
  "perPage": 10
}
```

### Get Quiz by Slug
Retrieve a quiz using its SEO-friendly slug.

**Endpoint:** `GET /quiz/:slug`

**Parameters:**
- `slug` (required): Quiz slug

**Response:**
```json
{
  "success": true,
  "quiz": {
    "_id": "64f8a1b2c3d4e5f6g7h8i9j2",
    "userId": "64f8a1b2c3d4e5f6g7h8i9j0",
    "keyword": "Node.js fundamentals",
    "title": "Node.js Fundamentals Quiz",
    "slug": "nodejs-fundamentals-quiz-1234567890",
    "format": "mixed",
    "content": "# Question 1?\n- Option A\n-* Correct Option B\n- Option C\n## Explanation here",
    "viewCount": 9,
    "lastVisitedAt": "2025-10-13T12:54:15.618Z",
    "questionAndAnswers": [],
    "createdAt": "2025-08-15T17:15:25.640Z",
    "updatedAt": "2025-10-13T12:54:15.618Z"
  }
}
```

### Delete Quiz
Delete a quiz by slug.

**Endpoint:** `DELETE /quiz/:slug`

**Parameters:**
- `slug` (required): Quiz slug

**Request Body:**
```json
{
  "userId": "64f8a1b2c3d4e5f6g7h8i9j0"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz deleted successfully"
}
```

## Need Help?

- Check [Troubleshooting Guide](troubleshooting.md)
- Review [Backend Guide](backend-guide.md)
- Create an issue on GitHub

## D
ocument-Based Content Generation

The document-based content generation feature allows users to create educational content from various document sources including PDF files, DOCX documents, plain text, and web URLs.

### Upload Document
Upload a document file for text extraction.

**Endpoint:** `POST /api/document/upload`

**Authentication:** Required (Cookie-based)

**Content-Type:** `multipart/form-data`

**Request Body:**
- `document`: File (PDF, DOCX, or TXT)
- Maximum file size: 10MB
- Allowed types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`

**Response:**
```json
{
  "success": true,
  "processingId": "64f8a1b2c3d4e5f6g7h8i9j0",
  "status": "processing",
  "message": "Document uploaded successfully"
}
```

**Error Responses:**
- `400`: Invalid file type or missing file
- `413`: File size exceeds 10MB limit
- `401`: Authentication required
- `500`: Server error during upload

---

### Extract from URL
Extract text content from a web URL.

**Endpoint:** `POST /api/document/extract-url`

**Authentication:** Required (Cookie-based)

**Request Body:**
```json
{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "success": true,
  "processingId": "64f8a1b2c3d4e5f6g7h8i9j0",
  "status": "processing",
  "message": "URL extraction started"
}
```

**Error Responses:**
- `400`: Invalid URL format (must be HTTP/HTTPS)
- `401`: Authentication required
- `408`: URL fetch timeout (after 10 seconds)
- `500`: Server error during extraction

---

### Get Processing Status
Check the status of document processing.

**Endpoint:** `GET /api/document/status/:id`

**Authentication:** Required (Cookie-based)

**URL Parameters:**
- `id`: Processing ID returned from upload or extract-url

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "preview": "First 500 characters of extracted text...",
  "textLength": 5432
}
```

**Status Values:**
- `pending`: Processing not yet started
- `processing`: Currently extracting text
- `completed`: Extraction successful
- `failed`: Extraction failed

**Error Response (Failed):**
```json
{
  "success": true,
  "status": "failed",
  "errorMessage": "Failed to extract text from PDF: File is corrupted"
}
```

---

### Get Full Extracted Text
Retrieve the complete extracted text from a processed document.

**Endpoint:** `GET /api/document/text/:id`

**Authentication:** Required (Cookie-based)

**URL Parameters:**
- `id`: Processing ID

**Response:**
```json
{
  "success": true,
  "text": "Complete extracted text content...",
  "textLength": 5432
}
```

**Error Responses:**
- `404`: Processing record not found
- `403`: Unauthorized access (not the document owner)
- `401`: Authentication required

---

### Generate Course from Document
Create a course from extracted document text.

**Endpoint:** `POST /api/course/from-document`

**Authentication:** Required (Cookie-based)

**Request Body:**
```json
{
  "processingId": "64f8a1b2c3d4e5f6g7h8i9j0",
  "title": "Course Title",
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "isPublic": true
}
```

**Alternative (Direct Text):**
```json
{
  "text": "Direct text content for course generation...",
  "title": "Course Title",
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "course": { /* Course object */ },
  "slug": "course-title",
  "message": "Course created successfully"
}
```

---

### Generate Quiz from Document
Create a quiz from extracted document text.

**Endpoint:** `POST /api/quiz/from-document`

**Authentication:** Required (Cookie-based)

**Request Body:**
```json
{
  "processingId": "64f8a1b2c3d4e5f6g7h8i9j0",
  "title": "Quiz Title",
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "isPublic": true
}
```

**Alternative (Direct Text):**
```json
{
  "text": "Direct text content for quiz generation...",
  "title": "Quiz Title",
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "quiz": { /* Quiz object */ },
  "slug": "quiz-title",
  "message": "Quiz created successfully"
}
```

**Error Responses:**
- `422`: Insufficient content for quiz generation
- `404`: Processing record not found
- `401`: Authentication required

---

### Generate Flashcards from Document
Create flashcards from extracted document text.

**Endpoint:** `POST /api/flashcard/from-document`

**Authentication:** Required (Cookie-based)

**Request Body:**
```json
{
  "processingId": "64f8a1b2c3d4e5f6g7h8i9j0",
  "title": "Flashcard Set Title",
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "isPublic": true
}
```

**Alternative (Direct Text):**
```json
{
  "text": "Direct text content for flashcard generation...",
  "title": "Flashcard Set Title",
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "flashcards": { /* Flashcard set object */ },
  "slug": "flashcard-set-title",
  "message": "Flashcards created successfully"
}
```

---

### Generate Guide from Document
Create a guide from extracted document text.

**Endpoint:** `POST /api/guide/from-document`

**Authentication:** Required (Cookie-based)

**Request Body:**
```json
{
  "processingId": "64f8a1b2c3d4e5f6g7h8i9j0",
  "title": "Guide Title",
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "isPublic": true
}
```

**Alternative (Direct Text):**
```json
{
  "text": "Direct text content for guide generation...",
  "title": "Guide Title",
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "guide": { /* Guide object */ },
  "slug": "guide-title",
  "message": "Guide created successfully"
}
```

---

## Document Processing Notes

### Supported File Formats
- **PDF**: `.pdf` files (text extraction only, no OCR)
- **DOCX**: `.docx` Microsoft Word documents
- **TXT**: `.txt` plain text files
- **URLs**: HTTP/HTTPS web pages

### File Size Limits
- Maximum upload size: 10MB
- Text input limit: 50,000 characters

### Processing Timeouts
- URL extraction timeout: 10 seconds
- Document processing is asynchronous - poll `/api/document/status/:id` for completion

### Data Retention
- Uploaded files are deleted 5 minutes after successful extraction
- Files older than 1 hour are automatically cleaned up
- Database records expire after 1 hour (MongoDB TTL index)

### Content Cleaning
- Web content extraction removes navigation, ads, and footer elements
- PDF extraction filters out non-text elements (images, objects)
- DOCX extraction preserves paragraph structure and table content
