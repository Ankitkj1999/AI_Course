export interface ForkedFrom {
  contentId: string | null;
  originalOwnerId: string | null;
  originalOwnerName: string | null;
  forkedAt: string | null;
}

export interface Guide {
  _id: string;
  userId: string;
  keyword: string;
  title: string;
  slug: string;
  content: string;
  relatedTopics: string[];
  deepDiveTopics: string[];
  questions: string[];
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

export interface GuideListResponse {
  success: boolean;
  guides: Guide[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface GuideResponse {
  success: boolean;
  guide: Guide;
}

export interface CreateGuideRequest {
  userId: string;
  keyword: string;
  title: string;
  customization?: string;
  provider?: string;
  model?: string;
  isPublic?: boolean;
}

export interface CreateGuideResponse {
  success: boolean;
  message: string;
  guideId: string;
  slug: string;
  guide: {
    title: string;
    keyword: string;
    relatedTopics: string[];
    deepDiveTopics: string[];
    questions: string[];
  };
}