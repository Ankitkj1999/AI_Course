import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { Course, Section } from '../models/index.js';

/**
 * Database Optimization Service
 * Handles performance optimizations for the course schema redesign
 */
class DatabaseOptimizationService {
    constructor() {
        this.cacheEnabled = process.env.NODE_ENV === 'production';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Initialize all database optimizations
     */
    async initialize() {
        try {
            logger.info('🔧 Initializing database optimizations...');
            
            await this.createOptimizedIndexes();
            await this.setupAggregationPipelines();
            await this.initializeCaching();
            
            logger.info('✅ Database optimizations initialized successfully');
        } catch (error) {
            logger.error('❌ Failed to initialize database optimizations:', error);
            throw error;
        }
    }

    /**
     * Create optimized database indexes for efficient querying
     */
    async createOptimizedIndexes() {
        logger.info('📊 Creating optimized database indexes...');

        try {
            // Course indexes for efficient queries
            const courseIndexes = [
                // User-specific course queries with sorting
                { user: 1, createdAt: -1 },
                { user: 1, status: 1, createdAt: -1 },
                
                // Public course discovery
                { isPublic: 1, type: 1, createdAt: -1 },
                { isPublic: 1, viewCount: -1 },
                { isPublic: 1, forkCount: -1 },
                
                // Course search and filtering
                { status: 1, type: 1, createdAt: -1 },
                { 'stats.totalWords': -1, isPublic: 1 },
                { 'stats.estimatedReadTime': 1, isPublic: 1 },
                
                // Forking and social features
                { 'forkedFrom.originalOwnerId': 1, createdAt: -1 },
                { ownerName: 1, isPublic: 1 }
            ];

            // Section indexes for hierarchical queries
            const sectionIndexes = [
                // Core hierarchical queries
                { courseId: 1, parentId: 1, order: 1 },
                { courseId: 1, path: 1 },
                { courseId: 1, level: 1, order: 1 },
                
                // Content-based queries
                { courseId: 1, hasContent: 1, order: 1 },
                { courseId: 1, 'content.primaryFormat': 1 },
                
                // Statistics and performance queries
                { courseId: 1, wordCount: -1 },
                { courseId: 1, readTime: 1 },
                
                // Settings and display queries
                { courseId: 1, 'settings.showInTOC': 1, order: 1 },
                { courseId: 1, 'settings.isExpanded': 1 }
            ];

            // Create Course indexes
            for (const index of courseIndexes) {
                try {
                    await Course.collection.createIndex(index, { background: true });
                    logger.debug(`✓ Created Course index: ${JSON.stringify(index)}`);
                } catch (error) {
                    if (error.code !== 85) { // Index already exists
                        logger.warn(`⚠️ Failed to create Course index ${JSON.stringify(index)}:`, error.message);
                    }
                }
            }

            // Create Section indexes
            for (const index of sectionIndexes) {
                try {
                    await Section.collection.createIndex(index, { background: true });
                    logger.debug(`✓ Created Section index: ${JSON.stringify(index)}`);
                } catch (error) {
                    if (error.code !== 85) { // Index already exists
                        logger.warn(`⚠️ Failed to create Section index ${JSON.stringify(index)}:`, error.message);
                    }
                }
            }

            logger.info('✅ Database indexes created successfully');
        } catch (error) {
            logger.error('❌ Failed to create database indexes:', error);
            throw error;
        }
    }

    /**
     * Setup aggregation pipelines for course statistics
     */
    async setupAggregationPipelines() {
        logger.info('🔄 Setting up aggregation pipelines...');

        // Create aggregation pipeline for course statistics
        this.courseStatsPipeline = [
            {
                $lookup: {
                    from: 'sections',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'courseSections'
                }
            },
            {
                $addFields: {
                    'stats.totalSections': { $size: '$courseSections' },
                    'stats.totalWords': { $sum: '$courseSections.wordCount' },
                    'stats.estimatedReadTime': {
                        $ceil: { $divide: [{ $sum: '$courseSections.wordCount' }, 200] }
                    }
                }
            },
            {
                $project: {
                    courseSections: 0 // Remove the temporary field
                }
            }
        ];

        // Create aggregation pipeline for section hierarchy
        this.sectionHierarchyPipeline = [
            {
                $match: { courseId: null } // Will be replaced with actual courseId
            },
            {
                $sort: { level: 1, order: 1 }
            },
            {
                $group: {
                    _id: '$level',
                    sections: { $push: '$$ROOT' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ];

        logger.info('✅ Aggregation pipelines configured');
    }

    /**
     * Initialize caching layer for frequently accessed content
     */
    async initializeCaching() {
        if (!this.cacheEnabled) {
            logger.info('📦 Caching disabled in development mode');
            return;
        }

        logger.info('📦 Initializing caching layer...');

        // Set up cache cleanup interval
        this.cacheCleanupInterval = setInterval(() => {
            this.cleanupExpiredCache();
        }, 60000); // Clean up every minute

        logger.info('✅ Caching layer initialized');
    }

    /**
     * Get course with optimized section loading
     */
    async getCourseWithSections(courseId, options = {}) {
        const cacheKey = `course:${courseId}:${JSON.stringify(options)}`;
        
        // Check cache first
        if (this.cacheEnabled) {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                logger.debug(`📦 Cache hit for course ${courseId}`);
                return cached;
            }
        }

        try {
            // Use aggregation for efficient loading
            const pipeline = [
                { $match: { _id: new mongoose.Types.ObjectId(courseId) } },
                {
                    $lookup: {
                        from: 'sections',
                        let: { courseId: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$courseId', '$$courseId'] } } },
                            { $sort: { path: 1 } },
                            ...(options.includeContent ? [] : [
                                { $project: { 'content.markdown.text': 0, 'content.html.text': 0, 'content.lexical.editorState': 0 } }
                            ])
                        ],
                        as: 'sections'
                    }
                }
            ];

            const result = await Course.aggregate(pipeline);
            const course = result[0] || null;

            // Cache the result
            if (this.cacheEnabled && course) {
                this.setCache(cacheKey, course);
            }

            return course;
        } catch (error) {
            logger.error(`❌ Failed to get course with sections ${courseId}:`, error);
            throw error;
        }
    }

    /**
     * Get section hierarchy for a course
     */
    async getSectionHierarchy(courseId, options = {}) {
        const cacheKey = `hierarchy:${courseId}:${JSON.stringify(options)}`;
        
        // Check cache first
        if (this.cacheEnabled) {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                logger.debug(`📦 Cache hit for hierarchy ${courseId}`);
                return cached;
            }
        }

        try {
            const pipeline = [
                { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
                { $sort: { level: 1, order: 1 } },
                ...(options.tocOnly ? [
                    { $match: { 'settings.showInTOC': true } }
                ] : []),
                ...(options.contentOnly ? [
                    { $match: { hasContent: true } }
                ] : []),
                {
                    $group: {
                        _id: '$level',
                        sections: { $push: '$$ROOT' }
                    }
                },
                { $sort: { _id: 1 } }
            ];

            const hierarchy = await Section.aggregate(pipeline);

            // Cache the result
            if (this.cacheEnabled) {
                this.setCache(cacheKey, hierarchy);
            }

            return hierarchy;
        } catch (error) {
            logger.error(`❌ Failed to get section hierarchy for course ${courseId}:`, error);
            throw error;
        }
    }

    /**
     * Update course statistics efficiently
     */
    async updateCourseStatistics(courseId) {
        try {
            const pipeline = [
                { $match: { _id: new mongoose.Types.ObjectId(courseId) } },
                ...this.courseStatsPipeline
            ];

            const result = await Course.aggregate(pipeline);
            if (result.length > 0) {
                const stats = result[0].stats;
                await Course.findByIdAndUpdate(courseId, { stats });
                
                // Invalidate cache
                this.invalidateCourseCache(courseId);
                
                logger.debug(`📊 Updated statistics for course ${courseId}`);
                return stats;
            }
        } catch (error) {
            logger.error(`❌ Failed to update course statistics ${courseId}:`, error);
            throw error;
        }
    }

    /**
     * Bulk update course statistics
     */
    async bulkUpdateCourseStatistics(courseIds = null) {
        try {
            logger.info('📊 Starting bulk course statistics update...');

            const matchStage = courseIds 
                ? { $match: { _id: { $in: courseIds.map(id => new mongoose.Types.ObjectId(id)) } } }
                : { $match: {} };

            const pipeline = [
                matchStage,
                ...this.courseStatsPipeline,
                {
                    $merge: {
                        into: 'courses',
                        whenMatched: 'merge'
                    }
                }
            ];

            await Course.aggregate(pipeline);
            
            // Clear all course caches
            this.clearCourseCache();
            
            logger.info('✅ Bulk course statistics update completed');
        } catch (error) {
            logger.error('❌ Failed to bulk update course statistics:', error);
            throw error;
        }
    }

    /**
     * Cache management methods
     */
    setCache(key, value) {
        if (!this.cacheEnabled) return;
        
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    getFromCache(key) {
        if (!this.cacheEnabled) return null;
        
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        // Check if expired
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.value;
    }

    invalidateCourseCache(courseId) {
        if (!this.cacheEnabled) return;
        
        // Remove all cache entries related to this course
        for (const key of this.cache.keys()) {
            if (key.includes(`course:${courseId}`) || key.includes(`hierarchy:${courseId}`)) {
                this.cache.delete(key);
            }
        }
    }

    clearCourseCache() {
        if (!this.cacheEnabled) return;
        
        // Clear all course-related cache entries
        for (const key of this.cache.keys()) {
            if (key.startsWith('course:') || key.startsWith('hierarchy:')) {
                this.cache.delete(key);
            }
        }
    }

    cleanupExpiredCache() {
        if (!this.cacheEnabled) return;
        
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, cached] of this.cache.entries()) {
            if (now - cached.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            logger.debug(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            enabled: this.cacheEnabled,
            size: this.cache.size,
            timeout: this.cacheTimeout
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.cacheCleanupInterval) {
            clearInterval(this.cacheCleanupInterval);
        }
        this.cache.clear();
        logger.info('🧹 Database optimization service cleaned up');
    }
}

// Create singleton instance
const databaseOptimizationService = new DatabaseOptimizationService();

export default databaseOptimizationService;