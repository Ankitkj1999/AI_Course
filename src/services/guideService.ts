import axios from 'axios';
import { serverURL } from '@/constants';
import { 
  Guide, 
  GuideListResponse, 
  GuideResponse, 
  CreateGuideRequest, 
  CreateGuideResponse 
} from '@/types/guide';

const API_BASE = `${serverURL}/api`;

export const guideService = {
  // Create a new guide
  async createGuide(data: CreateGuideRequest): Promise<CreateGuideResponse> {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_BASE}/guide/create`, data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Get user's guides with pagination
  async getUserGuides(userId: string, page: number = 1, limit: number = 10): Promise<GuideListResponse> {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE}/guides`, {
      params: { userId, page, limit },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Get guide by slug
  async getGuideBySlug(slug: string): Promise<GuideResponse> {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE}/guide/${slug}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Delete guide
  async deleteGuide(slug: string, userId: string): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_BASE}/guide/${slug}`, {
      data: { userId },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};