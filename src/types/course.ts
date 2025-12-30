export interface ForkedFrom {
  contentId: string | null;
  originalOwnerId: string | null;
  originalOwnerName: string | null;
  forkedAt: string | null;
}

export interface GenerationMeta {
  userPrompt?: string;
  model?: string;
  generatedAt?: string;
  provider?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface SectionContent {
  markdown: string;
  html: string;
  lexical: any; // Lexical editor state object
}

export interface Section {
  _id: string;
  title: string;
  order: number;
  parentId: string | null;
  level: number;
  content: SectionContent;
  metadata?: any;
  createdAt: string;
}

export interface Course {
  _id: string;
  user: string; // Updated from userId to match API
  title?: string; // Optional title field
  mainTopic: string;
  type: string;
  slug: string;
  content?: string; // Optional for legacy courses
  description?: string; // New field for course cards
  photo: string;
  completed: boolean;
  end: string;
  date: string; // Updated from createdAt to match API
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  viewCount?: number;
  lastVisitedAt?: string;
  updatedAt?: string;
  // Visibility and fork fields
  isPublic: boolean;
  forkCount: number;
  forkedFrom?: ForkedFrom;
  ownerName: string;
  // New architecture fields
  hasContent?: boolean;
  generationMeta?: GenerationMeta;
  sections?: string[]; // Array of section IDs
}

export interface CourseListResponse {
  success: boolean;
  courses: Course[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CourseResponse {
  success: boolean;
  course: Course;
}

// New types for section-based architecture
export interface CourseContentResponse {
  success: boolean;
  architecture: 'section-based' | 'legacy' | 'empty';
  course: {
    _id: string;
    title: string;
    slug: string;
    mainTopic: string;
    type: string;
    photo: string;
    isPublic: boolean;
    createdAt: string;
    content?: string; // Add content field for legacy courses
    generationMeta?: GenerationMeta;
  };
  sections: Section[];
  sectionCount: number;
  migrationAvailable?: boolean;
  message?: string;
}

export interface CourseProgress {
  completedAt: string | null;
}

export interface CourseProgressResponse {
  success: boolean;
  courseId: string;
  progress: CourseProgress;
  language: string;
  course: {
    title: string;
    slug: string;
    isPublic: boolean;
  };
}

export interface CreateCourseRequest {
  user: string; // Updated from userId to match API
  mainTopic: string;
  type: string;
  content: string;
  lang?: string;
  isPublic?: boolean;
  customization?: string;
  provider?: string;
  model?: string;
}

export interface CreateCourseResponse {
  success: boolean;
  message: string;
  courseId: string;
  slug: string;
  isPublic?: boolean;
  sectionsCreated?: number;
  architecture?: 'section-based' | 'legacy';
  course?: {
    mainTopic: string;
    type: string;
    content: string;
  };
}

// Course architecture info
export interface CourseArchitectureResponse {
  success: boolean;
  courseId: string;
  title: string;
  architecture: {
    isNewArchitecture: boolean;
    isLegacyCourse: boolean;
    hasContent: boolean;
    hasSections: boolean;
    sectionCount: number;
    needsMigration: boolean;
  };
  generationMeta?: GenerationMeta;
}
