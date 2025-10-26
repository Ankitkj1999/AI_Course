import axios from 'axios';
import { serverURL } from '@/constants';
import { 
  FlashcardSet, 
  FlashcardListResponse, 
  FlashcardResponse, 
  CreateFlashcardRequest, 
  CreateFlashcardResponse 
} from '@/types/flashcard';

const API_BASE = `${serverURL}/api`;

export const flashcardService = {
  // Create a new flashcard set
  async createFlashcardSet(data: CreateFlashcardRequest): Promise<CreateFlashcardResponse> {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_BASE}/flashcard/create`, data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Get user's flashcard sets with pagination
  async getUserFlashcards(userId: string, page: number = 1, limit: number = 10): Promise<FlashcardListResponse> {
    const response = await axios.get(`${API_BASE}/flashcards`, {
      params: { userId, page, limit }
    });
    return response.data;
  },

  // Get flashcard set by slug
  async getFlashcardBySlug(slug: string): Promise<FlashcardResponse> {
    const response = await axios.get(`${API_BASE}/flashcard/${slug}`);
    return response.data;
  },

  // Delete flashcard set
  async deleteFlashcard(slug: string, userId: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${API_BASE}/flashcard/${slug}`, {
      data: { userId }
    });
    return response.data;
  }
};