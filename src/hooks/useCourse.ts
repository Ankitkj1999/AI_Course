import { useState, useEffect, useCallback } from 'react';
import { CourseAPI, CourseHelpers } from '../services/courseApi';
import {
  Course,
  CourseContentResponse,
  CourseProgressResponse,
  Section
} from '../types/course';

export interface UseCourseListOptions {
  userId: string;
  page?: number;
  limit?: number;
  visibility?: 'all' | 'public' | 'private';
  autoLoad?: boolean;
}

export interface UseCourseListReturn {
  courses: Course[];
  loading: boolean;
  error: string | null;
  pagination: any;
  loadCourses: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing course list
 */
export function useCourseList(options: UseCourseListOptions): UseCourseListReturn {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const loadCourses = useCallback(async () => {
    if (!options.userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await CourseAPI.getCourses(options.userId, {
        page: options.page,
        limit: options.limit,
        visibility: options.visibility
      });
      
      if (response.success) {
        setCourses(response.courses);
        setPagination(response.pagination);
      } else {
        setError('Failed to load courses');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [options.userId, options.page, options.limit, options.visibility]);

  const refresh = useCallback(() => loadCourses(), [loadCourses]);

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadCourses();
    }
  }, [loadCourses, options.autoLoad]);

  return {
    courses,
    loading,
    error,
    pagination,
    loadCourses,
    refresh
  };
}

export interface UseCourseContentOptions {
  courseId: string;
  autoLoad?: boolean;
}

export interface UseCourseContentReturn {
  course: any;
  sections: Section[];
  architecture: 'section-based' | 'legacy' | 'empty' | null;
  loading: boolean;
  error: string | null;
  canMigrate: boolean;
  loadContent: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing course content with sections
 */
export function useCourseContent(options: UseCourseContentOptions): UseCourseContentReturn {
  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [architecture, setArchitecture] = useState<'section-based' | 'legacy' | 'empty' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canMigrate, setCanMigrate] = useState(false);

  const loadContent = useCallback(async () => {
    if (!options.courseId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await CourseAPI.getCourseContent(options.courseId);
      
      if (response.success) {
        setCourse(response.course);
        setSections(response.sections || []);
        setArchitecture(response.architecture);
        setCanMigrate(response.migrationAvailable || false);
      } else {
        setError('Failed to load course content');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load course content');
    } finally {
      setLoading(false);
    }
  }, [options.courseId]);

  const refresh = useCallback(() => loadContent(), [loadContent]);

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadContent();
    }
  }, [loadContent, options.autoLoad]);

  return {
    course,
    sections,
    architecture,
    loading,
    error,
    canMigrate,
    loadContent,
    refresh
  };
}

export interface UseCourseProgressOptions {
  courseId: string;
  autoLoad?: boolean;
}

export interface UseCourseProgressReturn {
  progress: any;
  language: string;
  loading: boolean;
  error: string | null;
  loadProgress: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing course progress
 */
export function useCourseProgress(options: UseCourseProgressOptions): UseCourseProgressReturn {
  const [progress, setProgress] = useState<any>(null);
  const [language, setLanguage] = useState<string>('English');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    if (!options.courseId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await CourseAPI.getCourseProgress(options.courseId);
      
      if (response.success) {
        setProgress(response.progress);
        setLanguage(response.language);
      } else {
        setError('Failed to load course progress');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load course progress');
    } finally {
      setLoading(false);
    }
  }, [options.courseId]);

  const refresh = useCallback(() => loadProgress(), [loadProgress]);

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadProgress();
    }
  }, [loadProgress, options.autoLoad]);

  return {
    progress,
    language,
    loading,
    error,
    loadProgress,
    refresh
  };
}

/**
 * Combined hook for course viewing (content + progress)
 */
export function useCourseViewer(courseId: string) {
  const contentHook = useCourseContent({ courseId });
  const progressHook = useCourseProgress({ courseId });

  const refresh = useCallback(async () => {
    await Promise.all([
      contentHook.refresh(),
      progressHook.refresh()
    ]);
  }, [contentHook.refresh, progressHook.refresh]);

  return {
    // Content data
    course: contentHook.course,
    sections: contentHook.sections,
    architecture: contentHook.architecture,
    canMigrate: contentHook.canMigrate,
    
    // Progress data
    progress: progressHook.progress,
    language: progressHook.language,
    
    // Loading states
    contentLoading: contentHook.loading,
    progressLoading: progressHook.loading,
    loading: contentHook.loading || progressHook.loading,
    
    // Errors
    contentError: contentHook.error,
    progressError: progressHook.error,
    error: contentHook.error || progressHook.error,
    
    // Actions
    refresh,
    refreshContent: contentHook.refresh,
    refreshProgress: progressHook.refresh
  };
}