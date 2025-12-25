import express from 'express';
import ContentManager from '../services/contentManager.js';
import ContentVersioning from '../services/contentVersioning.js';
import contentConverter from '../services/contentConverter.js';

const router = express.Router();

/**
 * Content Management API Routes
 * Endpoints for managing multi-format content and versioning
 */

/**
 * PUT /api/content/sections/:id - Update section content
 */
router.put('/sections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, format, saveVersion = true, changeDescription } = req.body;
        const userId = req.user?.id || req.body.userId;
        
        if (!content || !format) {
            return res.status(400).json({
                success: false,
                error: 'Content and format are required'
            });
        }
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }
        
        const validFormats = ['markdown', 'lexical'];
        if (!validFormats.includes(format)) {
            return res.status(400).json({
                success: false,
                error: `Invalid format. Must be one of: ${validFormats.join(', ')}`
            });
        }
        
        const section = await ContentManager.updateSectionContent(id, {
            content,
            format,
            saveVersion,
            changeDescription
        }, userId);
        
        res.json({
            success: true,
            section,
            message: 'Content updated successfully'
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
 * GET /api/content/sections/:id - Get section content
 */
router.get('/sections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            format = null, 
            includeVersions = false, 
            includeStats = false 
        } = req.query;
        
        const contentData = await ContentManager.getSectionContent(id, format, {
            includeVersions: includeVersions === 'true',
            includeStats: includeStats === 'true'
        });
        
        res.json({
            success: true,
            content: contentData
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
 * POST /api/content/sections/:id/switch-format - Switch primary format
 */
router.post('/sections/:id/switch-format', async (req, res) => {
    try {
        const { id } = req.params;
        const { newFormat } = req.body;
        const userId = req.user?.id || req.body.userId;
        
        if (!newFormat) {
            return res.status(400).json({
                success: false,
                error: 'newFormat is required'
            });
        }
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }
        
        const section = await ContentManager.switchPrimaryFormat(id, newFormat, userId);
        
        res.json({
            success: true,
            section,
            message: `Primary format switched to ${newFormat}`
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
 * POST /api/content/bulk-update - Bulk update multiple sections
 */
router.post('/bulk-update', async (req, res) => {
    try {
        const { updates } = req.body;
        const userId = req.user?.id || req.body.userId;
        
        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'updates array is required'
            });
        }
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }
        
        const result = await ContentManager.bulkUpdateContent(updates, userId);
        
        res.json({
            success: true,
            result,
            message: 'Bulk content update completed'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/content/sections/:id/import - Import content from external source
 */
router.post('/sections/:id/import', async (req, res) => {
    try {
        const { id } = req.params;
        const { sourceContent, sourceFormat } = req.body;
        const userId = req.user?.id || req.body.userId;
        
        if (!sourceContent || !sourceFormat) {
            return res.status(400).json({
                success: false,
                error: 'sourceContent and sourceFormat are required'
            });
        }
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }
        
        const section = await ContentManager.importContent(id, sourceContent, sourceFormat, userId);
        
        res.json({
            success: true,
            section,
            message: 'Content imported successfully'
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
 * GET /api/content/sections/:id/export - Export section content
 */
router.get('/sections/:id/export', async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'markdown', includeMetadata = false } = req.query;
        
        const exportData = await ContentManager.exportContent(id, format, {
            includeMetadata: includeMetadata === 'true'
        });
        
        // Set appropriate headers for download
        const extension = format === 'html' ? 'html' : 'md';
        const contentType = format === 'html' ? 'text/html' : 'text/markdown';
        
        res.set({
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="section-${id}.${extension}"`
        });
        
        if (includeMetadata === 'true') {
            res.json({
                success: true,
                export: exportData
            });
        } else {
            res.send(exportData);
        }
    } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/content/convert - Convert content between formats
 */
router.post('/convert', async (req, res) => {
    try {
        const { content, fromFormat, toFormat } = req.body;
        
        if (!content || !fromFormat || !toFormat) {
            return res.status(400).json({
                success: false,
                error: 'content, fromFormat, and toFormat are required'
            });
        }
        
        const convertedContent = contentConverter.convertContent(content, fromFormat, toFormat);
        
        res.json({
            success: true,
            convertedContent,
            fromFormat,
            toFormat
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/content/search - Search content across sections
 */
router.get('/search', async (req, res) => {
    try {
        const { courseId, query, format, limit = 20, includeContent = false } = req.query;
        
        if (!courseId || !query) {
            return res.status(400).json({
                success: false,
                error: 'courseId and query are required'
            });
        }
        
        const results = await ContentManager.searchContent(courseId, query, {
            format,
            limit: parseInt(limit),
            includeContent: includeContent === 'true'
        });
        
        res.json({
            success: true,
            results,
            query,
            courseId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;