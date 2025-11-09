# Visibility Management API Endpoints Implementation

## Overview
This document describes the implementation of visibility management endpoints for the public-private content sharing feature.

## Implemented Endpoints

### 1. PATCH `/api/:contentType/:slug/visibility`
**Purpose:** Toggle content visibility between public and private

**Authentication:** Required (Owner only)

**Parameters:**
- `contentType` (path): Type of content - `course`, `quiz`, `flashcard`, or `guide`
- `slug` (path): Unique slug identifier for the content
- `isPublic` (body): Boolean value to set visibility

**Request Example:**
```bash
curl -X PATCH http://localhost:5010/api/quiz/my-quiz-slug/visibility \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{"isPublic": true}'
```

**Response Example:**
```json
{
  "success": true,
  "isPublic": true,
  "message": "Quiz visibility updated successfully"
}
```

**Error Responses:**
- `400`: Invalid content type or missing/invalid isPublic parameter
- `401`: Authentication required
- `403`: User is not the content owner
- `404`: Content not found
- `500`: Server error

### 2. GET `/api/:contentType/:slug/visibility`
**Purpose:** Retrieve current visibility status and fork count

**Authentication:** Required (Owner only)

**Parameters:**
- `contentType` (path): Type of content - `course`, `quiz`, `flashcard`, or `guide`
- `slug` (path): Unique slug identifier for the content

**Request Example:**
```bash
curl -X GET http://localhost:5010/api/quiz/my-quiz-slug/visibility \
  -H "Cookie: auth_token=YOUR_TOKEN"
```

**Response Example:**
```json
{
  "success": true,
  "isPublic": false,
  "forkCount": 5
}
```

**Error Responses:**
- `400`: Invalid content type
- `401`: Authentication required
- `403`: User is not the content owner
- `404`: Content not found
- `500`: Server error

## Implementation Details

### Helper Function
A `getContentModel()` helper function maps content types to their respective Mongoose models:
- `course` → Course model
- `quiz` → Quiz model
- `flashcard` → Flashcard model
- `guide` → Guide model

### Security Features
1. **Authentication**: Both endpoints require valid JWT authentication via `requireAuth` middleware
2. **Authorization**: Only content owners can view or modify visibility settings
3. **Validation**: Content type and parameters are validated before processing
4. **Ownership Check**: Verifies user owns the content by comparing `userId` or `user` field

### Logging
All operations are logged using the application logger:
- Successful visibility updates
- Visibility status retrievals
- Errors with full stack traces

## Requirements Satisfied

### Task 2.1: Create PATCH endpoint for toggling content visibility
✅ Implemented `/api/:contentType/:slug/visibility` endpoint with owner authentication
✅ Added validation to ensure only content owners can change visibility
✅ Updates content document with new isPublic value
✅ Requirements: 1.1, 1.2, 1.3

### Task 2.2: Create GET endpoint for visibility status
✅ Implemented `/api/:contentType/:slug/visibility` endpoint
✅ Returns current visibility status and fork count
✅ Added owner-only access control
✅ Requirements: 1.2, 6.1, 6.2

## Testing

### Manual Testing
1. Start the server: `npm start` (from server directory)
2. Create or use existing content (quiz, flashcard, guide, or course)
3. Get an authentication token by logging in
4. Test the endpoints using curl or Postman

### Test Script
A test script is provided at `server/test-visibility-endpoints.js` for automated testing.

To use:
1. Update the `testConfig` object with actual values
2. Uncomment the `testVisibilityEndpoints()` call
3. Run: `node test-visibility-endpoints.js`

## Database Schema Support
The endpoints work with the existing schema fields added in Task 1:
- `isPublic`: Boolean field with default value `false`
- `forkCount`: Number field with default value `0`
- Compound index on `(isPublic, createdAt)` for efficient queries

## Next Steps
The following tasks build upon these endpoints:
- Task 3: Implement public content discovery API endpoints
- Task 4: Enhance existing content retrieval endpoints with access control
- Task 5: Implement fork functionality API endpoints
- Task 7: Implement visibility toggle frontend component
