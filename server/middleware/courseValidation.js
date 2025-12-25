import { Course } from '../models/index.js';

/**
 * Validation middleware for course operations
 */

/**
 * Validate course creation data
 */
export const validateCourseCreation = async (req, res, next) => {
    try {
        const { title, type, settings } = req.body;
        
        // Required fields validation
        if (!title || title.trim().length === 0) {
            return res.status(400).json({ error: 'Course title is required' });
        }
        
        // Validate type if provided
        if (type) {
            const validTypes = ['guide', 'tutorial', 'book', 'article', 'documentation'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({ 
                    error: `Invalid course type. Must be one of: ${validTypes.join(', ')}` 
                });
            }
        }
        
        // Validate settings if provided
        if (settings) {
            if (settings.maxNestingDepth !== undefined) {
                if (!Number.isInteger(settings.maxNestingDepth) || 
                    settings.maxNestingDepth < 1 || 
                    settings.maxNestingDepth > 5) {
                    return res.status(400).json({ 
                        error: 'maxNestingDepth must be an integer between 1 and 5' 
                    });
                }
            }
            
            if (settings.structure) {
                const validStructures = ['flat', 'hierarchical'];
                if (!validStructures.includes(settings.structure)) {
                    return res.status(400).json({ 
                        error: `Invalid structure. Must be one of: ${validStructures.join(', ')}` 
                    });
                }
            }
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Validation error: ' + error.message });
    }
};

/**
 * Validate course update data
 */
export const validateCourseUpdate = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const { title, type, status, settings } = req.body;
        
        // Validate course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        // Check ownership
        if (req.user && course.user !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to modify this course' });
        }
        
        // Validate title if provided
        if (title !== undefined && (!title || title.trim().length === 0)) {
            return res.status(400).json({ error: 'Course title cannot be empty' });
        }
        
        // Validate type if provided
        if (type) {
            const validTypes = ['guide', 'tutorial', 'book', 'article', 'documentation'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({ 
                    error: `Invalid course type. Must be one of: ${validTypes.join(', ')}` 
                });
            }
        }
        
        // Validate status if provided
        if (status) {
            const validStatuses = ['draft', 'in_progress', 'completed', 'archived'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ 
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
                });
            }
        }
        
        // Validate settings if provided
        if (settings) {
            if (settings.maxNestingDepth !== undefined) {
                if (!Number.isInteger(settings.maxNestingDepth) || 
                    settings.maxNestingDepth < 1 || 
                    settings.maxNestingDepth > 5) {
                    return res.status(400).json({ 
                        error: 'maxNestingDepth must be an integer between 1 and 5' 
                    });
                }
            }
            
            if (settings.structure) {
                const validStructures = ['flat', 'hierarchical'];
                if (!validStructures.includes(settings.structure)) {
                    return res.status(400).json({ 
                        error: `Invalid structure. Must be one of: ${validStructures.join(', ')}` 
                    });
                }
                
                // Validate structure change is possible
                if (settings.structure === 'flat') {
                    await Course.validateStructure(courseId, 'flat');
                }
            }
        }
        
        next();
    } catch (error) {
        if (error.message.includes('Cannot set to flat structure')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Validation error: ' + error.message });
    }
};

/**
 * Validate course visibility settings
 */
export const validateVisibilityUpdate = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const { isPublic } = req.body;
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        // Check ownership
        if (req.user && course.user !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to modify this course' });
        }
        
        // Validate boolean value
        if (isPublic !== undefined && typeof isPublic !== 'boolean') {
            return res.status(400).json({ error: 'isPublic must be a boolean value' });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Validation error: ' + error.message });
    }
};

/**
 * Validate course fork operation
 */
export const validateCourseFork = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        // Check if course is public or user owns it
        if (!course.isPublic && req.user && course.user !== req.user.id) {
            return res.status(403).json({ error: 'Cannot fork private course' });
        }
        
        // Prevent self-forking
        if (req.user && course.user === req.user.id) {
            return res.status(400).json({ error: 'Cannot fork your own course' });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Validation error: ' + error.message });
    }
};

/**
 * Validate generation metadata
 */
export const validateGenerationMeta = (req, res, next) => {
    try {
        const { generationMeta } = req.body;
        
        if (generationMeta) {
            // Validate model field if provided
            if (generationMeta.model) {
                const validModels = [
                    'gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 
                    'claude-3-sonnet', 'claude-3-opus', 
                    'gemini-pro', 'gemini-ultra'
                ];
                if (!validModels.includes(generationMeta.model)) {
                    return res.status(400).json({ 
                        error: `Invalid model. Must be one of: ${validModels.join(', ')}` 
                    });
                }
            }
            
            // Validate userPrompt length
            if (generationMeta.userPrompt && generationMeta.userPrompt.length > 5000) {
                return res.status(400).json({ 
                    error: 'User prompt cannot exceed 5000 characters' 
                });
            }
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Validation error: ' + error.message });
    }
};

/**
 * Validate course statistics update
 */
export const validateStatsUpdate = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const { stats } = req.body;
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        // Check ownership
        if (req.user && course.user !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to modify this course' });
        }
        
        // Validate stats fields if provided
        if (stats) {
            const numericFields = ['totalSections', 'totalWords', 'estimatedReadTime'];
            for (const field of numericFields) {
                if (stats[field] !== undefined) {
                    if (!Number.isInteger(stats[field]) || stats[field] < 0) {
                        return res.status(400).json({ 
                            error: `${field} must be a non-negative integer` 
                        });
                    }
                }
            }
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Validation error: ' + error.message });
    }
};

export default {
    validateCourseCreation,
    validateCourseUpdate,
    validateVisibilityUpdate,
    validateCourseFork,
    validateGenerationMeta,
    validateStatsUpdate
};