import express from 'express';
import { Course } from '../models/index.js';
import CourseService from '../services/courseService.js';
import SectionService from '../services/sectionService.js';
import {
    validateCourseCreation,
    validateCourseUpdate,
    validateVisibilityUpdate,
    validateCourseFork,
    validateGenerationMeta,
    validateStatsUpdate
} from '../middleware/courseValidation.js';

const router = express.Router();

/**
 * Enhanced Course API Routes
 * RESTful endpoints for course management with section support
 */

/**
 * POST /api/courses - Create a new course
 */
router.post('/',
    validateCourseCreation,
    validateGenerationMeta,
    async (req, res) => {
        try {
            const userId = req.user?.id || req.body.user;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'User authentication required'
                });
            }
            
            const course = await CourseService.createCourse(req.body, userId);
            
            res.status(201).json({
                success: true,
                course,
                message: 'Course created successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

/**
 * GET /api/courses/:id - Get a single course
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            includeSections = false, 
            includeContent = false, 
            maxDepth = null,
            format = 'html'
        } = req.query;
        const userId = req.user?.id;
        
        let course;
        if (includeSections === 'true') {
            course = await CourseService.getCourseWithSections(id, {
                includeContent: includeContent === 'true',
                maxDepth: maxDepth ? parseInt(maxDepth) : null,
                userId
            });
        } else {
            course = await Course.findById(id);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    error: 'Course not found'
                });
            }
            
            // Check access permissions
            if (!course.isPublic && course.user !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied to private course'
                });
            }
        }
        
        res.json({
            success: true,
            course
        });
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('Access denied') ? 403 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/courses/:id - Update a course
 */
router.put('/:id',
    validateCourseUpdate,
    validateGenerationMeta,
    async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id || req.body.user;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'User authentication required'
                });
            }
            
            const course = await CourseService.updateCourse(id, req.body, userId);
            
            res.json({
                success: true,
                course,
                message: 'Course updated successfully'
            });
        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 
                              error.message.includes('authorized') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                error: error.message
            });
        }
    }
);

/**
 * DELETE /api/courses/:id - Delete a course
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.query.user;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }
        
        const result = await CourseService.deleteCourse(id, userId);
        
        res.json({
            success: true,
            result,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('authorized') ? 403 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/courses/:id/fork - Fork a course
 */
router.post('/:id/fork',
    validateCourseFork,
    async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id || req.body.user;
            const userDisplayName = req.user?.name || req.body.userDisplayName;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'User authentication required'
                });
            }
            
            const forkedCourse = await CourseService.forkCourse(id, userId, userDisplayName);
            
            res.status(201).json({
                success: true,
                course: forkedCourse,
                message: 'Course forked successfully'
            });
        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 
                              error.message.includes('Cannot fork') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                error: error.message
            });
        }
    }
);

/**
 * GET /api/courses - List courses with filtering and pagination
 */
router.get('/', async (req, res) => {
    try {
        const {
            query = '',
            userId = null,
            type = null,
            status = null,
            isPublic = null,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            limit = 20,
            skip = 0
        } = req.query;
        
        const result = await CourseService.searchCourses(query, {
            userId,
            type,
            status,
            isPublic: isPublic !== null ? isPublic === 'true' : null,
            sortBy,
            sortOrder,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/courses/:id/visibility - Update course visibility
 */
router.put('/:id/visibility',
    validateVisibilityUpdate,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { isPublic } = req.body;
            const userId = req.user?.id || req.body.user;
            
            const course = await CourseService.updateCourse(id, { isPublic }, userId);
            
            res.json({
                success: true,
                course,
                message: `Course ${isPublic ? 'published' : 'made private'} successfully`
            });
        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 
                              error.message.includes('authorized') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                error: error.message
            });
        }
    }
);

/**
 * PUT /api/courses/:id/stats - Update course statistics
 */
router.put('/:id/stats',
    validateStatsUpdate,
    async (req, res) => {
        try {
            const { id } = req.params;
            const stats = await CourseService.updateCourseStats(id);
            
            res.json({
                success: true,
                stats,
                message: 'Course statistics updated successfully'
            });
        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                error: error.message
            });
        }
    }
);

/**
 * GET /api/courses/:id/analytics - Get course analytics
 */
router.get('/:id/analytics', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.query.user;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }
        
        const analytics = await CourseService.getCourseAnalytics(id, userId);
        
        res.json({
            success: true,
            analytics
        });
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('authorized') ? 403 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/courses/:id/hierarchy - Get course section hierarchy
 */
router.get('/:id/hierarchy', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            includeContent = false, 
            maxDepth = null 
        } = req.query;
        
        const hierarchy = await SectionService.getCourseHierarchy(id, {
            includeContent: includeContent === 'true',
            maxDepth: maxDepth ? parseInt(maxDepth) : null
        });
        
        res.json({
            success: true,
            hierarchy
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/courses/:id/validate-hierarchy - Validate course hierarchy integrity
 */
router.post('/:id/validate-hierarchy', async (req, res) => {
    try {
        const { id } = req.params;
        const validation = await SectionService.validateHierarchy(id);
        
        res.json({
            success: true,
            validation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;