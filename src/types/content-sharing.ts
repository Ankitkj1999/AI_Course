import { Course } from './course';
import { Quiz } from './quiz';
import { FlashcardSet } from './flashcard';
import { Guide } from './guide';

// Union type for all content types
export type ContentItem = Course | Quiz | FlashcardSet | Guide;

// Content type discriminator
export type ContentType = 'course' | 'quiz' | 'flashcard' | 'guide';

// Public content response for unified endpoint
export interface PublicContentResponse {
  success: boolean;
  data: ContentItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Visibility response
export interface VisibilityResponse {
  success: boolean;
  isPublic: boolean;
  forkCount?: number;
}

// Fork response
export interface ForkResponse {
  success: boolean;
  message: string;
  forkedContent: {
    _id: string;
    slug: string;
    title: string;
  };
}

// Fork information response
export interface ForkInfoResponse {
  success: boolean;
  forkCount: number;
  forks: ForkRecord[];
}

// Individual fork record
export interface ForkRecord {
  userId: string;
  userName: string;
  forkedAt: string;
}

// Query parameters for public content discovery
export interface PublicContentQueryParams {
  type?: ContentType | 'all';
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'recent' | 'popular' | 'forks';
}

// Visibility filter for user content
export type VisibilityFilter = 'all' | 'public' | 'private';

// Request body for toggling visibility
export interface ToggleVisibilityRequest {
  isPublic: boolean;
}
