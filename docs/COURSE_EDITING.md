# Course Editing Feature

## Overview
Added quick editing capability for course subtopic content using the Milkdown editor.

## What Was Implemented

### 1. Guide Editing (Completed)
- ✅ Added "Edit Guide" button in GuideViewer component
- ✅ Created GuideEditor page with Milkdown editor
- ✅ Added PATCH endpoint `/api/guide/:slug` in server
- ✅ Added `updateGuide()` method to guideService
- ✅ Full guide content editing with AI integration

### 2. Course Subtopic Editing (Completed)
- ✅ Added "Edit" button next to "Mark as Done" on course pages
- ✅ Created SubtopicEditor component with Milkdown editor
- ✅ Opens in a modal dialog for quick editing
- ✅ Saves changes back to the course JSON structure
- ✅ Updates both local state and backend

## How to Use

### Editing Guides
1. Navigate to any guide you own
2. Click the "✏️ Edit Guide" button in the header
3. Edit content using the Milkdown editor with AI features
4. Click "Save Changes" to update

### Editing Course Subtopics
1. Navigate to any course lesson/subtopic
2. Click the "Edit" button (with pencil icon) next to "Mark as Done"
3. Edit the lesson content in the modal dialog
4. Click "Save Changes" to update the content

## Technical Details

### Course Content Structure
Courses are stored as JSON with this structure:
```json
{
  "mainTopic": [
    {
      "title": "Topic 1",
      "subtopics": [
        {
          "title": "Subtopic 1",
          "theory": "Content here...",
          "media": "video_id or image_url",
          "done": false
        }
      ]
    }
  ]
}
```

### Components
- **SubtopicEditor** (`src/components/course/SubtopicEditor.tsx`)
  - Modal dialog with Milkdown editor
  - Handles content editing and saving
  - Integrates with existing course update flow

### API Endpoints
- **PATCH** `/api/guide/:slug` - Update guide content
  - Body: `{ content, title, keyword }`
  - Requires authentication
  - Returns updated guide

## Future Enhancements (See roadmap.md)

### Advanced Course Editor (Planned)
A comprehensive course restructuring tool with:
- Visual course outline editor
- Drag-and-drop topic/subtopic reordering
- Add/remove/edit topics and subtopics
- Bulk content editing
- Course structure preview
- Better schema for hierarchical content

This would replace the current JSON-based structure with a more flexible and user-friendly system.

## Notes
- Current implementation allows editing subtopic content only
- Cannot add/remove/reorder topics or subtopics (requires advanced editor)
- Changes are saved immediately to the backend
- Uses the same Milkdown editor as guides for consistency
