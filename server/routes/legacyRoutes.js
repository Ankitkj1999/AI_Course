import express from 'express';
import LegacyCompatibility from '../services/legacyCompatibility.js';
import { 
    transformLegacyQuery,
    checkCompatibility
} from '../middleware/legacyApiMiddleware.js';

const router = express.Router();

/**
 * Legacy API Routes
 * Non-course legacy endpoints only
 * 
 * NOTE: All course-related routes have been consolidated into courseRoutes.js
 */

// Apply compatibility middleware to all legacy routes
router.use(checkCompatibility);

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
