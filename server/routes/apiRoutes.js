import express from 'express';
import courseRoutes from './courseRoutes.js';
import sectionRoutes from './sectionRoutes.js';
import contentRoutes from './contentRoutes.js';
import versionRoutes from './versionRoutes.js';
import legacyRoutes from './legacyRoutes.js';
import { legacyErrorHandler, legacyFallback } from '../middleware/legacyApiMiddleware.js';

const router = express.Router();

/**
 * Main API Router
 * Combines all API routes with proper middleware
 */

// API Documentation endpoint
router.get('/', (req, res) => {
    res.json({
        name: 'AiCourse API',
        version: '2.0.0',
        description: 'Enhanced course management API with section-based architecture',
        features: {
            courses: 'Enhanced course management with hierarchical sections',
            sections: 'Full CRUD operations for course sections',
            content: 'Multi-format content management (Markdown, HTML, Lexical)',
            versions: 'Content versioning and history tracking',
            legacy: 'Backward compatibility with v1.x API'
        },
        endpoints: {
            courses: '/api/v2/courses',
            sections: '/api/v2/sections',
            content: '/api/v2/content',
            versions: '/api/v2/versions',
            legacy: '/api'
        },
        documentation: '/api/docs'
    });
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        services: {
            database: 'connected',
            contentConverter: 'active',
            versioningSystem: 'active',
            migrationSystem: 'ready'
        }
    });
});

// V2 API Routes (new section-based architecture)
router.use('/v2/courses', courseRoutes);
router.use('/v2/sections', sectionRoutes);
router.use('/v2/content', contentRoutes);
router.use('/v2/versions', versionRoutes);

// Legacy API Routes (backward compatibility)
router.use('/', legacyFallback);
router.use('/', legacyRoutes);

// Error handling
router.use(legacyErrorHandler);

// 404 handler for API routes
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        availableVersions: {
            v2: '/api/v2',
            legacy: '/api'
        },
        documentation: '/api/docs'
    });
});

export default router;