# Visibility Management API Reference

## Overview
These endpoints allow content owners to manage the visibility (public/private) of their content items.

## Base URL
```
http://localhost:5010/api
```

## Authentication
All endpoints require authentication via httpOnly cookie (`auth_token`). The cookie is automatically set upon login.

## Endpoints

### Toggle Content Visibility

**Endpoint:** `PATCH /:contentType/:slug/visibility`

**Description:** Change the visibility of a content item between public and private.

**Content Types:** `course`, `quiz`, `flashcard`, `guide`

**Request:**
```typescript
// TypeScript/JavaScript example
const toggleVisibility = async (
  contentType: 'course' | 'quiz' | 'flashcard' | 'guide',
  slug: string,
  isPublic: boolean
) => {
  const response = await fetch(
    `/api/${contentType}/${slug}/visibility`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: includes cookies
      body: JSON.stringify({ isPublic })
    }
  );
  
  return await response.json();
};

// Usage
await toggleVisibility('quiz', 'my-quiz-slug', true);
```

**Response:**
```typescript
interface VisibilityToggleResponse {
  success: boolean;
  isPublic: boolean;
  message: string;
}
```

**Example Response:**
```json
{
  "success": true,
  "isPublic": true,
  "message": "Quiz visibility updated successfully"
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 400 | Invalid content type or missing isPublic parameter |
| 401 | Not authenticated |
| 403 | Not the content owner |
| 404 | Content not found |
| 500 | Server error |

---

### Get Visibility Status

**Endpoint:** `GET /:contentType/:slug/visibility`

**Description:** Retrieve the current visibility status and fork count for a content item.

**Content Types:** `course`, `quiz`, `flashcard`, `guide`

**Request:**
```typescript
// TypeScript/JavaScript example
const getVisibilityStatus = async (
  contentType: 'course' | 'quiz' | 'flashcard' | 'guide',
  slug: string
) => {
  const response = await fetch(
    `/api/${contentType}/${slug}/visibility`,
    {
      method: 'GET',
      credentials: 'include', // Important: includes cookies
    }
  );
  
  return await response.json();
};

// Usage
const status = await getVisibilityStatus('quiz', 'my-quiz-slug');
console.log(`Public: ${status.isPublic}, Forks: ${status.forkCount}`);
```

**Response:**
```typescript
interface VisibilityStatusResponse {
  success: boolean;
  isPublic: boolean;
  forkCount: number;
}
```

**Example Response:**
```json
{
  "success": true,
  "isPublic": false,
  "forkCount": 5
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 400 | Invalid content type |
| 401 | Not authenticated |
| 403 | Not the content owner |
| 404 | Content not found |
| 500 | Server error |

---

## Integration Examples

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

interface VisibilityState {
  isPublic: boolean;
  forkCount: number;
  loading: boolean;
  error: string | null;
}

export const useContentVisibility = (
  contentType: 'course' | 'quiz' | 'flashcard' | 'guide',
  slug: string
) => {
  const [state, setState] = useState<VisibilityState>({
    isPublic: false,
    forkCount: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchVisibilityStatus();
  }, [contentType, slug]);

  const fetchVisibilityStatus = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(
        `/api/${contentType}/${slug}/visibility`,
        { credentials: 'include' }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setState({
          isPublic: data.isPublic,
          forkCount: data.forkCount,
          loading: false,
          error: null
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  const toggleVisibility = async (isPublic: boolean) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(
        `/api/${contentType}/${slug}/visibility`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isPublic })
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          isPublic: data.isPublic,
          loading: false
        }));
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      return false;
    }
  };

  return {
    ...state,
    toggleVisibility,
    refresh: fetchVisibilityStatus
  };
};
```

### Usage in Component

```tsx
import { useContentVisibility } from './hooks/useContentVisibility';

const QuizVisibilityToggle = ({ slug }: { slug: string }) => {
  const { isPublic, forkCount, loading, error, toggleVisibility } = 
    useContentVisibility('quiz', slug);

  const handleToggle = async () => {
    const success = await toggleVisibility(!isPublic);
    if (success) {
      console.log('Visibility updated!');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={handleToggle}
        />
        Make Public
      </label>
      {isPublic && <p>Forked {forkCount} times</p>}
    </div>
  );
};
```

## Notes

1. **Authentication Required**: Both endpoints require the user to be authenticated and be the owner of the content.

2. **Content Types**: The endpoints support all four content types: `course`, `quiz`, `flashcard`, and `guide`.

3. **Default Visibility**: All new content is private by default (`isPublic: false`).

4. **Fork Count**: The fork count is read-only through this endpoint. It will be updated by the fork endpoint (to be implemented in Task 5).

5. **Credentials**: Always include `credentials: 'include'` in fetch requests to send the authentication cookie.

## Related Documentation

- [Public Content Discovery Endpoints](./public-content-endpoints.md) (Coming in Task 3)
- [Fork Functionality Endpoints](./fork-endpoints.md) (Coming in Task 5)
- [Content Access Control](./access-control.md) (Coming in Task 4)
