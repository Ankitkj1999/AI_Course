import { Course, Section } from '../models/index.js';

/**
 * Validation middleware for section operations
 */

/**
 * Validate section creation data
 */
export const validateSectionCreation = async (req, res, next) => {
    try {
        const { courseId, parentId, title, content } = req.body;
        
        // Required fields validation
        if (!courseId) {
            return res.status(400).json({ error: 'Course ID is required' });
        }
        
        if (!title || title.trim().length === 0) {
            return res.status(400).json({ error: 'Section title is required' });
        }
        
        // Validate course exists and user has permission
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        // Check if user owns the course (assuming user ID is in req.user)
        if (req.user && course.user !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to modify this course' });
        }
        
        // Validate parent section if provided
        if (parentId) {
            const parentSection = await Section.findById(parentId);
            if (!parentSection) {
                return res.status(404).json({ error: 'Parent section not found' });
            }
            
            if (parentSection.courseId.toString() !== courseId) {
                return res.status(400).json({ error: 'Parent section must belong to the same course' });
            }
        }
        
        // Validate content format if provided
        if (content && content.primaryFormat) {
            const validFormats = ['markdown', 'lexical'];
            if (!validFormats.includes(content.primaryFormat)) {
                return res.status(400).json({ 
                    error: `Invalid content format. Must be one of: ${validFormats.join(', ')}` 
                });
            }
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Validation error: ' + error.message });
    }
};

/**
 * Validate section update data
 */
export const validateSectionUpdate = async (req, res, next) => {
    try {
        const { sectionId } = req.params;
        const { title, content } = req.body;
        
        // Validate section exists
        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({ error: 'Section not found' });
        }
        
        // Check course ownership
        const course = await Course.findById(section.courseId);
        if (req.user && course.user !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to modify this section' });
        }
        
        // Validate title if provided
        if (title !== undefined && (!title || title.trim().length === 0)) {
            return res.status(400).json({ error: 'Section title cannot be empty' });
        }
        
        // Validate content format if provided
        if (content && content.primaryFormat) {
            const validFormats = ['markdown', 'lexical'];
            if (!validFormats.includes(content.primaryFormat)) {
                return res.status(400).json({ 
                    error: `Invalid content format. Must be one of: ${validFormats.join(', ')}` 
                });
            }
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Validation error: ' + error.message });
    }
};

/**
 * Validate nesting depth constraints
 */
export const validateNestingDepth = async (req, res, next) => {
    try {
        const { courseId, parentId } = req.body;
        
        if (!parentId) {
            return next(); // Root level sections are always valid
        }
        
        const course = await Course.findById(courseId);
        const maxDepth = course.settings.maxNestingDepth || 5;
        
        await Section.validateNestingDepth(courseId, parentId, maxDepth);
        
        next();
    } catch (error) {
        if (error.message.includes('Maximum nesting depth')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Nesting validation error: ' + error.message });
    }
};

/**
 * Validate course structure constraints
 */
export const validateCourseStructure = async (req, res, next) => {
    try {
        const { courseId } = req.body;
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        // If course is set to flat structure, validate nesting constraints
        if (course.settings.structure === 'flat') {
            const { parentId } = req.body;
            if (parentId) {
                const parent = await Section.findById(parentId);
                if (parent && parent.level >= 1) {
                    return res.status(400).json({ 
                        error: 'Flat structure courses cannot have sections nested beyond level 1' 
                    });
                }
            }
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Structure validation error: ' + error.message });
    }
};

/**
 * Validate section move operation
 */
export const validateSectionMove = async (req, res, next) => {
    try {
        const { sectionId } = req.params;
        const { newParentId, newOrder } = req.body;
        
        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({ error: 'Section not found' });
        }
        
        // Check course ownership
        const course = await Course.findById(section.courseId);
        if (req.user && course.user !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to modify this section' });
        }
        
        // Validate new parent if provided
        if (newParentId) {
            const newParent = await Section.findById(newParentId);
            if (!newParent) {
                return res.status(404).json({ error: 'New parent section not found' });
            }
            
            if (newParent.courseId.toString() !== section.courseId.toString()) {
                return res.status(400).json({ 
                    error: 'Cannot move section to a different course' 
                });
            }
            
            // Prevent moving section to be its own child
            if (newParentId === sectionId) {
                return res.status(400).json({ 
                    error: 'Cannot move section to be its own child' 
                });
            }
            
            // Prevent circular references (moving parent to be child of its descendant)
            const descendants = await Section.find({ 
                courseId: section.courseId,
                path: new RegExp(`^${section.path}\\.`)
            });
            
            const descendantIds = descendants.map(d => d._id.toString());
            if (descendantIds.includes(newParentId)) {
                return res.status(400).json({ 
                    error: 'Cannot create circular reference in section hierarchy' 
                });
            }
        }
        
        // Validate order if provided
        if (newOrder !== undefined && (newOrder < 0 || !Number.isInteger(newOrder))) {
            return res.status(400).json({ 
                error: 'Order must be a non-negative integer' 
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Move validation error: ' + error.message });
    }
};

/**
 * Validate bulk operations
 */
export const validateBulkOperation = async (req, res, next) => {
    try {
        const { sectionIds, operation } = req.body;
        
        if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
            return res.status(400).json({ error: 'Section IDs array is required' });
        }
        
        const validOperations = ['delete', 'reorder', 'move'];
        if (!validOperations.includes(operation)) {
            return res.status(400).json({ 
                error: `Invalid operation. Must be one of: ${validOperations.join(', ')}` 
            });
        }
        
        // Validate all sections exist and belong to the same course
        const sections = await Section.find({ _id: { $in: sectionIds } });
        
        if (sections.length !== sectionIds.length) {
            return res.status(404).json({ error: 'One or more sections not found' });
        }
        
        const courseIds = [...new Set(sections.map(s => s.courseId.toString()))];
        if (courseIds.length > 1) {
            return res.status(400).json({ 
                error: 'All sections must belong to the same course' 
            });
        }
        
        // Check course ownership
        const course = await Course.findById(courseIds[0]);
        if (req.user && course.user !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to modify these sections' });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Bulk operation validation error: ' + error.message });
    }
};

export default {
    validateSectionCreation,
    validateSectionUpdate,
    validateNestingDepth,
    validateCourseStructure,
    validateSectionMove,
    validateBulkOperation
};