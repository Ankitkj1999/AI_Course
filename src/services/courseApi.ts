import axios from 'axios';
import {
  CourseListResponse,
  CourseContentResponse,
  CourseProgressResponse,
  CourseArchitectureResponse,
  CreateCourseRequest,
  CreateCourseResponse,
  LegacyCourseResultResponse,
  Course
} from '../types/course';
import { serverURL } from '../constants';

// Create axios instance with default config - using serverURL like other APIs
const api = axios.create({
  baseURL: `${serverURL}/api`,
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class CourseAPI {
  /**
   * Get list of courses for a user
   */
  static async getCourses(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      visibility?: 'all' | 'public' | 'private';
    } = {}
  ): Promise<CourseListResponse> {
    const { page = 1, limit = 9, visibility = 'all' } = options;
    const response = await api.get('/courses', {
      params: { userId, page, limit, visibility }
    });
    return response.data;
  }

  /**
   * Get course content with sections (new architecture)
   */
  static async getCourseContent(courseId: string): Promise<CourseContentResponse> {
    const response = await api.get(`/course/${courseId}/content`);
    return response.data;
  }

  /**
   * Get course progress and exam results
   */
  static async getCourseProgress(courseId: string): Promise<CourseProgressResponse> {
    const response = await api.get(`/course/${courseId}/progress`);
    return response.data;
  }

  /**
   * Get course architecture information
   */
  static async getCourseArchitecture(courseId: string): Promise<CourseArchitectureResponse> {
    const response = await api.get(`/course/architecture/${courseId}`);
    return response.data;
  }

  /**
   * Create a new course
   */
  static async createCourse(courseData: CreateCourseRequest): Promise<CreateCourseResponse> {
    const response = await api.post('/course', courseData);
    return response.data;
  }

  /**
   * Convert legacy course to new architecture
   */
  static async convertLegacyCourse(courseId: string): Promise<CreateCourseResponse> {
    const response = await api.post(`/course/convert/${courseId}`);
    return response.data;
  }

  /**
   * Get course by slug (legacy endpoint)
   */
  static async getCourseBySlug(slug: string) {
    const response = await api.get(`/course/${slug}`);
    return response.data;
  }

  /**
   * @deprecated Use getCourseProgress instead
   * Legacy endpoint for backward compatibility
   */
  static async getLegacyCourseResult(courseId: string): Promise<LegacyCourseResultResponse> {
    console.warn('getLegacyCourseResult is deprecated. Use getCourseProgress instead.');
    const response = await api.post('/getmyresult', { courseId });
    return response.data;
  }
}

// Helper functions for common use cases
export class CourseHelpers {
  /**
   * Check if a course uses the new section-based architecture
   */
  static isNewArchitecture(course: Course): boolean {
    return course.sections && course.sections.length > 0 && !course.content;
  }

  /**
   * Check if a course is legacy and needs migration
   */
  static isLegacyCourse(course: Course): boolean {
    return !!course.content && (!course.sections || course.sections.length === 0);
  }

  /**
   * Get course display title
   */
  static getDisplayTitle(course: Course): string {
    return course.title || course.mainTopic || 'Untitled Course';
  }

  /**
   * Get course description for cards
   */
  static getDescription(course: Course): string {
    if (course.description) return course.description;
    if (course.mainTopic) return course.mainTopic;
    return 'No description available';
  }

  /**
   * Handle course content based on architecture
   */
  static async loadCourseForViewing(courseId: string) {
    try {
      const contentResponse = await CourseAPI.getCourseContent(courseId);
      
      switch (contentResponse.architecture) {
        case 'section-based':
          return {
            type: 'sections',
            course: contentResponse.course,
            sections: contentResponse.sections,
            canMigrate: false
          };
          
        case 'legacy':
          return {
            type: 'legacy',
            course: contentResponse.course,
            content: contentResponse.course.content, // Legacy content
            canMigrate: contentResponse.migrationAvailable || false
          };
          
        case 'empty':
          return {
            type: 'empty',
            course: contentResponse.course,
            message: contentResponse.message
          };
          
        default:
          throw new Error('Unknown course architecture');
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      throw error;
    }
  }
}

export default CourseAPI;