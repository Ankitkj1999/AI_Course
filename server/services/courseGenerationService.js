import CourseService from './courseService.js';
import SectionService from './sectionService.js';
import ContentConverter from './contentConverter.js';
import { generateSlug } from '../utils/slugify.js';
import logger from '../utils/logger.js';

/**
 * Course Generation Service
 * Handles AI-generated course content and converts it to the new section-based architecture
 */
class CourseGenerationService {
    
    /**
     * Create a course from AI-generated content using the new section-based architecture
     */
    static async createCourseFromGeneration(generationData, userId) {
        const {
            content,
            type,
            mainTopic,
            photo,
            lang,
            isPublic = false,
            generationMeta = {}
        } = generationData;
        
        try {
            // Parse the legacy content structure
            const parsedContent = this.parseLegacyContent(content);
            
            // Create the course using CourseService (without legacy content)
            const course = await CourseService.createCourse({
                title: parsedContent.title || mainTopic,
                type: this.mapTypeToEnum(type),
                mainTopic,
                photo,
                // Don't store content in legacy field for new courses
                content: null,
                settings: {
                    maxNestingDepth: 3,
                    allowComments: true,
                    showTableOfContents: true,
                    structure: 'hierarchical'
                },
                generationMeta: {
                    ...generationMeta,
                    originalFormat: 'ai_generated',
                    convertedAt: new Date(),
                    architecture: 'section-based'
                },
                isPublic
            }, userId);
            
            logger.info(`Created course ${course._id} for user ${userId}`);
            
            // Create sections from the parsed content
            const sectionIds = await this.createSectionsFromContent(
                course._id, 
                parsedContent.sections, 
                null, // parentId for root sections
                userId
            );
            
            // Update course with section references
            course.sections = sectionIds;
            await course.save();
            
            // Update course statistics
            await CourseService.updateCourseStats(course._id);
            
            logger.info(`Course generation completed: ${course._id} with ${sectionIds.length} sections`);
            
            return course;
            
        } catch (error) {
            logger.error('Course generation failed:', error);
            throw new Error(`Course generation failed: ${error.message}`);
        }
    }
    
    /**
     * Parse legacy JSON content structure
     */
    static parseLegacyContent(content) {
        try {
            let parsedContent;
            
            if (typeof content === 'string') {
                parsedContent = JSON.parse(content);
            } else {
                parsedContent = content;
            }
            
            // Handle the nested structure from the example
            // Content format: {"fundamentals of react": [sections...]}
            const topicKey = Object.keys(parsedContent)[0];
            const sections = parsedContent[topicKey] || [];
            
            return {
                title: topicKey,
                sections: sections
            };
            
        } catch (error) {
            logger.error('Failed to parse legacy content:', error);
            throw new Error('Invalid content format');
        }
    }
    
    /**
     * Create sections recursively from parsed content
     */
    static async createSectionsFromContent(courseId, sections, parentId = null, userId) {
        const createdSectionIds = [];
        
        for (let i = 0; i < sections.length; i++) {
            const sectionData = sections[i];
            
            try {
                // Create the main section
                const section = await SectionService.createSection({
                    courseId,
                    parentId,
                    title: sectionData.title,
                    content: this.createEmptyContent(), // Start with empty content
                    settings: {
                        order: i
                    }
                });
                
                createdSectionIds.push(section._id);
                logger.info(`Created section: ${section.title} (${section._id})`);
                
                // Create subsections if they exist
                if (sectionData.subtopics && Array.isArray(sectionData.subtopics)) {
                    const subsectionIds = await this.createSubsections(
                        courseId,
                        section._id,
                        sectionData.subtopics,
                        userId
                    );
                    
                    // Update the parent section with children references
                    section.children = subsectionIds;
                    section.hasChildren = subsectionIds.length > 0;
                    await section.save();
                }
                
            } catch (error) {
                logger.error(`Failed to create section ${sectionData.title}:`, error);
                // Continue with other sections even if one fails
            }
        }
        
        return createdSectionIds;
    }
    
    /**
     * Create subsections from subtopics
     */
    static async createSubsections(courseId, parentId, subtopics, userId) {
        const subsectionIds = [];
        
        for (let i = 0; i < subtopics.length; i++) {
            const subtopic = subtopics[i];
            
            try {
                // Prepare content in multi-format structure
                const content = this.prepareSubtopicContent(subtopic);
                
                // Create the subsection
                const subsection = await SectionService.createSection({
                    courseId,
                    parentId,
                    title: subtopic.title,
                    content,
                    settings: {
                        order: i
                    }
                });
                
                subsectionIds.push(subsection._id);
                logger.info(`Created subsection: ${subsection.title} (${subsection._id})`);
                
            } catch (error) {
                logger.error(`Failed to create subsection ${subtopic.title}:`, error);
                // Continue with other subsections
            }
        }
        
        return subsectionIds;
    }
    
    /**
     * Prepare subtopic content in multi-format structure
     */
    static prepareSubtopicContent(subtopic) {
        const markdownContent = subtopic.theory || '';
        const hasContent = markdownContent.trim().length > 0;
        
        // Convert markdown to HTML
        const htmlContent = hasContent ? 
            ContentConverter.markdownToHtml(markdownContent) : '';
        
        // Calculate word count and read time
        const wordCount = hasContent ? 
            ContentConverter.calculateWordCount(markdownContent, 'markdown') : 0;
        const readTime = ContentConverter.calculateReadTime(wordCount);
        
        return {
            markdown: {
                text: markdownContent,
                generatedAt: hasContent ? new Date() : null
            },
            html: {
                text: htmlContent,
                generatedAt: hasContent ? new Date() : null
            },
            lexical: {
                editorState: null, // Will be populated when user edits in Lexical
                lastEditedAt: null
            },
            primaryFormat: 'markdown',
            metadata: {
                wordCount,
                readTime,
                hasContent,
                // Store additional metadata from the original structure
                youtube: subtopic.youtube || '',
                image: subtopic.image || '',
                done: subtopic.done || false,
                contentType: subtopic.contentType || 'markdown'
            }
        };
    }
    
    /**
     * Create empty content structure
     */
    static createEmptyContent() {
        return {
            markdown: {
                text: '',
                generatedAt: null
            },
            html: {
                text: '',
                generatedAt: null
            },
            lexical: {
                editorState: null,
                lastEditedAt: null
            },
            primaryFormat: 'markdown',
            metadata: {
                wordCount: 0,
                readTime: 0,
                hasContent: false
            }
        };
    }
    
    /**
     * Map frontend course type to backend enum
     */
    static mapTypeToEnum(type) {
        const typeMapping = {
            'Text & Image Course': 'guide',
            'Video Course': 'tutorial',
            'Interactive Course': 'tutorial',
            'Book': 'book',
            'Article': 'article',
            'Documentation': 'documentation'
        };
        
        return typeMapping[type] || 'guide';
    }
    
    /**
     * Convert existing legacy course to new section-based structure
     */
    static async convertLegacyCourse(courseId, userId) {
        try {
            const { Course } = await import('../models/index.js');
            const legacyCourse = await Course.findById(courseId);
            
            if (!legacyCourse) {
                throw new Error('Course not found');
            }
            
            if (legacyCourse.user !== userId) {
                throw new Error('Not authorized to convert this course');
            }
            
            // Check if already converted (has sections)
            if (legacyCourse.sections && legacyCourse.sections.length > 0) {
                throw new Error('Course already converted to new format');
            }
            
            // Parse legacy content
            const parsedContent = this.parseLegacyContent(legacyCourse.content);
            
            // Create sections from content
            const sectionIds = await this.createSectionsFromContent(
                courseId,
                parsedContent.sections,
                null,
                userId
            );
            
            // Update course with new structure
            legacyCourse.sections = sectionIds;
            legacyCourse.generationMeta = {
                ...legacyCourse.generationMeta,
                convertedAt: new Date(),
                originalFormat: 'legacy_json'
            };
            
            await legacyCourse.save();
            
            // Update statistics
            await CourseService.updateCourseStats(courseId);
            
            logger.info(`Successfully converted legacy course ${courseId} to new format`);
            
            return legacyCourse;
            
        } catch (error) {
            logger.error(`Failed to convert legacy course ${courseId}:`, error);
            throw error;
        }
    }
    
    /**
     * Check if a course uses the new section-based architecture
     */
    static isNewArchitecture(course) {
        return course.sections && course.sections.length > 0 && !course.content;
    }
    
    /**
     * Check if a course is a legacy course that needs migration
     */
    static isLegacyCourse(course) {
        return course.content && (!course.sections || course.sections.length === 0);
    }
    
    /**
     * Get course generation statistics
     */
    static async getGenerationStats(courseId) {
        try {
            const { Course, Section } = await import('../models/index.js');
            
            const course = await Course.findById(courseId);
            if (!course) {
                throw new Error('Course not found');
            }
            
            const sections = await Section.find({ courseId });
            
            const stats = {
                course: {
                    id: course._id,
                    title: course.title,
                    type: course.type,
                    status: course.status,
                    isPublic: course.isPublic
                },
                generation: {
                    generatedAt: course.generationMeta?.generatedAt,
                    convertedAt: course.generationMeta?.convertedAt,
                    originalFormat: course.generationMeta?.originalFormat
                },
                structure: {
                    totalSections: sections.length,
                    rootSections: sections.filter(s => !s.parentId).length,
                    sectionsWithContent: sections.filter(s => s.hasContent).length,
                    maxDepth: sections.length > 0 ? Math.max(...sections.map(s => s.level || 1)) : 0
                },
                content: {
                    totalWords: sections.reduce((sum, s) => sum + (s.content?.metadata?.wordCount || 0), 0),
                    totalReadTime: sections.reduce((sum, s) => sum + (s.content?.metadata?.readTime || 0), 0),
                    primaryFormats: {
                        markdown: sections.filter(s => s.content?.primaryFormat === 'markdown').length,
                        html: sections.filter(s => s.content?.primaryFormat === 'html').length,
                        lexical: sections.filter(s => s.content?.primaryFormat === 'lexical').length
                    }
                }
            };
            
            return stats;
            
        } catch (error) {
            logger.error(`Failed to get generation stats for course ${courseId}:`, error);
            throw error;
        }
    }
}

export default CourseGenerationService;