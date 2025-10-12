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

## Need Help?

- Check [Troubleshooting Guide](troubleshooting.md)
- Review [Backend Guide](backend-guide.md)
- Create an issue on GitHub