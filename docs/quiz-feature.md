# 🧠 Quiz Feature Documentation

Complete guide for the AI-powered Quiz feature in AiCourse.

## Overview

The Quiz feature allows users to create, manage, and take AI-generated quizzes on any topic. It includes comprehensive quiz creation, interactive quiz taking, scoring, and sharing capabilities.

## Features

### ✅ Implemented Features

- **AI Quiz Generation** - Create quizzes using Google's Generative AI
- **SEO-Friendly URLs** - Quiz slugs for better sharing and SEO
- **Interactive Quiz Taking** - Step-by-step quiz experience
- **Scoring & Analytics** - Comprehensive scoring with explanations
- **Quiz Management** - Create, view, edit, and delete quizzes
- **Social Sharing** - Share quizzes on social media platforms
- **Responsive Design** - Works on desktop, tablet, and mobile

## Architecture

### Backend Components

1. **Quiz Schema** (`server/server.js`)
   - MongoDB schema for quiz storage
   - Includes metadata, content, and analytics

2. **API Endpoints** (`server/server.js`)
   - `POST /api/quiz/create` - Create new quiz
   - `GET /api/quizzes` - Get user's quizzes
   - `GET /api/quiz/:slug` - Get quiz by slug
   - `DELETE /api/quiz/:slug` - Delete quiz

3. **AI Integration**
   - Uses Google Generative AI for content generation
   - Structured prompt for consistent quiz format

### Frontend Components

1. **Types** (`src/types/quiz.ts`)
   - TypeScript interfaces for type safety

2. **Services** (`src/services/quizService.ts`)
   - API client for quiz operations
   - Quiz content parser utilities

3. **Components**
   - `QuizCreator` - Quiz creation form
   - `QuizList` - Display user's quizzes
   - `QuizViewer` - Interactive quiz taking
   - `QuizDashboard` - Overview and statistics

4. **Hooks** (`src/hooks/useQuiz.ts`)
   - React hook for quiz data management

## Usage Guide

### Creating a Quiz

```typescript
import { QuizService } from '@/services/quizService';

const createQuiz = async () => {
  const response = await QuizService.createQuiz({
    userId: 'user-id',
    keyword: 'JavaScript fundamentals',
    title: 'JavaScript Basics Quiz',
    format: 'mixed'
  });
  
  if (response.success) {
    // Navigate to quiz
    const quizURL = `/quiz/${response.quiz.slug}`;
  }
};
```

### Taking a Quiz

```typescript
import { QuizViewer } from '@/components/quiz/QuizViewer';

// In your router
<Route path="/quiz/:slug" element={<QuizViewer />} />
```

### Managing Quizzes

```typescript
import { QuizList } from '@/components/quiz/QuizList';

// Display user's quizzes
<QuizList userId="user-id" />
```

## Quiz Content Format

Quizzes are stored in a structured markdown format:

```markdown
# Question text here?
- Wrong answer option
-* Correct answer option (marked with *)
- Wrong answer option
- Wrong answer option
## Explanation of the correct answer here

# Next question?
- Option A
-* Correct Option B
- Option C
## Explanation for question 2
```

### Parsing Quiz Content

```typescript
import { QuizParser } from '@/services/quizService';

const parsed = QuizParser.parseQuizContent(quizContent);
// Returns: { questions: [...], totalQuestions: number }
```

## API Reference

### Create Quiz

**Endpoint:** `POST /api/quiz/create`

**Request:**
```json
{
  "userId": "string",
  "keyword": "string",
  "title": "string",
  "format": "mixed|multiple-choice|open-ended",
  "questionAndAnswers": []
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz created successfully",
  "quiz": {
    "_id": "string",
    "slug": "string",
    "title": "string",
    "keyword": "string"
  }
}
```

### Get User Quizzes

**Endpoint:** `GET /api/quizzes?userId=string&page=1&limit=10`

**Response:**
```json
{
  "success": true,
  "data": [...],
  "totalCount": 10,
  "totalPages": 1,
  "currPage": 1,
  "perPage": 10
}
```

### Get Quiz by Slug

**Endpoint:** `GET /api/quiz/:slug`

**Response:**
```json
{
  "success": true,
  "quiz": {
    "_id": "string",
    "title": "string",
    "content": "string",
    "viewCount": 5,
    ...
  }
}
```

## Component Examples

### Basic Quiz Creator

```typescript
import { QuizCreator } from '@/components/quiz/QuizCreator';

function CreateQuizPage() {
  return (
    <div className="container mx-auto p-6">
      <QuizCreator userId="user-id" />
    </div>
  );
}
```

### Quiz Dashboard

```typescript
import { QuizDashboard } from '@/components/quiz/QuizDashboard';

function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <QuizDashboard userId="user-id" />
    </div>
  );
}
```

### Complete Quiz App

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QuizCreator, QuizList, QuizViewer } from '@/components/quiz';

function QuizApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/quizzes" element={<QuizList userId="user-id" />} />
        <Route path="/quiz/create" element={<QuizCreator userId="user-id" />} />
        <Route path="/quiz/:slug" element={<QuizViewer />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Customization

### Styling

All components use Tailwind CSS classes and can be customized:

```typescript
// Custom styling example
<QuizCreator 
  userId="user-id"
  className="custom-quiz-creator"
/>
```

### Quiz Formats

Supported quiz formats:
- `mixed` - Multiple choice with explanations
- `multiple-choice` - Multiple choice only
- `open-ended` - Text-based questions

### AI Prompts

Customize AI prompts in `server/server.js`:

```javascript
const quizPrompt = `Create a comprehensive quiz about "${keyword}"...`;
```

## Best Practices

### Performance

1. **Pagination** - Use pagination for quiz lists
2. **Caching** - Cache parsed quiz content
3. **Lazy Loading** - Load quiz content on demand

### User Experience

1. **Progress Indicators** - Show quiz progress
2. **Auto-save** - Save answers automatically
3. **Responsive Design** - Ensure mobile compatibility

### SEO

1. **Slug URLs** - Use SEO-friendly URLs
2. **Meta Tags** - Add quiz-specific meta tags
3. **Structured Data** - Include schema.org markup

## Troubleshooting

### Common Issues

1. **Quiz Creation Fails**
   - Check AI API key configuration
   - Verify user authentication
   - Check network connectivity

2. **Quiz Not Loading**
   - Verify slug/ID exists
   - Check database connection
   - Review server logs

3. **Parsing Errors**
   - Validate quiz content format
   - Check for special characters
   - Review markdown syntax

### Debug Mode

Enable debug logging:

```typescript
// In development
console.log('Quiz data:', quiz);
console.log('Parsed content:', parsedQuiz);
```

## Future Enhancements

### Planned Features

- [ ] **Quiz Templates** - Pre-built quiz templates
- [ ] **Collaborative Quizzes** - Multiple users creating quizzes
- [ ] **Advanced Analytics** - Detailed quiz performance metrics
- [ ] **Quiz Categories** - Organize quizzes by category
- [ ] **Time Limits** - Add time constraints to quizzes
- [ ] **Question Banks** - Reusable question libraries

### Integration Ideas

- [ ] **LMS Integration** - Connect with learning management systems
- [ ] **Gradebook** - Track student progress
- [ ] **Certificates** - Generate completion certificates
- [ ] **API Webhooks** - Real-time quiz events

## Support

For help with the Quiz feature:

- 📖 **Documentation**: Check this guide and API reference
- 🐛 **Issues**: Report bugs on GitHub
- 💬 **Community**: Join our Discord for discussions
- 📧 **Email**: Contact spacester.app@gmail.com

---

**Next Steps**: Try creating your first quiz with the QuizCreator component!