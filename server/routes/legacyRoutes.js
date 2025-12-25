import express from 'express';
import LegacyCompatibility from '../services/legacyCompatibility.js';
import { 
    transformLegacyCourseCreation,
    transformLegacyCourseUpdate,
    transformCourseResponse,
    transformLegacyQuery,
    checkCompatibility
} from '../middleware/legacyApiMiddleware.js';

const router = express.Router();

/**
 * Legacy API Routes
 * Maintains backward compatibility with existing endpoints
 */

// Apply compatibility middleware to all legacy routes
router.use(checkCompatibility);

/**
 * GET /api/courses - Legacy course listing
 */
router.get('/courses', 
    transformLegacyQuery,
    transformCourseResponse({ includeContent: false }),
    async (req, res) => {
        try {
            const {
                limit = 20,
                skip = 0,
                user,
                isPublic,
                type,
                completed,
                sortBy = 'date',
                sortOrder = 'desc'
            } = req.query;
            
            const query = {};
            if (user) query.user = user;
            if (isPublic !== undefined) query.isPublic = isPublic === 'true';
            if (type) query.type = type;
            if (completed !== undefined) query.completed = completed === 'true';
            
            const result = await LegacyCompatibility.getLegacyCourseList(query, {
                limit: parseInt(limit),
                skip: parseInt(skip),
                includeContent: false,
                sortBy,
                sortOrder
            });
            
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * GET /api/course/:identifier - Legacy single course retrieval
 */
router.get('/course/:identifier',
    transformCourseResponse({ includeContent: true }),
    async (req, res) => {
        try {
            const { identifier } = req.params;
            const { format = 'html' } = req.query;
            
            const course = await LegacyCompatibility.getLegacyCourse(identifier, {
                includeContent: true,
                format
            });
            
            res.json(course);
        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({ error: error.message });
        }
    }
);

/**
 * POST /api/course/create - Legacy course creation
 */
router.post('/course/create',
    transformLegacyCourseCreation,
    async (req, res) => {
        try {
            const userId = req.user?.id || req.body.user;
            if (!userId) {
                return res.status(401).json({ error: 'User authentication required' });
            }
            
            let course;
            if (req.isLegacyRequest) {
                // Handle legacy format
                course = await LegacyCompatibility.createLegacyCourse(req.legacyData, userId);
            } else {
                // Handle new format
                const { default: CourseService } = await import('../services/courseService.js');
                course = await CourseService.createCourse(req.body, userId);
            }
            
            // Convert to legacy format for response
            const legacyCourse = await LegacyCompatibility.courseToLegacyFormat(course, {
                includeContent: true
            });
            
            res.status(201).json(legacyCourse);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * PUT /api/course/:id - Legacy course update
 */
router.put('/course/:id',
    transformLegacyCourseUpdate,
    async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id || req.body.user;
            
            if (!userId) {
                return res.status(401).json({ error: 'User authentication required' });
            }
            
            let course;
            if (req.isLegacyRequest) {
                // Handle legacy format
                course = await LegacyCompatibility.updateLegacyCourse(id, req.legacyData, userId);
            } else {
                // Handle new format
                const { default: CourseService } = await import('../services/courseService.js');
                course = await CourseService.updateCourse(id, req.body, userId);
            }
            
            // Convert to legacy format for response
            const legacyCourse = await LegacyCompatibility.courseToLegacyFormat(course, {
                includeContent: true
            });
            
            res.json(legacyCourse);
        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 
                              error.message.includes('authorized') ? 403 : 500;
            res.status(statusCode).json({ error: error.message });
        }
    }
);

/**
 * POST /api/update - Legacy content update endpoint
 */
router.post('/update', async (req, res) => {
    try {
        const { courseId, content, user } = req.body;
        
        if (!courseId || !user) {
            return res.status(400).json({ error: 'Course ID and user are required' });
        }
        
        await LegacyCompatibility.updateCourseContent(courseId, content || '', user);
        
        // Return updated course in legacy format
        const course = await LegacyCompatibility.getLegacyCourse(courseId, {
            includeContent: true
        });
        
        res.json({ success: true, course });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/search - Legacy search endpoint
 */
router.get('/search', async (req, res) => {
    try {
        const { q: query, limit = 20, skip = 0 } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        const results = await LegacyCompatibility.searchLegacyCourses(query, {
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
        
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/stats - Legacy statistics endpoint
 */
router.get('/stats', async (req, res) => {
    try {
        const { user } = req.query;
        const stats = await LegacyCompatibility.getLegacyStats(user);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/course/:id/export - Legacy export endpoint
 */
router.get('/course/:id/export', async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'html' } = req.query;
        
        const exportData = await LegacyCompatibility.exportLegacyCourse(id, format);
        
        // Set appropriate headers for download
        res.set({
            'Content-Type': format === 'html' ? 'text/html' : 'text/markdown',
            'Content-Disposition': `attachment; filename="course-${id}.${format}"`
        });
        
        res.json(exportData);
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({ error: error.message });
    }
});

/**
 * DELETE /api/course/:id - Legacy course deletion
 */
router.delete('/course/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.query.user;
        
        if (!userId) {
            return res.status(401).json({ error: 'User authentication required' });
        }
        
        const { default: CourseService } = await import('../services/courseService.js');
        const result = await CourseService.deleteCourse(id, userId);
        
        res.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('authorized') ? 403 : 500;
        res.status(statusCode).json({ error: error.message });
    }
});

/**
 * Health check endpoint for legacy API
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: 'legacy-compatible',
        timestamp: new Date().toISOString(),
        features: {
            courseManagement: true,
            contentAggregation: true,
            backwardCompatibility: true,
            migration: true
        }
    });
});

export default router;