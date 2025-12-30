import { ForkedFrom } from './course';

export interface FlashcardType {
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export interface FlashcardSet {
  _id: string;
  userId: string;
  keyword: string;
  title: string;
  slug: string;
  content: string;
  cards: FlashcardType[];
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  viewCount: number;
  lastVisitedAt: string;
  createdAt: string;
  updatedAt: string;
  cardCount?: number;
  // Visibility and fork fields
  isPublic: boolean;
  forkCount: number;
  forkedFrom?: ForkedFrom;
  ownerName: string;
}

export interface FlashcardListResponse {
  success: boolean;
  flashcards: FlashcardSet[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FlashcardResponse {
  success: boolean;
  flashcard: FlashcardSet;
}

export interface CreateFlashcardRequest {
  userId: string;
  keyword: string;
  title: string;
  provider?: string;
  model?: string;
  isPublic?: boolean;
}

export interface CreateFlashcardResponse {
  success: boolean;
  message: string;
  flashcardId: string;
  slug: string;
  cards: FlashcardType[];
}