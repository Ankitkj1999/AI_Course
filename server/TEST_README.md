# Course API Testing Guide

This directory contains comprehensive test scripts for validating the Course API functionality. The tests are designed to be simple, non-overcomplicated, and focused on ensuring the backend is working as expected.

## Test Scripts Overview

### 1. `test-course-apis-simple.js` - Basic Connectivity Tests
**Purpose**: Quick validation that all API endpoints exist and respond correctly
**Authentication**: Not required
**Usage**: `node test-course-apis-simple.js`

**What it tests**:
- Server connectivity
- Endpoint availability (returns proper HTTP status codes)
- Basic request/response structure
- No actual functionality, just endpoint existence

**Best for**: Initial server validation, CI/CD pipeline checks

### 2. `test-course-functionality.js` - Complete Workflow Tests
**Purpose**: Comprehensive testing of the entire course workflow
**Authentication**: Required (mock credentials provided)
**Usage**: `node test-course-functionality.js`

**What it tests**:
- Content generation API (`/api/generate`)
- Course creation API (`/api/course`)
- Hierarchy API (`/api/v2/courses/:id/hierarchy`)
- Section content API (`/api/sections/:id/content`)
- Progress tracking API (`/api/course/:id/progress`)
- Course retrieval and listing APIs

**Best for**: Full functionality validation, development testing

### 3. `test-course-apis.js` - Authenticated Integration Tests
**Purpose**: End-to-end testing with real authentication
**Authentication**: Required (real user credentials needed)
**Usage**: Update config, then `node test-course-apis.js`

**What it tests**:
- Complete course creation workflow
- Content generation and storage
- Progress tracking and completion
- User course management
- Data persistence validation

**Best for**: Production readiness testing, user acceptance testing

## Quick Start

### 1. Basic Server Validation (No Setup Required)
```bash
# Start the server
npm start

# In another terminal, run basic tests
node test-course-apis-simple.js
```

### 2. Functionality Testing (Minimal Setup)
```bash
# Start the server
npm start

# Run functionality tests (uses mock auth)
node test-course-functionality.js
```

### 3. Full Integration Testing (Complete Setup)
```bash
# 1. Start the server
npm start

# 2. Create a test user account (via UI or database)
# 3. Get the user ID and auth token
# 4. Update test-course-apis.js with real credentials:
#    - testUserId: 'your-actual-user-id'
#    - testAuthToken: 'your-actual-auth-token'

# 5. Run full tests
node test-course-apis.js
```

## Test Results Interpretation

### ✅ Success Indicators
- All endpoints return expected status codes (200, 401, 404)
- Content generation produces meaningful text
- Course creation returns valid IDs and slugs
- Hierarchy API returns proper structure
- Data persistence works correctly

### ❌ Failure Indicators
- Server connectivity issues (connection refused)
- 500 Internal Server Error responses
- Missing or malformed response data
- Authentication failures with valid credentials
- Database connection problems

## API Endpoints Tested

| Endpoint | Purpose | Test Coverage |
|----------|---------|---------------|
| `POST /api/generate` | Content generation | ✅ Structure, Authentication, Content quality |
| `POST /api/course` | Course creation | ✅ Creation, Validation, Response format |
| `GET /api/v2/courses/:id/hierarchy` | Course structure | ✅ Hierarchy, Content status, Metadata |
| `POST /api/sections/:id/content` | Section content | ✅ Save, Update, Metadata |
| `GET /api/course/:id/progress` | Progress tracking | ✅ Progress data, Completion status |
| `GET /api/course/:slug` | Course retrieval | ✅ Slug resolution, Course data |
| `GET /api/courses` | Course listing | ✅ Filtering, Pagination, Visibility |

## Common Issues and Solutions

### Authentication Errors (401)
- **Issue**: Tests return 401 Unauthorized
- **Solution**: Update test scripts with valid user credentials
- **Note**: Basic connectivity tests expect 401 responses

### Database Connection Errors
- **Issue**: Tests fail with database connection errors
- **Solution**: Ensure MongoDB is running and accessible
- **Check**: Database connection string in `.env` file

### Content Generation Failures
- **Issue**: `/api/generate` returns errors
- **Solution**: Verify LLM provider API keys are configured
- **Check**: OpenAI/other provider credentials in environment

### Server Not Responding
- **Issue**: Connection refused errors
- **Solution**: Ensure server is running on correct port
- **Check**: Server logs for startup errors

## Environment Requirements

### Required Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/aicourse

# LLM Provider (for content generation)
OPENAI_API_KEY=your-openai-key

# Server Configuration
PORT=5010
NODE_ENV=development
```

### Dependencies
- Node.js (v16+)
- MongoDB (running)
- Internet connection (for LLM APIs)

## Test Data Management

### Cleanup
- Tests may create course data in the database
- Course IDs and slugs are logged for manual cleanup
- Consider using a separate test database

### Test User Setup
```javascript
// Create test user with these properties:
{
  _id: "test-user-id",
  email: "test@example.com",
  // ... other user fields
}

// Get auth token from login or database
```

## Extending Tests

### Adding New Test Cases
1. Follow the existing `runTest()` pattern
2. Use descriptive test names
3. Include proper error handling
4. Log relevant test data for debugging

### Custom Test Configuration
```javascript
const testConfig = {
  // Update with your test environment
  serverUrl: 'http://localhost:5010',
  testUser: {
    id: 'your-test-user-id',
    token: 'your-auth-token'
  },
  // Add custom test data
};
```

## Support

If tests fail consistently:
1. Check server logs for detailed error messages
2. Verify database connectivity and data integrity
3. Ensure all environment variables are properly set
4. Test individual API endpoints manually using tools like Postman
5. Review the course generation flow documentation

For questions about specific test failures, include:
- Test script name and version
- Complete error messages
- Server logs during test execution
- Environment configuration (without sensitive data)