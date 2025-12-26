# Frontend API Migration Guide

## Overview
This document outlines the API changes made to support the new section-based course architecture and improve frontend integration.

## New Endpoints

### 1. Course Content with Sections
**Endpoint:** `GET /api/course/:courseId/content`
**Authentication:** Required
**Purpose:** Get course content with sections for new architecture

**Response Structure:**
```json
{
  "success": true,
  "architecture": "section-based" | "legacy" | "empty",
  "course": {
    "_id": "courseId",
    "title": "Course Title",
    "slug": "course-slug",
    "mainTopic": "Main Topic",
    "type": "course",
    "photo": "image-url",
    "isPublic": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "generationMeta": {...}
  },
  "sections": [
    {
      "_id": "sectionId",
      "title": "Section Title",
      "order": 1,
      "parentId": null,
      "level": 1,
      "content": {
        "markdown": "# Section content in markdown",
        "html": "<h1>Section content in HTML</h1>",
        "lexical": {...}
      },
      "metadata": {...},
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "sectionCount": 5
}
```

### 2. Course Progress (Replaces getmyresult)
**Endpoint:** `GET /api/course/:courseId/progress`
**Authentication:** Required
**Purpose:** Get course progress and exam results

**Response Structure:**
```json
{
  "success": true,
  "courseId": "courseId",
  "progress": {
    "hasExamResult": true,
    "examPassed": true,
    "examScore": 85,
    "completedAt": "2024-01-01T00:00:00.000Z"
  },
  "language": "English",
  "course": {
    "title": "Course Title",
    "slug": "course-slug",
    "isPublic": false
  }
}
```

## Enhanced Endpoints

### 1. Course Listing
**Endpoint:** `GET /api/courses`
**Changes:** Added description field and enhanced metadata

**New Response Fields:**
```json
{
  "courses": [
    {
      "_id": "courseId",
      "title": "Course Title",
      "description": "Auto-generated description from content",
      "hasContent": true,
      "generationMeta": {...}
    }
  ]
}
```

## Deprecated Endpoints

### 1. `/api/getmyresult` (POST)
**Status:** DEPRECATED but still functional
**Replacement:** `GET /api/course/:courseId/progress`
**Migration:** 
- Change from POST to GET
- Use courseId in URL path instead of request body
- Update response handling for new structure

**Backward Compatibility:**
- Old endpoint still works with deprecation headers
- Response includes `_deprecated` field with migration instructions

## Migration Steps for Frontend

### Step 1: Update Course Cards
Replace the "Continue Learning" button API call:

**Before:**
```javascript
const response = await axios.post('/api/getmyresult', { courseId });
```

**After:**
```javascript
const response = await axios.get(`/api/course/${courseId}/progress`);
```

### Step 2: Update Course Content Loading
Use the new content endpoint for better section support:

**New Implementation:**
```javascript
const response = await axios.get(`/api/course/${courseId}/content`);
if (response.data.architecture === 'section-based') {
  // Handle new section-based architecture
  const sections = response.data.sections;
  // Render sections with proper hierarchy
} else if (response.data.architecture === 'legacy') {
  // Handle legacy content
  const content = response.data.course.content;
  // Show migration suggestion
}
```

### Step 3: Update Course List Display
Use the new description field for better course cards:

```javascript
courses.map(course => (
  <CourseCard
    title={course.title}
    description={course.description} // New field
    hasContent={course.hasContent}   // New field
    // ... other props
  />
))
```

## Error Handling

### New Error Responses
- `404` - Course not found
- `403` - Access denied (private course)
- `401` - Authentication required

### Example Error Response:
```json
{
  "success": false,
  "message": "Course not found"
}
```

## Architecture Detection

The new `/api/course/:courseId/content` endpoint returns an `architecture` field:

- `"section-based"` - New architecture with sections
- `"legacy"` - Old architecture with monolithic content
- `"empty"` - Course has no content yet

Use this to determine how to render the course content.

## Testing the Changes

1. **Server running on:** http://localhost:5013
2. **Test endpoints:**
   - `GET /api/health` - Server health check
   - `GET /api/courses?userId=YOUR_USER_ID` - List courses
   - `GET /api/course/COURSE_ID/content` - Get course content
   - `GET /api/course/COURSE_ID/progress` - Get course progress

## Notes

- All new endpoints follow RESTful conventions
- Authentication is properly enforced
- Backward compatibility is maintained during transition
- Deprecation warnings are included in response headers