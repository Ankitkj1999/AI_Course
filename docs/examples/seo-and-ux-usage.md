# 🎯 SEO & UX Features Usage Examples

Examples of how to use the newly implemented SEO and UX features in AiCourse.

## 🔗 SEO-Friendly URLs

### Backend Implementation

The system automatically generates SEO-friendly slugs when creating courses:

```javascript
// Course creation with automatic slug generation
const response = await fetch('/api/course', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user: userId,
    content: courseContent,
    type: 'ai_generated',
    mainTopic: 'JavaScript Fundamentals',
    lang: 'en'
  })
});

const result = await response.json();
// Returns: { courseId: "...", slug: "javascript-fundamentals" }
```

### Frontend Usage

```typescript
// Access course by slug
const CourseView = () => {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [seoData, setSeoData] = useState(null);

  useEffect(() => {
    // Fetch course by slug
    fetch(`/api/course/${slug}`)
      .then(res => res.json())
      .then(data => setCourse(data.course));

    // Fetch SEO data
    fetch(`/api/seo/course/${slug}`)
      .then(res => res.json())
      .then(data => setSeoData(data.seo));
  }, [slug]);

  return (
    <>
      {/* Dynamic meta tags */}
      <Helmet>
        <title>{seoData?.title}</title>
        <meta name="description" content={seoData?.description} />
        <meta property="og:title" content={seoData?.og.title} />
        <meta property="og:description" content={seoData?.og.description} />
        <meta property="og:image" content={seoData?.og.image} />
        <meta property="og:url" content={seoData?.og.url} />
        <script type="application/ld+json">
          {JSON.stringify(seoData?.jsonLd)}
        </script>
      </Helmet>
      
      {/* Course content */}
      <div>
        {course ? <CourseContent course={course} /> : <CourseLoader />}
      </div>
    </>
  );
};
```

## 📱 Progressive Web App (PWA)

### Installation Prompt

```typescript
import { useEffect, useState } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
      <p className="mb-2">Install AiCourse for a better experience!</p>
      <button onClick={handleInstall} className="bg-white text-blue-600 px-4 py-2 rounded">
        Install App
      </button>
    </div>
  );
};
```

## ⏳ Loading States

### Course Generation with Progress

```typescript
import { CourseGenerationLoader } from '@/components/ui/loading';

const CourseCreator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [progress, setProgress] = useState(0);

  const generateCourse = async (topic) => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      // Stage 1: Analyzing topic
      setGenerationStage('Analyzing topic...');
      setProgress(20);
      
      const analysisResponse = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Analyze topic: ${topic}` })
      });
      
      // Stage 2: Generating structure
      setGenerationStage('Generating course structure...');
      setProgress(40);
      
      // Stage 3: Creating content
      setGenerationStage('Creating lesson content...');
      setProgress(60);
      
      const courseResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Create course on ${topic}` })
      });
      
      // Stage 4: Adding examples
      setGenerationStage('Adding examples and exercises...');
      setProgress(80);
      
      // Stage 5: Finalizing
      setGenerationStage('Finalizing course...');
      setProgress(100);
      
      const result = await courseResponse.json();
      
      // Save course
      await saveCourse(result);
      
    } catch (error) {
      console.error('Course generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {isGenerating && (
        <CourseGenerationLoader 
          stage={generationStage} 
          progress={progress} 
        />
      )}
      
      <button onClick={() => generateCourse('React Hooks')}>
        Generate Course
      </button>
    </>
  );
};
```

### Course List with Skeletons

```typescript
import { CourseListSkeleton } from '@/components/ui/loading';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses()
      .then(setCourses)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <CourseListSkeleton count={6} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map(course => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  );
};
```

## 🚨 Error Boundaries

### Page-Level Error Boundary

```typescript
import ErrorBoundary from '@/components/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to external service
        console.error('App error:', error, errorInfo);
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/course/:slug" element={<CourseView />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};
```

### Component-Level Error Boundary

```typescript
import { withErrorBoundary } from '@/components/ErrorBoundary';

const CourseEditor = ({ course }) => {
  // Component that might throw errors
  return (
    <div>
      {/* Complex course editing UI */}
    </div>
  );
};

// Wrap with error boundary
export default withErrorBoundary(CourseEditor, {
  fallback: (
    <div className="p-8 text-center">
      <h2>Course Editor Error</h2>
      <p>Unable to load the course editor. Please refresh the page.</p>
    </div>
  )
});
```

## 🔔 Toast Notifications

### Basic Usage

```typescript
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/toast';

const CourseActions = () => {
  const { toast, toasts, removeToast } = useToast();

  const handleSaveCourse = async () => {
    try {
      await saveCourse();
      toast.success('Course saved successfully!');
    } catch (error) {
      toast.error('Failed to save course. Please try again.');
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await deleteCourse();
      toast.success('Course deleted successfully!', {
        action: {
          label: 'Undo',
          onClick: () => restoreCourse()
        }
      });
    } catch (error) {
      toast.error('Failed to delete course.');
    }
  };

  return (
    <>
      <div>
        <button onClick={handleSaveCourse}>Save Course</button>
        <button onClick={handleDeleteCourse}>Delete Course</button>
      </div>
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};
```

### Advanced Toast Usage

```typescript
const CourseGenerator = () => {
  const { toast } = useToast();

  const generateCourse = async (topic) => {
    // Show info toast
    const loadingToastId = toast.info('Generating your course...', {
      duration: 0 // Don't auto-dismiss
    });

    try {
      const result = await createCourse(topic);
      
      // Remove loading toast and show success
      removeToast(loadingToastId);
      toast.success(`Course "${result.title}" created successfully!`, {
        action: {
          label: 'View Course',
          onClick: () => navigate(`/course/${result.slug}`)
        }
      });
    } catch (error) {
      removeToast(loadingToastId);
      toast.error('Course generation failed', {
        title: 'Generation Error',
        action: {
          label: 'Retry',
          onClick: () => generateCourse(topic)
        }
      });
    }
  };
};
```

## 🔍 SEO Best Practices

### Dynamic Meta Tags

```typescript
const CourseView = ({ course }) => {
  const seoData = useMemo(() => {
    if (!course) return null;
    
    return {
      title: `${course.mainTopic} - Learn with AI Generated Course`,
      description: `Comprehensive course on ${course.mainTopic}. Learn with structured lessons and practical examples.`,
      image: course.photo,
      url: `${window.location.origin}/course/${course.slug}`
    };
  }, [course]);

  return (
    <>
      <Helmet>
        <title>{seoData?.title}</title>
        <meta name="description" content={seoData?.description} />
        <link rel="canonical" href={seoData?.url} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoData?.title} />
        <meta property="og:description" content={seoData?.description} />
        <meta property="og:image" content={seoData?.image} />
        <meta property="og:url" content={seoData?.url} />
        <meta property="og:type" content="article" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoData?.title} />
        <meta name="twitter:description" content={seoData?.description} />
        <meta name="twitter:image" content={seoData?.image} />
      </Helmet>
      
      <CourseContent course={course} />
    </>
  );
};
```

## 📊 Performance Monitoring

### Error Tracking

```typescript
import { useErrorHandler } from '@/components/ErrorBoundary';

const CourseEditor = () => {
  const reportError = useErrorHandler();

  const handleSave = async () => {
    try {
      await saveCourse();
    } catch (error) {
      reportError(error, 'Course save operation failed');
      toast.error('Failed to save course');
    }
  };
};
```

These examples show how to effectively use the new SEO and UX features to create a professional, user-friendly application with proper error handling and performance optimization.