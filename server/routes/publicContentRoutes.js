/**
 * Public Content Routes
 * 
 * This module handles all public content-related routes including:
 * - Visibility management (toggle public/private)
 * - Public content discovery (browse, search, filter)
 * - Fork functionality (copy public content)
 * 
 * Dependencies are injected via initializePublicContentRoutes()
 */

import express from 'express';

const router = express.Router();

// Dependencies will be injected
let requireAuth, optionalAuth, logger;
let Course, Quiz;
let generateUniqueSlug;

/**
 * Initialize function to inject dependencies
 * @param {Object} dependencies - Object containing all required dependencies
 */
export function initializePublicContentRoutes(dependencies) {
  requireAuth = dependencies.requireAuth;
  optionalAuth = dependencies.optionalAuth;
  logger = dependencies.logger;
  Course = dependencies.Course;
  Quiz = dependencies.Quiz;

  generateUniqueSlug = dependencies.generateUniqueSlug;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the correct model based on content type
 * @param {string} contentType - Type of content (course, quiz)
 * @returns {Model|null} Mongoose model or null if invalid type
 */
const getContentModel = (contentType) => {
  const models = {
    course: Course,
    quiz: Quiz,
  };
  return models[contentType] || null;
};

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// ============================================================================
// VISIBILITY MANAGEMENT ROUTES
// ============================================================================

/**
 * PATCH /api/:contentType/:slug/visibility
 * Toggle content visibility (public/private)
 */
router.patch('/:contentType/:slug/visibility', requireAuth, async (req, res) => {
  try {
    const { contentType, slug } = req.params;
    const { isPublic } = req.body;
    const userId = req.user._id.toString();

    // Validate content type
    const Model = getContentModel(contentType);
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type',
      });
    }

    // Validate isPublic parameter
    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isPublic must be a boolean value',
      });
    }

    // Find content by slug
    const content = await Model.findOne({ slug });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: `${capitalize(contentType)} not found`,
      });
    }

    // Verify ownership
    if (content.userId !== userId && content.user !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this content',
      });
    }

    // Update visibility
    content.isPublic = isPublic;
    await content.save();

    logger.info(`${contentType} visibility updated: ${slug} - isPublic: ${isPublic}`);

    res.json({
      success: true,
      isPublic: content.isPublic,
      message: `${capitalize(contentType)} visibility updated successfully`,
    });
  } catch (error) {
    logger.error(`Toggle visibility error: ${error.message}`, {
      error: error.stack,
      contentType: req.params.contentType,
      slug: req.params.slug,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update visibility',
    });
  }
});

/**
 * GET /api/:contentType/:slug/visibility
 * Get visibility status for content
 */
router.get('/:contentType/:slug/visibility', requireAuth, async (req, res) => {
  try {
    const { contentType, slug } = req.params;
    const userId = req.user._id.toString();

    // Validate content type
    const Model = getContentModel(contentType);
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type',
      });
    }

    // Find content by slug
    const content = await Model.findOne({ slug });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: `${capitalize(contentType)} not found`,
      });
    }

    // Verify ownership
    if (content.userId !== userId && content.user !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this content visibility status',
      });
    }

    logger.info(`${contentType} visibility status retrieved: ${slug}`);

    res.json({
      success: true,
      isPublic: content.isPublic || false,
      forkCount: content.forkCount || 0,
    });
  } catch (error) {
    logger.error(`Get visibility status error: ${error.message}`, {
      error: error.stack,
      contentType: req.params.contentType,
      slug: req.params.slug,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve visibility status',
    });
  }
});

// ============================================================================
// PUBLIC CONTENT DISCOVERY ROUTES
// ============================================================================

/**
 * GET /api/public/content
 * Get unified public content with filtering and pagination
 */
router.get('/public/content', optionalAuth, async (req, res) => {
  try {
    const {
      type = 'all',
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'recent',
    } = req.query;

    // Validate and parse pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build base query for public content
    const baseQuery = { isPublic: true };

    // Add search functionality if search term provided
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      baseQuery.$or = [
        { title: searchRegex },
        { keyword: searchRegex },
        { mainTopic: searchRegex },
      ];
    }

    // Determine which models to query based on type
    let modelsToQuery = [];
    if (type === 'all') {
      modelsToQuery = [
        { model: Course, type: 'course' },
        { model: Quiz, type: 'quiz' },
      ];
    } else {
      const Model = getContentModel(type);
      if (!Model) {
        return res.status(400).json({
          success: false,
          message: 'Invalid content type. Must be: course, quiz, or all',
        });
      }
      modelsToQuery = [{ model: Model, type }];
    }

    // Determine sort order
    let sortOptions = {};
    switch (sortBy) {
      case 'popular':
        sortOptions = { viewCount: -1, createdAt: -1 };
        break;
      case 'forks':
        sortOptions = { forkCount: -1, createdAt: -1 };
        break;
      case 'recent':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // Query all relevant models
    const contentPromises = modelsToQuery.map(async ({ model, type }) => {
      const items = await model
        .find(baseQuery)
        .select(
          'title slug keyword mainTopic ownerName userId user forkCount viewCount createdAt date isPublic forkedFrom photo'
        )
        .sort(sortOptions)
        .lean();

      // Add contentType field to each item
      return items.map((item) => ({
        ...item,
        contentType: type,
        // Normalize date field (Course uses 'date', others use 'createdAt')
        createdAt: item.createdAt || item.date,
      }));
    });

    // Wait for all queries to complete
    const allContentArrays = await Promise.all(contentPromises);
    const allContent = allContentArrays.flat();

    // Sort combined results
    allContent.sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.viewCount || 0) - (a.viewCount || 0);
      } else if (sortBy === 'forks') {
        return (b.forkCount || 0) - (a.forkCount || 0);
      } else {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    // Apply pagination to combined results
    const totalItems = allContent.length;
    const paginatedContent = allContent.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(totalItems / limitNum);

    logger.info(`Public content retrieved: type=${type}, page=${pageNum}, results=${paginatedContent.length}`);

    res.json({
      success: true,
      data: paginatedContent,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    logger.error(`Get public content error: ${error.message}`, {
      error: error.stack,
      query: req.query,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve public content',
    });
  }
});

/**
 * GET /api/public/:contentType
 * Get public content by specific type with pagination
 */
router.get('/public/:contentType', optionalAuth, async (req, res) => {
  try {
    const { contentType } = req.params;
    const { page = 1, limit = 20, search = '', sortBy = 'recent' } = req.query;

    // Validate content type
    const Model = getContentModel(contentType);
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type. Must be: course or quiz',
      });
    }

    // Validate and parse pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build query for public content
    const query = { isPublic: true };

    // Add search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { keyword: searchRegex },
        { mainTopic: searchRegex },
      ];
    }

    // Determine sort order
    let sortOptions = {};
    switch (sortBy) {
      case 'popular':
        sortOptions = { viewCount: -1, createdAt: -1 };
        break;
      case 'forks':
        sortOptions = { forkCount: -1, createdAt: -1 };
        break;
      case 'recent':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // Get total count for pagination
    const totalItems = await Model.countDocuments(query);

    // Query content with pagination
    const content = await Model.find(query)
      .select(
        'title slug keyword mainTopic ownerName userId user forkCount viewCount createdAt date isPublic forkedFrom photo'
      )
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Add contentType field and normalize date
    const normalizedContent = content.map((item) => ({
      ...item,
      contentType,
      createdAt: item.createdAt || item.date,
    }));

    const totalPages = Math.ceil(totalItems / limitNum);

    logger.info(`Public ${contentType} content retrieved: page=${pageNum}, results=${content.length}`);

    res.json({
      success: true,
      data: normalizedContent,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    logger.error(`Get public ${req.params.contentType} error: ${error.message}`, {
      error: error.stack,
      contentType: req.params.contentType,
      query: req.query,
    });
    res.status(500).json({
      success: false,
      message: `Failed to retrieve public ${req.params.contentType} content`,
    });
  }
});

/**
 * GET /api/public/:contentType/:slug
 * Get single public content by slug
 */
router.get('/public/:contentType/:slug', optionalAuth, async (req, res) => {
  try {
    const { contentType, slug } = req.params;

    // Validate content type
    const Model = getContentModel(contentType);
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type. Must be: course or quiz',
      });
    }

    // Find content by slug
    const content = await Model.findOne({ slug }).lean();

    if (!content) {
      return res.status(404).json({
        success: false,
        message: `${capitalize(contentType)} not found`,
      });
    }

    // Check if content is public
    if (!content.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'This content is private and cannot be accessed',
      });
    }

    // Increment view count (fire and forget)
    Model.findByIdAndUpdate(content._id, { $inc: { viewCount: 1 } }).catch((err) => {
      logger.warn(`Failed to increment view count: ${err.message}`);
    });

    // Add contentType field
    const normalizedContent = {
      ...content,
      contentType,
      createdAt: content.createdAt || content.date,
    };

    logger.info(`Public ${contentType} retrieved: ${slug}`);

    res.json({
      success: true,
      content: normalizedContent,
    });
  } catch (error) {
    logger.error(`Get public ${req.params.contentType} by slug error: ${error.message}`, {
      error: error.stack,
      contentType: req.params.contentType,
      slug: req.params.slug,
    });
    res.status(500).json({
      success: false,
      message: `Failed to retrieve public ${req.params.contentType}`,
    });
  }
});

// ============================================================================
// FORK FUNCTIONALITY ROUTES
// ============================================================================

/**
 * POST /api/:contentType/:slug/fork
 * Fork (copy) public content to user's account
 */
router.post('/:contentType/:slug/fork', requireAuth, async (req, res) => {
  try {
    const { contentType, slug } = req.params;
    const userId = req.user._id.toString();
    const userName = req.user.mName || req.user.email;

    // Validate content type
    const Model = getContentModel(contentType);
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type',
      });
    }

    // Find the original content by slug
    const originalContent = await Model.findOne({ slug });

    if (!originalContent) {
      return res.status(404).json({
        success: false,
        message: `${capitalize(contentType)} not found`,
      });
    }

    // Check if content is public
    if (!originalContent.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Cannot fork private content',
      });
    }

    // Check if user is trying to fork their own content
    const originalOwnerId = originalContent.userId || originalContent.user;
    if (originalOwnerId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot fork your own content',
      });
    }

    // Create a copy of the content
    const contentCopy = originalContent.toObject();
    delete contentCopy._id;
    delete contentCopy.__v;

    // Generate a unique slug for the forked content
    const baseTitle = contentCopy.title || contentCopy.mainTopic || slug;
    const uniqueSlug = await generateUniqueSlug(`${baseTitle} fork`, Model);

    // Set forked content properties
    contentCopy.slug = uniqueSlug;
    contentCopy.userId = userId;
    contentCopy.user = userId; // For backward compatibility with Course model
    contentCopy.isPublic = false; // Forked content is private by default
    contentCopy.forkCount = 0; // Reset fork count for the copy
    contentCopy.viewCount = 0; // Reset view count
    contentCopy.ownerName = userName;

    // Set forkedFrom metadata
    contentCopy.forkedFrom = {
      contentId: originalContent._id,
      originalOwnerId: originalOwnerId,
      originalOwnerName: originalContent.ownerName || 'Unknown User',
      forkedAt: new Date(),
    };

    // Reset dates
    contentCopy.createdAt = new Date();
    contentCopy.date = new Date();

    // Create the forked content
    const forkedContent = new Model(contentCopy);
    await forkedContent.save();

    // Increment fork count on original content
    await Model.findByIdAndUpdate(originalContent._id, {
      $inc: { forkCount: 1 },
    });

    logger.info(`Content forked successfully: ${contentType}/${slug} -> ${uniqueSlug} by user ${userId}`);

    res.json({
      success: true,
      message: 'Content forked successfully',
      forkedContent: {
        _id: forkedContent._id,
        slug: forkedContent.slug,
        title: forkedContent.title || forkedContent.mainTopic,
        contentType,
      },
    });
  } catch (error) {
    logger.error(`Fork ${req.params.contentType} error: ${error.message}`, {
      error: error.stack,
      contentType: req.params.contentType,
      slug: req.params.slug,
      userId: req.user?._id,
    });
    res.status(500).json({
      success: false,
      message: `Failed to fork ${req.params.contentType}`,
    });
  }
});

export default router;
