import axios from 'axios';
import { serverURL } from '@/constants';
import { 
  FlashcardSet, 
  FlashcardListResponse, 
  FlashcardResponse, 
  CreateFlashcardRequest, 
  CreateFlashcardResponse 
} from '@/types/flashcard';
import type { 
  VisibilityResponse, 
  ToggleVisibilityRequest,
  PublicContentResponse,
  PublicContentQueryParams,
  ForkResponse,
  ForkInfoResponse
} from '@/types/content-sharing';

const API_BASE = `${serverURL}/api`;

export const flashcardService = {
  // Create a new flashcard set
  async createFlashcardSet(data: CreateFlashcardRequest): Promise<CreateFlashcardResponse> {
    const response = await axios.post(`${API_BASE}/flashcard/create`, data, {
      withCredentials: true
    });
    return response.data;
  },

  // Create flashcard set from document
  async createFlashcardSetFromDocument(data: {
    userId: string;
    processingId?: string;
    text?: string;
    title: string;
    provider?: string;
    model?: string;
    isPublic?: boolean;
  }): Promise<CreateFlashcardResponse> {
    const response = await axios.post(`${API_BASE}/flashcard/from-document`, data, {
      withCredentials: true
    });
    return response.data;
  },

  // Get user's flashcard sets with pagination
  async getUserFlashcards(userId: string, page: number = 1, limit: number = 10, visibility: 'all' | 'public' | 'private' = 'all'): Promise<FlashcardListResponse> {
    const response = await axios.get(`${API_BASE}/flashcards`, {
      params: { userId, page, limit, visibility },
      withCredentials: true
    });
    return response.data;
  },

  // Get flashcard set by slug
  async getFlashcardBySlug(slug: string): Promise<FlashcardResponse> {
    const response = await axios.get(`${API_BASE}/flashcard/${slug}`, {
      withCredentials: true
    });
    return response.data;
  },

  // Delete flashcard set
  async deleteFlashcard(slug: string, userId: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${API_BASE}/flashcard/${slug}`, {
      data: { userId },
      withCredentials: true
    });
    return response.data;
  },

  // Toggle flashcard visibility
  async toggleVisibility(slug: string, isPublic: boolean): Promise<VisibilityResponse> {
    const data: ToggleVisibilityRequest = { isPublic };
    const response = await axios.patch(`${API_BASE}/flashcard/${slug}/visibility`, data, {
      withCredentials: true
    });
    return response.data;
  },

  // Get flashcard visibility status
  async getVisibilityStatus(slug: string): Promise<VisibilityResponse> {
    const response = await axios.get(`${API_BASE}/flashcard/${slug}/visibility`, {
      withCredentials: true
    });
    return response.data;
  },

  // Get public flashcard sets
  async getPublicContent(params: PublicContentQueryParams = {}): Promise<PublicContentResponse> {
    const { page = 1, limit = 20, search = '', sortBy = 'recent' } = params;
    const response = await axios.get(`${API_BASE}/public/flashcard`, {
      params: { page, limit, search, sortBy },
      withCredentials: true
    });
    return response.data;
  },

  // Get single public flashcard set by slug
  async getPublicContentBySlug(slug: string): Promise<FlashcardResponse> {
    const response = await axios.get(`${API_BASE}/public/flashcard/${slug}`, {
      withCredentials: true
    });
    return response.data;
  },

  // Fork a flashcard set
  async forkContent(slug: string): Promise<ForkResponse> {
    const response = await axios.post(`${API_BASE}/flashcard/${slug}/fork`, {}, {
      withCredentials: true
    });
    return response.data;
  },

  // Get fork information for a flashcard set
  async getForkInfo(slug: string): Promise<ForkInfoResponse> {
    const response = await axios.get(`${API_BASE}/flashcard/${slug}/forks`, {
      withCredentials: true
    });
    return response.data;
  }
};