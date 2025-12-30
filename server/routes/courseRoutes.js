/**
 * Course Routes - Consolidated
 * 
 * All course-related routes including:
 * - Course CRUD operations
 * - Course creation with AI generation
 * - Legacy course support
 * - Course architecture management
 * - Course progress and hierarchy
 * - SEO data
 */

import express from 'express';
import { Course, Section, Language } from '../models/index.js';
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

// Dependencies to be injected
let requireAuth, optionalAuth, logger, unsplash;
let safeGet, safeGetArray, safeGetFirst;
let generateUniqueSlug, extractTitleFromContent, generateCourseSEO;

/**
 * Initialize function to inject dependencies
 */
export function initializeCourseRoutes(dependencies) {
  requireAuth = dependencies.requireAuth;
  optionalAuth = dependencies.optionalAuth;
  logger = dependencies.logger;
  unsplash = dependencies.unsplash;
  safeGet = dependencies.safeGet;
  safeGetArray = dependencies.safeGetArray;
  safeGetFirst = dependencies.safeGetFirst;
  generateUniqueSlug = dependencies.generateUniqueSlug;
  extractTitleFromContent = dependencies.extractTitleFromContent;
  generateCourseSEO = dependencies.generateCourseSEO;
}

// ============================================================================
// COURSE CREATION ROUTES
// ============================================================================

/**
 * POST /api/courses/generate - Create course with AI generation (new architecture)
 * This is the main course creation endpoint with Unsplash integration
 */
router.post('/generate', requireAuth, async (req, res) => {
  const { user, content, type, mainTopic, lang, isPublic } = req.body;

  const requestId = logger.llm.generateRequestId();
  const startTime = Date.now();

  logger.llm.logRequestStart(
    requestId,
    "/api/courses/generate",
    { mainTopic, type, contentLength: content?.length, lang },
    user,
    "unsplash"
  );

  try {
    // Add timeout to Unsplash API call
    const unsplashPromise = unsplash.search.getPhotos({
      query: mainTopic,
      page: 1,
      perPage: 1,
      orientation: "landscape",
    });
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Unsplash timeout')), 5000)
    );
    
    const result = await Promise.race([unsplashPromise, timeoutPromise]);

    const firstPhoto = safeGetFirst(result, "response.results");
    const photo = safeGet(firstPhoto, "urls.regular", null);

    if (!photo) {
      logger.llm.logValidationFailure(requestId, "/api/courses/generate", {
        expected: "response.results[0].urls.regular",
        issue: "No usable images returned",
      }, { mainTopic });
    }

    try {
      const { default: CourseGenerationService } = await import('../services/courseGenerationService.js');
      
      const newCourse = await CourseGenerationService.createCourseFromGeneration({
        content,
        type,
        mainTopic,
        photo,
        lang,
        isPublic: isPublic ?? false,
        generationMeta: {
          userPrompt: mainTopic,
          model: 'ai-generated',
          generatedAt: new Date()
        }
      }, user);
      
      // Create language record
      try {
        const newLang = new Language({ 
          userId: user, 
          courseId: newCourse._id, 
          lang: lang,
          course: newCourse.slug
        });
        await newLang.save();
      } catch (langError) {
        logger.warn('Language record creation failed:', langError.message);
      }

      const duration = Date.now() - startTime;

      logger.llm.logRequestSuccess(requestId, "/api/courses/generate", {
        courseId: newCourse._id,
        slug: newCourse.slug,
        hasPhoto: !!photo,
        sectionsCreated: newCourse.sections.length,
      }, duration, user, "unsplash");

      res.json({
        success: true,
        message: "Course created successfully with new architecture",
        courseId: newCourse._id,
        slug: newCourse.slug,
        isPublic: newCourse.isPublic,
        sectionsCreated: newCourse.sections.length,
        architecture: 'section-based',
        performanceMs: duration
      });
    } catch (error) {
      logger.llm.logRequestError(requestId, "/api/courses/generate", error, {
        userId: user,
        mainTopic,
        step: "course_generation",
      });
      res.status(500).json({ success: false, message: "Course generation failed", error: error.message });
    }
  } catch (error) {
    // Unsplash failed - continue without photo
    logger.llm.logRequestError(requestId, "/api/courses/generate", error, {
      userId: user,
      mainTopic,
      step: "unsplash_api",
    });

    try {
      const { default: CourseGenerationService } = await import('../services/courseGenerationService.js');
      
      const newCourse = await CourseGenerationService.createCourseFromGeneration({
        content,
        type,
        mainTopic,
        photo: null,
        lang,
        isPublic: isPublic ?? false,
        generationMeta: {
          userPrompt: mainTopic,
          model: 'ai-generated',
          generatedAt: new Date()
        }
      }, user);
      
      try {
        const newLang = new Language({ 
          userId: user, 
          courseId: newCourse._id, 
          lang: lang,
          course: newCourse.slug
        });
        await newLang.save();
      } catch (langError) {
        logger.warn('Language record creation failed:', langError.message);
      }

      const duration = Date.now() - startTime;

      res.json({
        success: true,
        message: "Course created successfully (without image)",
        courseId: newCourse._id,
        slug: newCourse.slug,
        sectionsCreated: newCourse.sections.length,
        architecture: 'section-based'
      });
    } catch (courseError) {
      logger.llm.logRequestError(requestId, "/api/courses/generate", courseError, {
        userId: user,
        mainTopic,
        step: "fallback_course_generation",
      });
      res.status(500).json({ success: false, message: "Course generation failed", error: courseError.message });
    }
  }
});

/**
 * POST /api/courses/shared - Create shared course (legacy support)
 */
router.post('/shared', requireAuth, async (req, res) => {
  const { user, content, type, mainTopic } = req.body;

  try {
    const result = await unsplash.search.getPhotos({
      query: mainTopic,
      page: 1,
      perPage: 1,
      orientation: "landscape",
    });

    const firstPhoto = safeGetFirst(result, "response.results");
    const photo = safeGet(firstPhoto, "urls.regular", null);

    try {
      const title = extractTitleFromContent(content, mainTopic);
      const slug = await generateUniqueSlug(title, Course);

      const newCourse = new Course({
        user,
        content,
        type,
        mainTopic,
        slug,
        photo,
      });
      await newCourse.save();

      logger.info(`Shared course created: ${newCourse._id} with slug: ${slug}`);
      res.json({
        success: true,
        message: "Course created successfully",
        courseId: newCourse._id,
        slug: slug,
      });
    } catch (error) {
      logger.error(`Shared course creation error: ${error.message}`);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  } catch (error) {
    // Continue without photo
    try {
      const title = extractTitleFromContent(content, mainTopic);
      const slug = await generateUniqueSlug(title, Course);

      const newCourse = new Course({
        user,
        content,
        type,
        mainTopic,
        slug,
        photo: null,
      });
      await newCourse.save();

      res.json({
        success: true,
        message: "Course created successfully (without image)",
        courseId: newCourse._id,
        slug: slug,
      });
    } catch (courseError) {
      logger.error(`Shared course creation fallback error: ${courseError.message}`);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
});

/**
 * POST /api/courses - Create a new course (RESTful)
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


// ============================================================================
// COURSE RETRIEVAL ROUTES
// ============================================================================

/**
 * GET /api/courses - List courses with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const { 
      userId, 
      page = 1, 
      limit = 9, 
      visibility = "all",
      query = '',
      type = null,
      status = null,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Build query based on filters
    const dbQuery = {};
    if (userId) dbQuery.user = userId;
    if (visibility === "public") {
      dbQuery.isPublic = true;
    } else if (visibility === "private") {
      dbQuery.isPublic = false;
    }
    if (type) dbQuery.type = type;
    if (status === 'completed') dbQuery.completed = true;
    if (status === 'in-progress') dbQuery.completed = false;

    // Add search if query provided
    if (query && query.trim()) {
      const searchRegex = new RegExp(query.trim(), 'i');
      dbQuery.$or = [
        { title: searchRegex },
        { mainTopic: searchRegex }
      ];
    }

    const courses = await Course.find(dbQuery)
      .select(
        "user content type mainTopic title slug photo date end completed isPublic forkCount forkedFrom ownerName generationMeta sections"
      )
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ [sortBy === 'date' ? 'date' : sortBy]: sortOrder === 'desc' ? -1 : 1 });

    const total = await Course.countDocuments(dbQuery);

    // Enhance courses with description/summary for frontend
    const enhancedCourses = courses.map(course => {
      let description = course.mainTopic;
      
      if (course.content) {
        const contentText = course.content.replace(/[#*`]/g, '').trim();
        const firstParagraph = contentText.split('\n\n')[0];
        const firstSentence = firstParagraph.split('.')[0];
        description = firstSentence.length > 10 && firstSentence.length < 200 
          ? firstSentence + '.'
          : course.mainTopic;
      }
      
      return {
        _id: course._id,
        user: course.user,
        title: course.title || course.mainTopic,
        mainTopic: course.mainTopic,
        description: description,
        slug: course.slug,
        photo: course.photo,
        type: course.type,
        date: course.date,
        end: course.end,
        completed: course.completed,
        isPublic: course.isPublic,
        forkCount: course.forkCount,
        forkedFrom: course.forkedFrom,
        ownerName: course.ownerName,
        content: course.content,
        hasContent: !!course.content,
        hasSections: course.sections && course.sections.length > 0,
        sectionCount: course.sections ? course.sections.length : 0,
        generationMeta: course.generationMeta
      };
    });

    res.json({
      success: true,
      courses: enhancedCourses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error("Get courses error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

/**
 * GET /api/courses/by-slug/:slug - Get course by slug
 */
router.get('/by-slug/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const isOwner = req.user && course.user === req.user._id.toString();
    const isPublic = course.isPublic === true;

    if (!isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "This content is private",
      });
    }

    logger.info(`Course accessed by slug: ${slug}`);
    res.json({
      success: true,
      course: course,
    });
  } catch (error) {
    logger.error(`Get course by slug error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * GET /api/courses/by-id/:id - Get course by ID (legacy support)
 */
router.get('/by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (course.slug) {
      return res.json({
        success: true,
        redirect: `/course/${course.slug}`,
        course: course,
      });
    }

    res.json({
      success: true,
      course: course,
    });
  } catch (error) {
    logger.error(`Get course by ID error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * GET /api/courses/shareable - Get shareable course
 */
router.get('/shareable', async (req, res) => {
  try {
    const { id } = req.query;
    const result = await Course.find({ _id: id });
    res.json(result);
  } catch (error) {
    logger.error(`Get shareable course error: ${error.message}`);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * GET /api/courses/:id - Get a single course by ID
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

// ============================================================================
// COURSE UPDATE ROUTES
// ============================================================================

/**
 * PUT /api/courses/:id - Update a course (RESTful)
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
 * POST /api/courses/update - Update course content (legacy)
 */
router.post('/update', async (req, res) => {
  const { content, courseId } = req.body;
  try {
    await Course.findOneAndUpdate({ _id: courseId }, { $set: { content: content } });
    res.json({ success: true, message: "Course updated successfully" });
  } catch (error) {
    logger.error("Update course error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * POST /api/courses/finish - Mark course as completed
 */
router.post('/finish', async (req, res) => {
  const { courseId } = req.body;
  try {
    await Course.findOneAndUpdate(
      { _id: courseId },
      { $set: { completed: true, end: Date.now() } }
    );
    res.json({ success: true, message: "Course completed successfully" });
  } catch (error) {
    logger.error("Finish course error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
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


// ============================================================================
// COURSE DELETE ROUTES
// ============================================================================

/**
 * DELETE /api/courses/:id - Delete a course (RESTful)
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
 * POST /api/courses/delete - Delete course (legacy)
 */
router.post('/delete', async (req, res) => {
  const { courseId } = req.body;
  try {
    await Course.findOneAndDelete({ _id: courseId });
    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    logger.error("Delete course error:", error);
    res.json({ success: false, message: "Internal Server Error" });
  }
});

// ============================================================================
// COURSE ARCHITECTURE & CONVERSION ROUTES
// ============================================================================

/**
 * POST /api/courses/:courseId/convert - Convert legacy course to new architecture
 */
router.post('/:courseId/convert', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    const { default: CourseGenerationService } = await import('../services/courseGenerationService.js');
    const convertedCourse = await CourseGenerationService.convertLegacyCourse(courseId, userId);
    
    res.json({
      success: true,
      message: "Course successfully converted to new architecture",
      courseId: convertedCourse._id,
      slug: convertedCourse.slug,
      sectionsCreated: convertedCourse.sections.length,
      architecture: 'section-based'
    });
  } catch (error) {
    logger.error('Course conversion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Course conversion failed"
    });
  }
});

/**
 * GET /api/courses/:courseId/architecture - Get course architecture info
 */
router.get('/:courseId/architecture', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }
    
    if (course.user !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    const { default: CourseGenerationService } = await import('../services/courseGenerationService.js');
    
    const isNew = CourseGenerationService.isNewArchitecture(course);
    const isLegacy = CourseGenerationService.isLegacyCourse(course);
    
    res.json({
      success: true,
      courseId: course._id,
      title: course.title,
      architecture: {
        isNewArchitecture: isNew,
        isLegacyCourse: isLegacy,
        hasContent: !!course.content,
        hasSections: course.sections && course.sections.length > 0,
        sectionCount: course.sections ? course.sections.length : 0,
        needsMigration: isLegacy
      },
      generationMeta: course.generationMeta
    });
  } catch (error) {
    logger.error('Get course architecture error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get course architecture info"
    });
  }
});

/**
 * GET /api/courses/:courseId/stats - Get course generation stats
 */
router.get('/:courseId/stats', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const { default: CourseGenerationService } = await import('../services/courseGenerationService.js');
    const stats = await CourseGenerationService.getGenerationStats(courseId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Get course stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get course statistics"
    });
  }
});

// ============================================================================
// COURSE CONTENT & PROGRESS ROUTES
// ============================================================================

/**
 * GET /api/courses/:courseId/content - Get course content with sections
 */
router.get('/:courseId/content', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id.toString();
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }
    
    const isOwner = course.user === userId;
    const isPublic = course.isPublic === true;
    
    if (!isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    const { default: CourseGenerationService } = await import('../services/courseGenerationService.js');
    
    const isNewArchitecture = CourseGenerationService.isNewArchitecture(course);
    const isLegacy = CourseGenerationService.isLegacyCourse(course);
    
    if (isNewArchitecture) {
      const sections = await Section.find({ courseId: courseId })
        .sort({ order: 1, createdAt: 1 });
      
      res.json({
        success: true,
        architecture: 'section-based',
        course: {
          _id: course._id,
          title: course.title || course.mainTopic,
          slug: course.slug,
          mainTopic: course.mainTopic,
          type: course.type,
          photo: course.photo,
          isPublic: course.isPublic,
          createdAt: course.date,
          generationMeta: course.generationMeta
        },
        sections: sections.map(section => ({
          _id: section._id,
          title: section.title,
          order: section.order,
          parentId: section.parentId,
          level: section.level,
          content: {
            markdown: section.content?.markdown,
            html: section.content?.html,
            lexical: section.content?.lexical
          },
          metadata: section.metadata,
          createdAt: section.createdAt
        })),
        sectionCount: sections.length
      });
    } else if (isLegacy) {
      res.json({
        success: true,
        architecture: 'legacy',
        course: {
          _id: course._id,
          title: course.title || course.mainTopic,
          slug: course.slug,
          mainTopic: course.mainTopic,
          type: course.type,
          photo: course.photo,
          isPublic: course.isPublic,
          content: course.content,
          createdAt: course.date
        },
        sections: [],
        sectionCount: 0,
        migrationAvailable: true,
        message: "This course uses legacy architecture. Consider converting to section-based format."
      });
    } else {
      res.json({
        success: true,
        architecture: 'empty',
        course: {
          _id: course._id,
          title: course.title || course.mainTopic,
          slug: course.slug,
          mainTopic: course.mainTopic,
          type: course.type,
          photo: course.photo,
          isPublic: course.isPublic,
          createdAt: course.date
        },
        sections: [],
        sectionCount: 0,
        message: "Course has no content yet."
      });
    }
  } catch (error) {
    logger.error("Get course content error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

/**
 * GET /api/courses/:courseId/progress - Get course progress
 */
router.get('/:courseId/progress', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id.toString();
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }
    
    const isOwner = course.user === userId;
    const isPublic = course.isPublic === true;
    
    if (!isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    const sections = await Section.find({ courseId: courseId });
    const totalSections = sections.length;
    const completedSections = sections.filter(s => s.content?.metadata?.done).length;
    const progressPercentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
    
    const language = await Language.findOne({ courseId: courseId, userId: userId });
    
    res.json({
      success: true,
      courseId: course._id,
      progress: {
        completed: completedSections,
        total: totalSections,
        percentage: progressPercentage,
        isCompleted: course.completed || false
      },
      language: language?.lang || 'english',
      course: {
        _id: course._id,
        title: course.title || course.mainTopic,
        mainTopic: course.mainTopic,
        slug: course.slug,
        type: course.type,
        photo: course.photo,
        isPublic: course.isPublic,
        createdAt: course.date,
        content: course.content || null
      }
    });
  } catch (error) {
    logger.error("Get course progress error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

/**
 * GET /api/courses/:courseId/hierarchy - Get course section hierarchy
 */
router.get('/:courseId/hierarchy', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { includeContent = false } = req.query;
    const userId = req.user._id.toString();
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }
    
    const isOwner = course.user === userId;
    const isPublic = course.isPublic === true;
    
    if (!isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    const sections = await Section.find({ courseId: courseId })
      .sort({ order: 1, createdAt: 1 });
    
    const rootSections = sections.filter(s => !s.parentId);
    
    const buildHierarchy = (parentSections) => {
      return parentSections.map(section => {
        const children = sections.filter(s => 
          s.parentId && s.parentId.toString() === section._id.toString()
        );
        
        const sectionData = {
          _id: section._id,
          title: section.title,
          order: section.order,
          level: section.level || 1,
          hasChildren: children.length > 0,
          createdAt: section.createdAt
        };
        
        if (includeContent === 'true') {
          sectionData.content = section.content;
        }
        
        if (children.length > 0) {
          sectionData.children = buildHierarchy(children);
        }
        
        return sectionData;
      });
    };
    
    const hierarchy = buildHierarchy(rootSections);
    
    res.json({
      success: true,
      courseId: course._id,
      course: {
        _id: course._id,
        title: course.title || course.mainTopic,
        mainTopic: course.mainTopic,
        slug: course.slug,
        type: course.type,
        photo: course.photo,
        isPublic: course.isPublic,
        createdAt: course.date
      },
      hierarchy: hierarchy,
      totalSections: sections.length,
      rootSections: rootSections.length
    });
  } catch (error) {
    logger.error("Get course hierarchy error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});


// ============================================================================
// COURSE FORK & ANALYTICS ROUTES
// ============================================================================

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

// ============================================================================
// SEO ROUTES
// ============================================================================

/**
 * GET /api/courses/seo/:slug - Get SEO data for course
 */
router.get('/seo/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const baseUrl = process.env.WEBSITE_URL || "http://localhost:8080";
    const seoData = generateCourseSEO(course, baseUrl);

    res.json({
      success: true,
      seo: seoData,
    });
  } catch (error) {
    logger.error(`Get SEO data error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
