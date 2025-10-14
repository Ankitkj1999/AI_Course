# Guide Generation Feature Documentation

## Overview
The Guide Generation feature creates comprehensive, single-page study guides for any topic using AI. Unlike courses, guides are focused, continuous documents designed for quick reference and efficient learning.

## Features

### ✨ **Core Functionality**
- **AI-Generated Content**: Comprehensive study guides using Google's Gemini AI
- **Single-Page Format**: Continuous document without chapters or sections
- **Structured Learning**: Organized content with examples and explanations
- **Study Enhancement**: Related topics, deep-dive suggestions, and practice questions
- **Quick Reference**: Designed for efficient studying and knowledge retention

### 🎨 **User Interface**
- **Reading-Focused Design**: Clean typography and optimal spacing for reading
- **Sticky Navigation**: Quick jump to different sections
- **Dark Theme Compatible**: Full support for light and dark themes
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Markdown Rendering**: Rich content with code highlighting and formatting

### 📊 **Content Structure**
- **Main Content**: Comprehensive guide with examples and explanations
- **Related Topics**: Connected concepts for broader understanding
- **Deep Dive Topics**: Advanced areas for further specialized study
- **Study Questions**: Practice questions to test comprehension
- **Visual Organization**: Cards and sections for easy navigation

## API Endpoints

### Backend Routes
- `POST /api/guide/create` - Create new study guide
- `GET /api/guides` - Get user's guides (paginated)
- `GET /api/guide/:slug` - Get specific guide by slug
- `DELETE /api/guide/:slug` - Delete guide

### Frontend Routes
- `/dashboard/guides` - List all user guides
- `/dashboard/create-guide` - Create new study guide
- `/dashboard/guide/:slug` - View specific study guide

## Database Schema

### Guide Collection
```javascript
{
  userId: String (required, indexed),
  keyword: String (required),
  title: String (required),
  slug: String (unique, indexed),
  content: String (required), // Main guide content in markdown
  relatedTopics: [String], // Array of related topic suggestions
  deepDiveTopics: [String], // Array of advanced topics for further study
  questions: [String], // Array of study questions
  tokens: {
    prompt: Number,
    completion: Number,
    total: Number
  },
  viewCount: Number,
  lastVisitedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Usage Flow

### Creating Guides
1. User navigates to "Create Guide" from sidebar
2. Enters topic/keyword, title, and optional customization requirements
3. AI generates comprehensive study guide with structured content
4. User is redirected to read the new guide

### Reading Guides
1. User selects a guide from "My Guides"
2. Clean reading interface with sidebar navigation
3. Quick jump to different sections (content, related topics, questions)
4. Progress tracking and view count updates

### Managing Guides
1. View all guides in organized grid layout
2. See metadata: related topics, views, creation date
3. Delete unwanted guides with confirmation dialog
4. Pagination for large collections

## Integration Points

### Navigation
- Added to main dashboard sidebar with dedicated icons
- Quick action buttons in sidebar for easy access
- Breadcrumb navigation in guide viewer

### Styling
- Consistent with existing design system
- Uses same color palette and components
- Dark theme compatibility throughout
- Responsive design patterns

### Content Rendering
- ReactMarkdown for rich content display
- Syntax highlighting for code blocks
- Proper typography and spacing for readability

## Technical Implementation

### Frontend Components
- `GuideCreator` - Form for creating new study guides
- `GuideList` - Grid view of all user guides
- `GuideViewer` - Reading interface with navigation and sections
- `guideService` - API communication layer
- TypeScript types for type safety

### Backend Features
- AI integration with Google Gemini
- Structured prompt engineering for consistent output
- Unique slug generation for SEO-friendly URLs
- Token usage tracking for cost monitoring
- Comprehensive error handling and logging

### AI Prompt Engineering
The system uses carefully crafted prompts to generate:
- **Structured Content**: Well-organized sections with headers and examples
- **Related Topics**: Closely connected concepts for broader understanding
- **Deep Dive Topics**: Advanced/specialized areas for further study
- **Study Questions**: Comprehensive questions testing key concepts
- **Markdown Formatting**: Proper formatting with code blocks, lists, and emphasis

## Key Differences from Courses

### **Guides vs Courses**
| Feature | Guides | Courses |
|---------|--------|---------|
| **Length** | Shorter, focused | Comprehensive, detailed |
| **Structure** | Single continuous page | Multiple chapters/sections |
| **Purpose** | Quick reference, study aid | Complete learning journey |
| **Content** | Concise with examples | Extensive with exercises |
| **Navigation** | Section jumping | Chapter progression |
| **Study Tools** | Questions, related topics | Exams, certificates |

## Future Enhancements

### Potential Features
- **Export Options**: PDF, Word, or plain text export
- **Bookmarking**: Save specific sections for quick access
- **Collaborative Guides**: Share and collaborate on guides
- **Template System**: Pre-defined guide structures for different subjects
- **Search Within Guide**: Find specific content within long guides
- **Reading Progress**: Track reading completion and time spent
- **Offline Access**: PWA capabilities for offline reading

### Content Enhancements
- **Interactive Elements**: Expandable sections, tooltips
- **Visual Content**: Diagrams, charts, and images
- **Audio Support**: Text-to-speech for accessibility
- **Multi-language**: Support for guides in different languages
- **Version Control**: Track changes and updates to guides

## Getting Started

### For Users
1. Navigate to Dashboard → Create Guide
2. Enter your study topic and a descriptive title
3. Optionally specify requirements or focus areas
4. Wait for AI to generate your comprehensive guide
5. Start reading with the clean, organized interface

### For Developers
1. Backend APIs are ready and documented
2. Frontend components are modular and reusable
3. TypeScript types ensure type safety
4. Dark theme support is built-in
5. Responsive design works across devices
6. Markdown rendering with syntax highlighting

## Technical Dependencies

### New Dependencies Added
- `react-markdown` - For rendering markdown content
- `react-syntax-highlighter` - For code syntax highlighting
- `@types/react-syntax-highlighter` - TypeScript types

### Integration
- Seamlessly integrates with existing dashboard
- Uses established patterns from quiz and flashcard features
- Consistent with current design system and navigation

The Guide Generation feature is now fully implemented and ready for use! 📚✨