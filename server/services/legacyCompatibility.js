import { Course, Section } from '../models/index.js';
import contentConverter from './contentConverter.js';

/**
 * Legacy Compatibility Service
 * Provides backward compatibility for existing API endpoints
 */
class LegacyCompatibility {
    
    /**
     * Convert new course structure to legacy format
     */
    static async courseToLegacyFormat(course, options = {}) {
        const { includeContent = true, format = 'html' } = options;
        
        // Base legacy course object
        const legacyCourse = {
            _id: course._id,
            user: course.user,
            title: course.title,
            slug: course.slug,
            type: course.type,
            mainTopic: course.mainTopic,
            photo: course.photo,
            date: course.date,
            end: course.end,
            completed: course.status === 'completed',
            isPublic: course.isPublic,
            forkCount: course.forkCount,
            viewCount: course.viewCount,
            forkedFrom: course.forkedFrom,
            ownerName: course.ownerName,
            sourceDocument: course.sourceDocument,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt
        };
        
        // Aggregate content from sections if requested
        if (includeContent) {
            legacyCourse.content = await this.aggregateContentFromSections(course._id, format);
        }
        
        return legacyCourse;
    }
    
    /**
     * Aggregate content from all sections into a single string
     */
    static async aggregateContentFromSections(courseId, format = 'html') {
        const sections = await Section.find({ courseId })
            .sort({ path: 1 })
            .select('title content level path');
        
        if (sections.length === 0) {
            return '';
        }
        
        let aggregatedContent = '';
        
        for (const section of sections) {
            // Add section title as header
            const headerLevel = Math.min(section.level + 1, 6);
            
            if (format === 'html') {
                aggregatedContent += `<h${headerLevel}>${section.title}</h${headerLevel}>\n`;
            } else if (format === 'markdown') {
                const headerPrefix = '#'.repeat(headerLevel);
                aggregatedContent += `${headerPrefix} ${section.title}\n\n`;
            }
            
            // Add section content
            let sectionContent = '';
            
            if (section.content) {
                if (format === 'html' && section.content.html?.text) {
                    sectionContent = section.content.html.text;
                } else if (format === 'markdown' && section.content.markdown?.text) {
                    sectionContent = section.content.markdown.text;
                } else if (section.content.primaryFormat) {
                    // Convert from primary format
                    const primaryContent = section.content.primaryFormat === 'lexical'
                        ? section.content.lexical?.editorState
                        : section.content.markdown?.text;
                    
                    if (primaryContent) {
                        sectionContent = contentConverter.convertContent(
                            primaryContent,
                            section.content.primaryFormat,
                            format
                        );
                    }
                }
            }
            
            if (sectionContent) {
                aggregatedContent += sectionContent + '\n\n';
            }
        }
        
        return aggregatedContent.trim();
    }
    
    /**
     * Handle legacy course creation (convert to section-based structure)
     */
    static async createLegacyCourse(legacyCourseData, userId) {
        const { title, content, type, mainTopic, photo, isPublic } = legacyCourseData;
        
        // Import course service
        const { default: CourseService } = await import('./courseService.js');
        
        // Create course with new structure
        const course = await CourseService.createCourse({
            title,
            type: type || 'guide',
            mainTopic,
            photo,
            isPublic: isPublic || false,
            settings: {
                structure: 'flat', // Legacy courses default to flat structure
                maxNestingDepth: 2
            }
        }, userId);
        
        // Create root section with content if provided
        if (content && content.trim().length > 0) {
            const { default: SectionService } = await import('./sectionService.js');
            
            await SectionService.createSection({
                courseId: course._id,
                parentId: null,
                title: title || 'Content',
                content: {
                    markdown: {
                        text: content,
                        generatedAt: new Date()
                    },
                    primaryFormat: 'markdown'
                }
            });
        }
        
        return course;
    }
    
    /**
     * Handle legacy course updates
     */
    static async updateLegacyCourse(courseId, updateData, userId) {
        const course = await Course.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        
        // Handle content updates
        if (updateData.content !== undefined) {
            await this.updateCourseContent(courseId, updateData.content, userId);
            delete updateData.content; // Remove from regular updates
        }
        
        // Handle status mapping
        if (updateData.completed !== undefined) {
            updateData.status = updateData.completed ? 'completed' : 'in_progress';
            delete updateData.completed;
        }
        
        // Import course service for regular updates
        const { default: CourseService } = await import('./courseService.js');
        return await CourseService.updateCourse(courseId, updateData, userId);
    }
    
    /**
     * Update course content (legacy style - single content field)
     */
    static async updateCourseContent(courseId, newContent, userId) {
        const sections = await Section.find({ courseId }).sort({ path: 1 });
        
        if (sections.length === 0) {
            // No sections exist, create a new root section
            const { default: SectionService } = await import('./sectionService.js');
            
            await SectionService.createSection({
                courseId,
                parentId: null,
                title: 'Content',
                content: {
                    markdown: {
                        text: newContent,
                        generatedAt: new Date()
                    },
                    primaryFormat: 'markdown'
                }
            });
        } else if (sections.length === 1) {
            // Single section, update it directly
            const { default: ContentManager } = await import('./contentManager.js');
            
            await ContentManager.updateSectionContent(
                sections[0]._id,
                {
                    content: newContent,
                    format: 'markdown',
                    changeDescription: 'Legacy content update'
                },
                userId
            );
        } else {
            // Multiple sections - replace all with single section
            const { default: SectionService } = await import('./sectionService.js');
            
            // Delete all existing sections
            for (const section of sections) {
                await SectionService.deleteSection(section._id);
            }
            
            // Create new root section with updated content
            await SectionService.createSection({
                courseId,
                parentId: null,
                title: 'Content',
                content: {
                    markdown: {
                        text: newContent,
                        generatedAt: new Date()
                    },
                    primaryFormat: 'markdown'
                }
            });
        }
    }
    
    /**
     * Get course list in legacy format
     */
    static async getLegacyCourseList(query = {}, options = {}) {
        const { 
            limit = 20, 
            skip = 0, 
            includeContent = false,
            sortBy = 'date',
            sortOrder = 'desc'
        } = options;
        
        // Map legacy query parameters
        const courseQuery = {};
        if (query.user) courseQuery.user = query.user;
        if (query.isPublic !== undefined) courseQuery.isPublic = query.isPublic;
        if (query.type) courseQuery.type = query.type;
        if (query.completed !== undefined) {
            courseQuery.status = query.completed ? 'completed' : { $ne: 'completed' };
        }
        
        // Map legacy sort parameters
        const sortOptions = {};
        const sortField = sortBy === 'date' ? 'createdAt' : sortBy;
        sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;
        
        const courses = await Course.find(courseQuery)
            .sort(sortOptions)
            .limit(limit)
            .skip(skip);
        
        // Convert to legacy format
        const legacyCourses = [];
        for (const course of courses) {
            const legacyCourse = await this.courseToLegacyFormat(course, { 
                includeContent,
                format: 'html'
            });
            legacyCourses.push(legacyCourse);
        }
        
        const total = await Course.countDocuments(courseQuery);
        
        return {
            courses: legacyCourses,
            total,
            limit,
            skip,
            hasMore: skip + limit < total
        };
    }
    
    /**
     * Get single course in legacy format
     */
    static async getLegacyCourse(identifier, options = {}) {
        const { includeContent = true, format = 'html' } = options;
        
        // Find by ID or slug
        const query = mongoose.Types.ObjectId.isValid(identifier) 
            ? { _id: identifier }
            : { slug: identifier };
            
        const course = await Course.findOne(query);
        if (!course) {
            throw new Error('Course not found');
        }
        
        return await this.courseToLegacyFormat(course, { includeContent, format });
    }
    
    /**
     * Handle legacy search functionality
     */
    static async searchLegacyCourses(searchQuery, options = {}) {
        const { limit = 20, skip = 0 } = options;
        
        // Build search query for new structure
        const query = {
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { mainTopic: { $regex: searchQuery, $options: 'i' } }
            ]
        };
        
        // Also search in section content
        const sectionsWithContent = await Section.find({
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { 'content.markdown.text': { $regex: searchQuery, $options: 'i' } },
                { 'content.html.text': { $regex: searchQuery, $options: 'i' } }
            ]
        }).distinct('courseId');
        
        if (sectionsWithContent.length > 0) {
            query.$or.push({ _id: { $in: sectionsWithContent } });
        }
        
        const courses = await Course.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);
        
        // Convert to legacy format
        const results = [];
        for (const course of courses) {
            const legacyCourse = await this.courseToLegacyFormat(course, { 
                includeContent: false 
            });
            results.push(legacyCourse);
        }
        
        return {
            results,
            total: await Course.countDocuments(query),
            query: searchQuery
        };
    }
    
    /**
     * Handle legacy statistics aggregation
     */
    static async getLegacyStats(userId = null) {
        const query = userId ? { user: userId } : {};
        
        const stats = await Course.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalCourses: { $sum: 1 },
                    completedCourses: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    publicCourses: {
                        $sum: { $cond: ['$isPublic', 1, 0] }
                    },
                    totalWords: { $sum: '$stats.totalWords' },
                    totalSections: { $sum: '$stats.totalSections' },
                    avgReadTime: { $avg: '$stats.estimatedReadTime' }
                }
            }
        ]);
        
        const result = stats[0] || {
            totalCourses: 0,
            completedCourses: 0,
            publicCourses: 0,
            totalWords: 0,
            totalSections: 0,
            avgReadTime: 0
        };
        
        // Add legacy-compatible fields
        result.draftCourses = result.totalCourses - result.completedCourses;
        result.privateCourses = result.totalCourses - result.publicCourses;
        
        return result;
    }
    
    /**
     * Handle legacy export functionality
     */
    static async exportLegacyCourse(courseId, format = 'html') {
        const course = await Course.findById(courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        
        const content = await this.aggregateContentFromSections(courseId, format);
        
        return {
            title: course.title,
            content,
            format,
            exportedAt: new Date(),
            metadata: {
                type: course.type,
                created: course.createdAt,
                modified: course.updatedAt,
                wordCount: course.stats?.totalWords || 0,
                sections: course.stats?.totalSections || 0
            }
        };
    }
}

export default LegacyCompatibility;