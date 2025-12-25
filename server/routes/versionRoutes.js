import express from 'express';
import ContentVersioning from '../services/contentVersioning.js';

const router = express.Router();

/**
 * Version Management API Routes
 * Endpoints for content versioning and history
 */

/**
 * GET /api/versions/sections/:id - Get version history for a section
 */
router.get('/sections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            limit = 20, 
            offset = 0, 
            includeContent = false 
        } = req.query;
        
        const versionHistory = await ContentVersioning.getVersionHistory(id, {
            limit: parseInt(limit),
            offset: parseInt(offset),
            includeContent: includeContent === 'true'
        });
        
        res.json({
            success: true,
            versionHistory
        });
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/versions/sections/:id/restore/:versionIndex - Restore a specific version
 */
router.post('/sections/:id/restore/:versionIndex', async (req, res) => {
    try {
        const { id, versionIndex } = req.params;
        const userId = req.user?.id || req.body.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }
        
        const index = parseInt(versionIndex);
        if (isNaN(index) || index < 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid version index'
            });
        }
        
        const section = await ContentVersioning.restoreVersion(id, index, userId);
        
        res.json({
            success: true,
            section,
            message: `Version ${index} restored successfully`
        });
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('Invalid version') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/versions/sections/:id/compare/:version1/:version2 - Compare two versions
 */
router.get('/sections/:id/compare/:version1/:version2', async (req, res) => {
    try {
        const { id, version1, version2 } = req.params;
        
        const index1 = parseInt(version1);
        const index2 = parseInt(version2);
        
        if (isNaN(index1) || isNaN(index2) || index1 < 0 || index2 < 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid version indices'
            });
        }
        
        const comparison = await ContentVersioning.compareVersions(id, index1, index2);
        
        res.json({
            success: true,
            comparison
        });
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 
                          error.message.includes('Invalid version') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/versions/sections/:id/save - Manually save current version
 */
router.post('/sections/:id/save', async (req, res) => {
    try {
        const { id } = req.params;
        const { changeDescription } = req.body;
        const userId = req.user?.id || req.body.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }
        
        const version = await ContentVersioning.saveVersion(id, userId, changeDescription);
        
        if (!version) {
            return res.status(400).json({
                success: false,
                error: 'No content to version'
            });
        }
        
        res.json({
            success: true,
            version,
            message: 'Version saved successfully'
        });
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/versions/sections/:id/cleanup - Clean up old versions
 */
router.delete('/sections/:id/cleanup', async (req, res) => {
    try {
        const { id } = req.params;
        const { keepCount = 20 } = req.query;
        
        const result = await ContentVersioning.cleanupVersions(id, parseInt(keepCount));
        
        res.json({
            success: true,
            result,
            message: `Cleaned up ${result.cleaned} old versions`
        });
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/versions/sections/:id/stats - Get content statistics across versions
 */
router.get('/sections/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        const stats = await ContentVersioning.getContentStats(id);
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

export default router;