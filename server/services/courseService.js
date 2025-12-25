import { Course, Section } from '../models/index.js';
import mongoose from 'mongoose';
import { generateSlug, generateUniqueSlug } from '../utils/slugify.js';
import logger from '../utils/logger.js';
import databaseOptimizationService from './databaseOptimization.js';
import queryOptimizationService from './queryOptimization.js';
import cachingService from './cachingService.js';

/**
 * Course Management Service
 * Provides utilities for managing courses with the new schema
 */
class CourseService {
    
    /**
     * Create a new course with enhanced metadata
     */
    static async createCourse(courseData, userId) {
        const {
            title,
            type = 'guide',
            mainTopic,
            photo,
            content,
            settings = {},
            generationMeta = {},
            isPublic = false
        } = courseData;
        
        // Generate unique slug
        const baseSlug = generateSlug(title);
        const slug = await generateUniqueSlug(baseSlug, Course);
        
        // Set default settings
        const defaultSettings = {
            maxNestingDepth: 3,
            allowComments: true,
            showTableOfContents: true,
            structure: 'hierarchical'
        };
        
        const course = new Course({
            user: userId,
            title,
            slug,
            type,
            mainTopic,
            photo,
            content, // Legacy content field for backward compatibility
            settings: { ...defaultSettings, ...settings },
            generationMeta: {
                ...generationMeta,
                generatedAt: new Date(),
                lastModified: new Date()
            },
            isPublic,
            status: 'draft',
            stats: {
                totalSections: 0,
                totalWords: 0,
                estimatedReadTime: 0
            }
        });
        
        await course.save();
        return course;
    }
    
    /**
     * Update course with validation and statistics recalculation
     */
    static async updateCourse(courseId, updateData, userId) {
        const course = await Course.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        
        if (course.user !== userId) {
            throw new Error('Not authorized to update this course');
        }
        
        // Handle slug update if title changed
        if (updateData.title && updateData.title !== course.title) {
            const baseSlug = generateSlug(updateData.title);
            updateData.slug = await generateUniqueSlug(baseSlug, Course, courseId);
        }
        
        // Update fields
        Object.assign(course, updateData);
        
        // Update last modified timestamp
        if (course.generationMeta) {
            course.generationMeta.lastModified = new Date();
        }
        
        await course.save();
        return course;
    }
    
    /**
     * Fork a course with all its sections
     */
    static async forkCourse(originalCourseId, userId, userDisplayName) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const originalCourse = await Course.findById(originalCourseId).session(session);
            if (!originalCourse) {
                throw new Error('Original course not found');
            }
            
            if (!originalCourse.isPublic && originalCourse.user !== userId) {
                throw new Error('Cannot fork private course');
            }
            
            // Create forked course
            const forkedCourse = new Course({
                ...originalCourse.toObject(),
                _id: new mongoose.Types.ObjectId(),
                user: userId,
                slug: await generateUniqueSlug(originalCourse.slug + '-fork', Course),
                sections: [], // Will be populated with new section IDs
                forkedFrom: {
                    contentId: originalCourseId,
                    originalOwnerId: originalCourse.user,
                    originalOwnerName: originalCourse.ownerName,
                    forkedAt: new Date()
                },
                ownerName: userDisplayName,
                isPublic: false, // Forks start as private
                forkCount: 0,
                viewCount: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            await forkedCourse.save({ session });
            
            // Fork all sections
            const originalSections = await Section.find({ courseId: originalCourseId }).session(session);
            const sectionIdMap = new Map(); // Map original ID to new ID
            
            // Create new sections
            for (const originalSection of originalSections) {
                const newSection = new Section({
                    ...originalSection.toObject(),
                    _id: new mongoose.Types.ObjectId(),
                    courseId: forkedCourse._id,
                    parentId: null, // Will be updated in second pass
                    children: [], // Will be updated in second pass
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                await newSection.save({ session });
                sectionIdMap.set(originalSection._id.toString(), newSection._id);
                forkedCourse.sections.push(newSection._id);
            }
            
            // Update parent-child relationships
            for (const originalSection of originalSections) {
                const newSectionId = sectionIdMap.get(originalSection._id.toString());
                const newSection = await Section.findById(newSectionId).session(session);
                
                if (originalSection.parentId) {
                    newSection.parentId = sectionIdMap.get(originalSection.parentId.toString());
                }
                
                newSection.children = originalSection.children.map(childId => 
                    sectionIdMap.get(childId.toString())
                ).filter(Boolean);
                
                await newSection.save({ session });
            }
            
            // Update original course fork count
            await Course.findByIdAndUpdate(
                originalCourseId,
                { $inc: { forkCount: 1 } },
                { session }
            );
            
            await forkedCourse.save({ session });
            await session.commitTransaction();
            
            return forkedCourse;
            
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
    
    /**
     * Get course with populated sections in hierarchical order (OPTIMIZED)
     */
    static async getCourseWithSections(courseId, options = {}) {
        const { 
            includeContent = true, 
            maxDepth = null,
            userId = null 
        } = options;
        
        // Use optimized database service for better performance
        try {
            const course = await databaseOptimizationService.getCourseWithSections(courseId, {
                includeContent,
                maxDepth,
                userId
            });
            
            if (!course) {
                throw new Error('Course not found');
            }
            
            // Check access permissions
            if (!course.isPublic && course.user !== userId) {
                throw new Error('Access denied to private course');
            }
            
            return course;
        } catch (error) {
            logger.error(`Failed to get course with sections ${courseId}:`, error);
            throw error;
        }
    }
    
    /**
     * Get courses with optimized pagination and filtering
     */
    static async getCoursesOptimized(options = {}) {
        try {
            return await queryOptimizationService.getCourses(options);
        } catch (error) {
            logger.error('Failed to get courses with optimization:', error);
            throw error;
        }
    }
    
    /**
     * Get section hierarchy with caching
     */
    static async getSectionHierarchy(courseId, options = {}) {
        const cacheKey = `hierarchy:${courseId}:${JSON.stringify(options)}`;
        
        return await cachingService.getOrSet(cacheKey, async () => {
            return await databaseOptimizationService.getSectionHierarchy(courseId, options);
        }, {
            ttl: 15 * 60 * 1000, // 15 minutes
            tags: [`course:${courseId}`, 'hierarchy']
        });
    }
    
    /**
     * Get course statistics with caching and optimization
     */
    static async getCourseStatistics(courseId) {
        const cacheKey = `stats:${courseId}`;
        
        return await cachingService.getOrSet(cacheKey, async () => {
            return await queryOptimizationService.getCourseStatistics(courseId);
        }, {
            ttl: 30 * 60 * 1000, // 30 minutes
            tags: [`course:${courseId}`, 'stats']
        });
    }
    
    /**
     * Search sections within a course with optimization
     */
    static async searchSections(courseId, searchTerm, options = {}) {
        const cacheKey = `search:${courseId}:${searchTerm}:${JSON.stringify(options)}`;
        
        return await cachingService.getOrSet(cacheKey, async () => {
            return await queryOptimizationService.searchSections(courseId, searchTerm, options);
        }, {
            ttl: 2 * 60 * 1000, // 2 minutes (shorter for search results)
            tags: [`course:${courseId}`, 'search']
        });
    }
    
    /**
     * Get table of contents with caching
     */
    static async getTableOfContents(courseId, options = {}) {
        const cacheKey = `toc:${courseId}:${JSON.stringify(options)}`;
        
        return await cachingService.getOrSet(cacheKey, async () => {
            return await queryOptimizationService.getTableOfContents(courseId, options);
        }, {
            ttl: 20 * 60 * 1000, // 20 minutes
            tags: [`course:${courseId}`, 'toc']
        });
    }
    
    /**
     * Update course statistics efficiently with cache invalidation
     */
    static async updateCourseStatsOptimized(courseId) {
        try {
            const stats = await databaseOptimizationService.updateCourseStatistics(courseId);
            
            // Invalidate related cache entries
            cachingService.invalidateByTags([`course:${courseId}`]);
            
            logger.info(`Updated statistics for course ${courseId}`);
            return stats;
        } catch (error) {
            logger.error(`Failed to update course statistics ${courseId}:`, error);
            throw error;
        }
    }
    
    /**
     * Bulk update course statistics
     */
    static async bulkUpdateCourseStats(courseIds = null) {
        try {
            await databaseOptimizationService.bulkUpdateCourseStatistics(courseIds);
            
            // Clear all course caches if updating all courses
            if (!courseIds) {
                cachingService.invalidateByPattern('course:');
            } else {
                // Invalidate specific course caches
                courseIds.forEach(courseId => {
                    cachingService.invalidateByTags([`course:${courseId}`]);
                });
            }
            
            logger.info('Bulk course statistics update completed');
        } catch (error) {
            logger.error('Failed to bulk update course statistics:', error);
            throw error;
        }
    }
    
    /**
     * Build hierarchical section structure
     */
    static buildSectionHierarchy(sections) {
        const sectionMap = new Map();
        const rootSections = [];
        
        // Create map and initialize children arrays
        sections.forEach(section => {
            section.children = [];
            sectionMap.set(section._id.toString(), section);
        });
        
        // Build hierarchy
        sections.forEach(section => {
            if (section.parentId) {
                const parent = sectionMap.get(section.parentId.toString());
                if (parent) {
                    parent.children.push(section);
                }
            } else {
                rootSections.push(section);
            }
        });
        
        return rootSections;
    }
    
    /**
     * Update course statistics based on sections
     */
    static async updateCourseStats(courseId) {
        const course = await Course.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        
        await course.calculateStats();
        await course.save();
        
        return course.stats;
    }
    
    /**
     * Get course analytics and insights
     */
    static async getCourseAnalytics(courseId, userId) {
        const course = await Course.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        
        if (course.user !== userId) {
            throw new Error('Not authorized to view analytics');
        }
        
        const sections = await Section.find({ courseId });
        
        // Calculate analytics
        const analytics = {
            overview: {
                totalSections: sections.length,
                totalWords: sections.reduce((sum, s) => sum + (s.wordCount || 0), 0),
                estimatedReadTime: Math.ceil(sections.reduce((sum, s) => sum + (s.wordCount || 0), 0) / 200),
                lastModified: course.updatedAt
            },
            structure: {
                maxDepth: Math.max(...sections.map(s => s.level), 0),
                rootSections: sections.filter(s => !s.parentId).length,
                sectionsWithContent: sections.filter(s => s.hasContent).length,
                sectionsWithChildren: sections.filter(s => s.hasChildren).length
            },
            content: {
                primaryFormats: {
                    markdown: sections.filter(s => s.content?.primaryFormat === 'markdown').length,
                    lexical: sections.filter(s => s.content?.primaryFormat === 'lexical').length
                },
                averageWordsPerSection: sections.length > 0 ? 
                    Math.round(sections.reduce((sum, s) => sum + (s.wordCount || 0), 0) / sections.length) : 0
            },
            engagement: {
                viewCount: course.viewCount || 0,
                forkCount: course.forkCount || 0,
                isPublic: course.isPublic
            }
        };
        
        return analytics;
    }
    
    /**
     * Search courses with enhanced filtering
     */
    static async searchCourses(query, options = {}) {
        const {
            userId = null,
            type = null,
            status = null,
            isPublic = null,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            limit = 20,
            skip = 0
        } = options;
        
        const searchQuery = {};
        
        // Text search
        if (query) {
            searchQuery.$or = [
                { title: { $regex: query, $options: 'i' } },
                { mainTopic: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } }
            ];
        }
        
        // Filters
        if (userId) searchQuery.user = userId;
        if (type) searchQuery.type = type;
        if (status) searchQuery.status = status;
        if (isPublic !== null) searchQuery.isPublic = isPublic;
        
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const courses = await Course.find(searchQuery)
            .sort(sortOptions)
            .limit(limit)
            .skip(skip)
            .select('-content -sections'); // Exclude large fields for list view
        
        const total = await Course.countDocuments(searchQuery);
        
        return {
            courses,
            pagination: {
                total,
                limit,
                skip,
                hasMore: skip + limit < total
            }
        };
    }
    
    /**
     * Delete course and all associated sections
     */
    static async deleteCourse(courseId, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const course = await Course.findById(courseId).session(session);
            if (!course) {
                throw new Error('Course not found');
            }
            
            if (course.user !== userId) {
                throw new Error('Not authorized to delete this course');
            }
            
            // Delete all sections
            await Section.deleteMany({ courseId }, { session });
            
            // Delete the course
            await Course.findByIdAndDelete(courseId).session(session);
            
            await session.commitTransaction();
            return { success: true, deletedCourseId: courseId };
            
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

export default CourseService;