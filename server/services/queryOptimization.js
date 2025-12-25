import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { Course, Section } from '../models/index.js';

/**
 * Query Optimization Service
 * Provides optimized query methods for hierarchical data
 */
class QueryOptimizationService {
    
    /**
     * Get courses with optimized pagination and filtering
     */
    async getCourses(options = {}) {
        const {
            userId,
            isPublic,
            type,
            status,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = -1,
            includeStats = false,
            search
        } = options;

        try {
            // Build match conditions
            const matchConditions = {};
            
            if (userId) matchConditions.user = userId;
            if (typeof isPublic === 'boolean') matchConditions.isPublic = isPublic;
            if (type) matchConditions.type = type;
            if (status) matchConditions.status = status;
            
            // Add search conditions
            if (search) {
                matchConditions.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { mainTopic: { $regex: search, $options: 'i' } }
                ];
            }

            // Build aggregation pipeline
            const pipeline = [
                { $match: matchConditions },
                
                // Add section statistics if requested
                ...(includeStats ? [{
                    $lookup: {
                        from: 'sections',
                        localField: '_id',
                        foreignField: 'courseId',
                        pipeline: [
                            {
                                $group: {
                                    _id: null,
                                    totalSections: { $sum: 1 },
                                    totalWords: { $sum: '$wordCount' },
                                    sectionsWithContent: {
                                        $sum: { $cond: ['$hasContent', 1, 0] }
                                    }
                                }
                            }
                        ],
                        as: 'sectionStats'
                    }
                }, {
                    $addFields: {
                        'stats.totalSections': { $ifNull: [{ $arrayElemAt: ['$sectionStats.totalSections', 0] }, 0] },
                        'stats.totalWords': { $ifNull: [{ $arrayElemAt: ['$sectionStats.totalWords', 0] }, 0] },
                        'stats.sectionsWithContent': { $ifNull: [{ $arrayElemAt: ['$sectionStats.sectionsWithContent', 0] }, 0] },
                        'stats.estimatedReadTime': {
                            $ceil: { $divide: [{ $ifNull: [{ $arrayElemAt: ['$sectionStats.totalWords', 0] }, 0] }, 200] }
                        }
                    }
                }, {
                    $project: { sectionStats: 0 }
                }] : []),
                
                // Sort
                { $sort: { [sortBy]: sortOrder } },
                
                // Pagination
                { $skip: (page - 1) * limit },
                { $limit: limit }
            ];

            // Execute aggregation
            const courses = await Course.aggregate(pipeline);
            
            // Get total count for pagination
            const totalCount = await Course.countDocuments(matchConditions);
            
            return {
                courses,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    hasNextPage: page < Math.ceil(totalCount / limit),
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            logger.error('❌ Failed to get courses:', error);
            throw error;
        }
    }

    /**
     * Get course sections with optimized hierarchy loading
     */
    async getCourseSections(courseId, options = {}) {
        const {
            includeContent = false,
            maxLevel = null,
            parentId = null,
            tocOnly = false,
            contentOnly = false
        } = options;

        try {
            // Build match conditions
            const matchConditions = { 
                courseId: new mongoose.Types.ObjectId(courseId) 
            };
            
            if (maxLevel !== null) matchConditions.level = { $lte: maxLevel };
            if (parentId) matchConditions.parentId = new mongoose.Types.ObjectId(parentId);
            if (tocOnly) matchConditions['settings.showInTOC'] = true;
            if (contentOnly) matchConditions.hasContent = true;

            // Build projection to exclude content if not needed
            const projection = includeContent ? {} : {
                'content.markdown.text': 0,
                'content.html.text': 0,
                'content.lexical.editorState': 0,
                'versions': 0
            };

            // Execute optimized query
            const sections = await Section.find(matchConditions, projection)
                .sort({ path: 1 })
                .lean();

            // Build hierarchy structure
            const hierarchy = this.buildHierarchy(sections);
            
            return {
                sections,
                hierarchy,
                totalSections: sections.length
            };
        } catch (error) {
            logger.error(`❌ Failed to get course sections for ${courseId}:`, error);
            throw error;
        }
    }

    /**
     * Get section with optimized parent/children loading
     */
    async getSectionWithContext(sectionId, options = {}) {
        const {
            includeParent = true,
            includeChildren = true,
            includeSiblings = false,
            includeContent = true
        } = options;

        try {
            // Build projection
            const projection = includeContent ? {} : {
                'content.markdown.text': 0,
                'content.html.text': 0,
                'content.lexical.editorState': 0,
                'versions': 0
            };

            // Get the main section
            const section = await Section.findById(sectionId, projection).lean();
            if (!section) {
                throw new Error('Section not found');
            }

            const result = { section };

            // Get parent if requested
            if (includeParent && section.parentId) {
                result.parent = await Section.findById(section.parentId, projection).lean();
            }

            // Get children if requested
            if (includeChildren) {
                result.children = await Section.find(
                    { parentId: sectionId },
                    projection
                ).sort({ order: 1 }).lean();
            }

            // Get siblings if requested
            if (includeSiblings) {
                const siblingConditions = section.parentId 
                    ? { parentId: section.parentId, _id: { $ne: sectionId } }
                    : { courseId: section.courseId, parentId: null, _id: { $ne: sectionId } };
                
                result.siblings = await Section.find(siblingConditions, projection)
                    .sort({ order: 1 }).lean();
            }

            return result;
        } catch (error) {
            logger.error(`❌ Failed to get section context for ${sectionId}:`, error);
            throw error;
        }
    }

    /**
     * Search sections within a course
     */
    async searchSections(courseId, searchTerm, options = {}) {
        const {
            includeContent = false,
            limit = 20
        } = options;

        try {
            // Build search pipeline
            const pipeline = [
                {
                    $match: {
                        courseId: new mongoose.Types.ObjectId(courseId),
                        $or: [
                            { title: { $regex: searchTerm, $options: 'i' } },
                            { 'content.markdown.text': { $regex: searchTerm, $options: 'i' } },
                            { 'content.html.text': { $regex: searchTerm, $options: 'i' } }
                        ]
                    }
                },
                {
                    $addFields: {
                        relevanceScore: {
                            $add: [
                                // Title match gets higher score
                                { $cond: [{ $regexMatch: { input: '$title', regex: searchTerm, options: 'i' } }, 10, 0] },
                                // Content match gets lower score
                                { $cond: [{ $regexMatch: { input: '$content.markdown.text', regex: searchTerm, options: 'i' } }, 5, 0] },
                                { $cond: [{ $regexMatch: { input: '$content.html.text', regex: searchTerm, options: 'i' } }, 3, 0] }
                            ]
                        }
                    }
                },
                { $sort: { relevanceScore: -1, path: 1 } },
                { $limit: limit }
            ];

            // Add projection if content not needed
            if (!includeContent) {
                pipeline.push({
                    $project: {
                        'content.markdown.text': 0,
                        'content.html.text': 0,
                        'content.lexical.editorState': 0,
                        'versions': 0
                    }
                });
            }

            const results = await Section.aggregate(pipeline);
            
            return {
                results,
                totalResults: results.length,
                searchTerm
            };
        } catch (error) {
            logger.error(`❌ Failed to search sections in course ${courseId}:`, error);
            throw error;
        }
    }

    /**
     * Get course statistics with aggregation
     */
    async getCourseStatistics(courseId) {
        try {
            const pipeline = [
                { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
                {
                    $group: {
                        _id: null,
                        totalSections: { $sum: 1 },
                        totalWords: { $sum: '$wordCount' },
                        totalReadTime: { $sum: '$readTime' },
                        sectionsWithContent: { $sum: { $cond: ['$hasContent', 1, 0] } },
                        sectionsByLevel: {
                            $push: {
                                level: '$level',
                                hasContent: '$hasContent'
                            }
                        },
                        contentFormats: {
                            $push: '$content.primaryFormat'
                        }
                    }
                },
                {
                    $addFields: {
                        averageWordsPerSection: { $divide: ['$totalWords', '$totalSections'] },
                        contentCompletionRate: { $divide: ['$sectionsWithContent', '$totalSections'] },
                        levelDistribution: {
                            $reduce: {
                                input: '$sectionsByLevel',
                                initialValue: {},
                                in: {
                                    $mergeObjects: [
                                        '$$value',
                                        {
                                            $arrayToObject: [[{
                                                k: { $toString: '$$this.level' },
                                                v: { $add: [{ $ifNull: [{ $getField: { field: { $toString: '$$this.level' }, input: '$$value' } }, 0] }, 1] }
                                            }]]
                                        }
                                    ]
                                }
                            }
                        },
                        formatDistribution: {
                            $reduce: {
                                input: '$contentFormats',
                                initialValue: { markdown: 0, lexical: 0 },
                                in: {
                                    $mergeObjects: [
                                        '$$value',
                                        {
                                            $cond: [
                                                { $eq: ['$$this', 'markdown'] },
                                                { markdown: { $add: ['$$value.markdown', 1] }, lexical: '$$value.lexical' },
                                                { markdown: '$$value.markdown', lexical: { $add: ['$$value.lexical', 1] } }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            ];

            const result = await Section.aggregate(pipeline);
            return result[0] || {
                totalSections: 0,
                totalWords: 0,
                totalReadTime: 0,
                sectionsWithContent: 0,
                averageWordsPerSection: 0,
                contentCompletionRate: 0,
                levelDistribution: {},
                formatDistribution: { markdown: 0, lexical: 0 }
            };
        } catch (error) {
            logger.error(`❌ Failed to get course statistics for ${courseId}:`, error);
            throw error;
        }
    }

    /**
     * Build hierarchy structure from flat sections array
     */
    buildHierarchy(sections) {
        const sectionMap = new Map();
        const rootSections = [];

        // Create map for quick lookup
        sections.forEach(section => {
            sectionMap.set(section._id.toString(), { ...section, children: [] });
        });

        // Build hierarchy
        sections.forEach(section => {
            const sectionWithChildren = sectionMap.get(section._id.toString());
            
            if (section.parentId) {
                const parent = sectionMap.get(section.parentId.toString());
                if (parent) {
                    parent.children.push(sectionWithChildren);
                }
            } else {
                rootSections.push(sectionWithChildren);
            }
        });

        return rootSections;
    }

    /**
     * Get sections for table of contents
     */
    async getTableOfContents(courseId, options = {}) {
        const { maxLevel = 3 } = options;

        try {
            const sections = await Section.find({
                courseId: new mongoose.Types.ObjectId(courseId),
                'settings.showInTOC': true,
                level: { $lte: maxLevel }
            }, {
                title: 1,
                slug: 1,
                level: 1,
                path: 1,
                order: 1,
                parentId: 1,
                hasContent: 1,
                wordCount: 1,
                readTime: 1
            }).sort({ path: 1 }).lean();

            return this.buildHierarchy(sections);
        } catch (error) {
            logger.error(`❌ Failed to get table of contents for course ${courseId}:`, error);
            throw error;
        }
    }

    /**
     * Bulk operations for sections
     */
    async bulkUpdateSections(courseId, updates) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const bulkOps = updates.map(update => ({
                updateOne: {
                    filter: { 
                        _id: new mongoose.Types.ObjectId(update.sectionId),
                        courseId: new mongoose.Types.ObjectId(courseId)
                    },
                    update: { $set: update.data }
                }
            }));

            const result = await Section.bulkWrite(bulkOps, { session });
            
            await session.commitTransaction();
            
            logger.info(`✅ Bulk updated ${result.modifiedCount} sections for course ${courseId}`);
            return result;
        } catch (error) {
            await session.abortTransaction();
            logger.error(`❌ Failed to bulk update sections for course ${courseId}:`, error);
            throw error;
        } finally {
            session.endSession();
        }
    }
}

// Create singleton instance
const queryOptimizationService = new QueryOptimizationService();

export default queryOptimizationService;