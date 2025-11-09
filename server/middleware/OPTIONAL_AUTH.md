# Optional Authentication Middleware

## Overview

The `optionalAuth` middleware provides flexible authentication for endpoints that should be accessible to both authenticated and non-authenticated users. Unlike `requireAuth`, this middleware does not block requests when authentication is missing or invalid.

## Purpose

This middleware is designed for public content endpoints where:
- Non-authenticated users should be able to view public content
- Authenticated users should have their identity attached to the request
- The endpoint logic can provide different responses based on authentication status

## Implementation

```javascript
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;
        if (token && token !== 'null' && token !== 'undefined') {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user) {
                req.user = user;
            }
        }
    } catch (error) {
        // Silently fail - authentication is optional
        logger.debug('Optional auth failed:', error.message);
    }
    next();
};
```

## Behavior

### With Valid Authentication
- Verifies JWT token from `auth_token` cookie
- Looks up user in database
- Attaches `req.user` object to request
- Continues to next middleware/handler

### Without Authentication or Invalid Token
- Silently catches any authentication errors
- Does NOT attach `req.user` to request
- Continues to next middleware/handler
- Logs debug message for invalid tokens

## Usage

### Applying to Routes

```javascript
// Single route
app.get('/api/public/content', optionalAuth, async (req, res) => {
    // req.user will be present if authenticated, undefined otherwise
    const userId = req.user?._id;
    // ... endpoint logic
});

// Multiple routes
app.get('/api/course/:slug', optionalAuth, courseHandler);
app.get('/api/quiz/:slug', optionalAuth, quizHandler);
```

### Checking Authentication in Handlers

```javascript
app.get('/api/public/content', optionalAuth, async (req, res) => {
    if (req.user) {
        // User is authenticated - can provide personalized content
        console.log('Authenticated user:', req.user.email);
    } else {
        // User is not authenticated - provide public content only
        console.log('Anonymous user');
    }
    
    // ... rest of handler logic
});
```

## Current Usage

The `optionalAuth` middleware is currently used on the following endpoints:

### Public Content Discovery
- `GET /api/public/content` - Unified public content listing
- `GET /api/public/:contentType` - Content-type-specific public listings
- `GET /api/public/:contentType/:slug` - Single public content retrieval

### Individual Content Access
- `GET /api/course/:slug` - Course retrieval (public or owner-only)
- `GET /api/quiz/:slug` - Quiz retrieval (public or owner-only)
- `GET /api/flashcard/:slug` - Flashcard retrieval (public or owner-only)
- `GET /api/guide/:slug` - Guide retrieval (public or owner-only)

## Requirements Satisfied

This middleware satisfies the following requirements from the public-private content sharing feature:

- **Requirement 2.1**: Non-authenticated users can access public content
- **Requirement 2.2**: Non-authenticated users can view public content in read-only mode
- **Requirement 5.1**: Authenticated users can browse public content
- **Requirement 5.2**: Search functionality works for both authenticated and non-authenticated users
- **Requirement 5.3**: Filter options available to all users
- **Requirement 5.4**: Fast response times for public content queries
- **Requirement 9.3**: API endpoints return public content for unauthenticated requests
- **Requirement 9.4**: API endpoints return both public and private content for authenticated requests

## Comparison with Other Middleware

### requireAuth
- **Purpose**: Enforce authentication
- **Behavior**: Returns 401 error if not authenticated
- **Use Case**: Protected endpoints (create, update, delete operations)

### optionalAuth
- **Purpose**: Allow but not require authentication
- **Behavior**: Continues regardless of authentication status
- **Use Case**: Public content endpoints that benefit from knowing user identity

### requireAdmin
- **Purpose**: Enforce admin-level authentication
- **Behavior**: Returns 403 error if not admin
- **Use Case**: Admin-only operations

## Testing

A test script is available at `server/test-optional-auth.js` to verify the middleware behavior:

```bash
node server/test-optional-auth.js
```

The test verifies:
1. Requests succeed without authentication
2. Requests succeed with invalid authentication (silently ignored)
3. Public content endpoints work correctly

## Security Considerations

1. **No Sensitive Data Exposure**: Since authentication is optional, never expose sensitive data in responses unless `req.user` is verified
2. **Access Control**: Always check `req.user` existence before providing user-specific data
3. **Rate Limiting**: Consider implementing rate limiting on public endpoints to prevent abuse
4. **Token Validation**: Invalid tokens are silently ignored, preventing error-based enumeration attacks

## Best Practices

1. **Check User Presence**: Always check if `req.user` exists before using it
   ```javascript
   if (req.user) {
       // User-specific logic
   }
   ```

2. **Provide Appropriate Responses**: Tailor responses based on authentication status
   ```javascript
   const content = await getContent(slug);
   if (!content.isPublic && !req.user) {
       return res.status(403).json({ error: 'Content is private' });
   }
   ```

3. **Log Appropriately**: Use debug-level logging for authentication failures to avoid log spam
   ```javascript
   logger.debug('Optional auth failed:', error.message);
   ```

4. **Don't Assume Authentication**: Never assume `req.user` will be present in optionalAuth-protected routes

## Future Enhancements

Potential improvements to consider:

1. **Token Refresh**: Automatically refresh expiring tokens for authenticated users
2. **Session Tracking**: Track anonymous sessions for analytics
3. **Rate Limiting**: Different rate limits for authenticated vs non-authenticated users
4. **Caching**: Cache user lookups to reduce database queries
