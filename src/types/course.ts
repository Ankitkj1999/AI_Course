export interface ForkedFrom {
  contentId: string | null;
  originalOwnerId: string | null;
  originalOwnerName: string | null;
  forkedAt: string | null;
}

export interface Course {
  _id: string;
  userId: string;
  mainTopic: string;
  type: string;
  slug: string;
  content: string;
  photo: string;
  completed: boolean;
  end: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  viewCount: number;
  lastVisitedAt: string;
  createdAt: string;
  updatedAt: string;
  // Visibility and fork fields
  isPublic: boolean;
  forkCount: number;
  forkedFrom?: ForkedFrom;
  ownerName: string;
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

export interface CreateCourseRequest {
  userId: string;
  mainTopic: string;
  type: string;
  customization?: string;
  provider?: string;
  model?: string;
}

export interface CreateCourseResponse {
  success: boolean;
  message: string;
  courseId: string;
  slug: string;
  course: {
    mainTopic: string;
    type: string;
    content: string;
  };
}
