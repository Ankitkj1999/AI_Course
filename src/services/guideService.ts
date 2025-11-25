import axios from 'axios';
import { serverURL } from '@/constants';
import { 
  Guide, 
  GuideListResponse, 
  GuideResponse, 
  CreateGuideRequest, 
  CreateGuideResponse 
} from '@/types/guide';
import type { 
  VisibilityResponse, 
  ToggleVisibilityRequest,
  PublicContentResponse,
  PublicContentQueryParams,
  ForkResponse,
  ForkInfoResponse
} from '@/types/content-sharing';

const API_BASE = `${serverURL}/api`;

export const guideService = {
  // Create a new guide
  async createGuide(data: CreateGuideRequest): Promise<CreateGuideResponse> {
    const response = await axios.post(`${API_BASE}/guide/create`, data, {
      withCredentials: true
    });
    return response.data;
  },

  // Create guide from document
  async createGuideFromDocument(data: {
    userId: string;
    processingId?: string;
    text?: string;
    title: string;
    customization?: string;
    provider?: string;
    model?: string;
    isPublic?: boolean;
  }): Promise<CreateGuideResponse> {
    const response = await axios.post(`${API_BASE}/guide/from-document`, data, {
      withCredentials: true
    });
    return response.data;
  },

  // Get user's guides with pagination
  async getUserGuides(userId: string, page: number = 1, limit: number = 10): Promise<GuideListResponse> {
    const response = await axios.get(`${API_BASE}/guides`, {
      params: { userId, page, limit },
      withCredentials: true
    });
    return response.data;
  },

  // Get guide by slug
  async getGuideBySlug(slug: string): Promise<GuideResponse> {
    const response = await axios.get(`${API_BASE}/guide/${slug}`, {
      withCredentials: true
    });
    return response.data;
  },

  // Delete guide
  async deleteGuide(slug: string, userId: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${API_BASE}/guide/${slug}`, {
      data: { userId },
      withCredentials: true
    });
    return response.data;
  },

  // Toggle guide visibility
  async toggleVisibility(slug: string, isPublic: boolean): Promise<VisibilityResponse> {
    const data: ToggleVisibilityRequest = { isPublic };
    const response = await axios.patch(`${API_BASE}/guide/${slug}/visibility`, data, {
      withCredentials: true
    });
    return response.data;
  },

  // Get guide visibility status
  async getVisibilityStatus(slug: string): Promise<VisibilityResponse> {
    const response = await axios.get(`${API_BASE}/guide/${slug}/visibility`, {
      withCredentials: true
    });
    return response.data;
  },

  // Get public guides
  async getPublicContent(params: PublicContentQueryParams = {}): Promise<PublicContentResponse> {
    const { page = 1, limit = 20, search = '', sortBy = 'recent' } = params;
    const response = await axios.get(`${API_BASE}/public/guide`, {
      params: { page, limit, search, sortBy },
      withCredentials: true
    });
    return response.data;
  },

  // Get single public guide by slug
  async getPublicContentBySlug(slug: string): Promise<GuideResponse> {
    const response = await axios.get(`${API_BASE}/public/guide/${slug}`, {
      withCredentials: true
    });
    return response.data;
  },

  // Fork a guide
  async forkContent(slug: string): Promise<ForkResponse> {
    const response = await axios.post(`${API_BASE}/guide/${slug}/fork`, {}, {
      withCredentials: true
    });
    return response.data;
  },

  // Get fork information for a guide
  async getForkInfo(slug: string): Promise<ForkInfoResponse> {
    const response = await axios.get(`${API_BASE}/guide/${slug}/forks`, {
      withCredentials: true
    });
    return response.data;
  }
};