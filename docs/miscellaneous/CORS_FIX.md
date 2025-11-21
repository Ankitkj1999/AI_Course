# CORS Fix for PATCH Requests ✅

## Problem

PATCH requests to `/api/course/:slug/visibility` were failing with CORS errors:

```bash
curl 'http://localhost:5010/api/course/generative-ai/visibility' \
  -X 'PATCH' \
  -H 'Content-Type: application/json' \
  --data-raw '{"isPublic":true}'
```

**Error:** CORS policy blocked the request

## Root Cause

The CORS configuration in `server/server.js` was missing `'PATCH'` in the allowed methods array:

```javascript
// Before (line ~93)
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
```

## Solution

Added `'PATCH'` to the allowed methods:

```javascript
// After (line ~93)
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
```

## Why This Happened

The visibility toggle endpoint uses PATCH method (RESTful convention for partial updates), but the CORS configuration only allowed GET, POST, PUT, DELETE, and OPTIONS methods. This caused the browser to block the preflight OPTIONS request.

## Testing

After the fix, these requests should work:

```bash
# Make course public
curl 'http://localhost:5010/api/course/generative-ai/visibility' \
  -X 'PATCH' \
  -H 'Content-Type: application/json' \
  --data-raw '{"isPublic":true}'

# Make course private
curl 'http://localhost:5010/api/course/fundamental-algorithms/visibility' \
  -X 'PATCH' \
  -H 'Content-Type: application/json' \
  --data-raw '{"isPublic":false}'
```

## Impact

This fix enables:
- ✅ Course visibility toggle from dashboard cards
- ✅ Quiz visibility toggle (uses same endpoint pattern)
- ✅ Flashcard visibility toggle (uses same endpoint pattern)
- ✅ Guide visibility toggle (uses same endpoint pattern)
- ✅ Any future PATCH requests to the API

## Files Modified

- `server/server.js` (line ~93) - Added 'PATCH' to CORS allowed methods

## Note

The server needs to be restarted for this change to take effect:

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
# or
node server/server.js
```
