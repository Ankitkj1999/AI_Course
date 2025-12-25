import express from 'express';
import { Section } from '../models/index.js';
import SectionService from '../services/sectionService.js';
import ContentManager from '../services/contentManager.js';
import ContentVersioning from '../services/contentVersioning.js';
import {
    validateSectionCreation,
    validateSectionUpdate,
    validateNestingDepth,
    validateCourseStructure,
    validateSectionMove,
    validateBulkOperation
} from '../middleware/sectionValidation.js';

const router = express.Router();

/**
 * Section API Routes
 * RESTful endpoints for section management
 */

/**
 * POST /api/sections - Create a new section
 */
router.post('/',
    validateSectionCreation,
    validateNestingDepth,
    validateCourseStructure,
    async (req, res) => {
        try {
            const section = await SectionService.createSection(req.body);
            res.status(201).json({
                success: true,
                section,
                message: 'Section created successfully'
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
 * GET /api/sections/:id - Get a single section
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            includeContent = true, 
            format = null,
            includeVersions = false,
            includeStats = false,
            includeChildren = false
        } = req.query;
        
        const section = await Section.findById(id);
        if (!section) {
            return res.status(404).json({
                success: false,
                error: 'Section not found'
            });
        }
        
        let result = section.toObject();
        
        // Include content in specified format
        if (includeContent === 'true') {
            const contentData = await ContentManager.getSectionContent(id, format, {
                includeVersions: includeVersions === 'true',
                includeStats: includeStats === 'true'
            });
            result.contentData = contentData;
        }
        
        // Include children if requested
        if (includeChildren === 'true') {
            const children = await Section.find({ parentId: id }).sort({ order: 1 });
            result.children = children;
        }
        
        res.json({
            success: true,
            section: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/sections/:id - Update a section
 */
router.put('/:id',
    validateSectionUpdate,
    async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id || req.body.userId;
            
            const section = await SectionService.updateSection(id, {
                ...req.body,
                userId
            });
            
            res.json({
                success: true,
                section,
                message: 'Section updated successfully'
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
 * DELETE /api/sections/:id - Delete a section
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await SectionService.deleteSection(id);
        
        res.json({
            success: true,
            result,
            message: 'Section deleted successfully'
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
 * POST /api/sections/:id/move - Move a section
 */
router.post('/:id/move',
    validateSectionMove,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { newParentId, newOrder } = req.body;
            
            const section = await SectionService.moveSection(id, newParentId, newOrder);
            
            res.json({
                success: true,
                section,
                message: 'Section moved successfully'
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
 * POST /api/sections/:id/duplicate - Duplicate a section
 */
router.post('/:id/duplicate', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            newTitle, 
            includeChildren = true, 
            newParentId,
            userId 
        } = req.body;
        
        const duplicateSection = await SectionService.duplicateSection(id, {
            newTitle,
            includeChildren: includeChildren === true,
            newParentId,
            userId: userId || req.user?.id
        });
        
        res.status(201).json({
            success: true,
            section: duplicateSection,
            message: 'Section duplicated successfully'
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
 * POST /api/sections/bulk - Bulk operations on sections
 */
router.post('/bulk',
    validateBulkOperation,
    async (req, res) => {
        try {
            const { operation, sectionIds, ...options } = req.body;
            const userId = req.user?.id || options.userId;
            
            const result = await SectionService.bulkOperations(operation, sectionIds, {
                ...options,
                userId
            });
            
            res.json({
                success: true,
                result,
                message: `Bulk ${operation} completed`
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
 * POST /api/sections/reorder - Reorder sections
 */
router.post('/reorder', async (req, res) => {
    try {
        const { sectionIds, parentId, courseId } = req.body;
        
        if (!Array.isArray(sectionIds) || !courseId) {
            return res.status(400).json({
                success: false,
                error: 'sectionIds array and courseId are required'
            });
        }
        
        const sections = await SectionService.reorderSections(sectionIds, parentId, courseId);
        
        res.json({
            success: true,
            sections,
            message: 'Sections reordered successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/sections/:id/hierarchy - Get section with all descendants
 */
router.get('/:id/hierarchy', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            includeContent = false, 
            maxDepth = null 
        } = req.query;
        
        const sectionWithDescendants = await SectionService.getSectionWithDescendants(id, {
            includeContent: includeContent === 'true',
            maxDepth: maxDepth ? parseInt(maxDepth) : null
        });
        
        res.json({
            success: true,
            section: sectionWithDescendants
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
 * POST /api/sections/:sourceId/merge/:targetId - Merge two sections
 */
router.post('/:sourceId/merge/:targetId', async (req, res) => {
    try {
        const { sourceId, targetId } = req.params;
        const userId = req.user?.id || req.body.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }
        
        const mergedSection = await SectionService.mergeSections(sourceId, targetId, userId);
        
        res.json({
            success: true,
            section: mergedSection,
            message: 'Sections merged successfully'
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
 * POST /api/sections/:id/split - Split a section
 */
router.post('/:id/split', async (req, res) => {
    try {
        const { id } = req.params;
        const { splitPoints } = req.body;
        const userId = req.user?.id || req.body.userId;
        
        if (!Array.isArray(splitPoints) || splitPoints.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'splitPoints array is required'
            });
        }
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }
        
        const newSections = await SectionService.splitSection(id, splitPoints, userId);
        
        res.json({
            success: true,
            sections: newSections,
            message: 'Section split successfully'
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
 * GET /api/sections/:id/analytics - Get section analytics
 */
router.get('/:id/analytics', async (req, res) => {
    try {
        const { id } = req.params;
        const analytics = await SectionService.getSectionAnalytics(id);
        
        res.json({
            success: true,
            analytics
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