import express from 'express';
import { Quiz } from '../models/index.js';
import { generateSlug, generateUniqueSlug } from '../utils/slugify.js';

const router = express.Router();

// Dependencies injected from server.js
let deps = {
  requireAuth: null,
  optionalAuth: null,
  logger: null,
  llmService: null
};

/**
 * Initialize quiz routes with dependencies
 */
export const initializeQuizRoutes = (dependencies) => {
  deps = { ...deps, ...dependencies };
};

// ============================================
// QUIZ CRUD ENDPOINTS
// ============================================

/**
 * POST /api/quiz/create
 * Create a new quiz using AI generation
 */
router.post('/create', (req, res, next) => deps.requireAuth(req, res, next), async (req, res) => {
  const requestId = deps.logger.llm.generateRequestId();
  const startTime = Date.now();

  try {
    const {
      userId,
      keyword,
      title,
      format,
      provider,
      model,
      questionAndAnswers,
      isPublic,
    } = req.body;

    deps.logger.llm.logRequestStart(
      requestId,
      '/api/quiz/create',
      { keyword, title, format, provider, model },
      userId,
      provider
    );

    if (!userId || !keyword || !title) {
      return res.status(400).json({
        success: false,
        message: 'userId, keyword, and title are required',
      });
    }

    // Generate quiz content using AI
    const quizPrompt = `Create a comprehensive quiz about "${keyword}" with the title "${title}". 
        Format: ${format || 'mixed'}
        
        Generate 15-20 multiple choice questions in this markdown format:
        # Question text here?
        - Wrong answer option
        -* Correct answer option (marked with *)
        - Wrong answer option
        - Wrong answer option
        ## Explanation of the correct answer here
        
        Make the questions challenging and cover various aspects of the topic.`;

    const result = await deps.llmService.generateContent(quizPrompt, {
      provider: provider,
      model: model,
    });

    if (!result.success) {
      deps.logger.llm.logRequestError(
        requestId,
        '/api/quiz/create',
        new Error(result.error || 'Failed to generate quiz content'),
        { userId, keyword, title, provider, model }
      );
      throw new Error(result.error || 'Failed to generate quiz content');
    }

    const quizContent = result.data.content;

    // Generate unique slug
    const baseSlug = generateSlug(`${title}-${Date.now()}`);
    const slug = await generateUniqueSlug(baseSlug, Quiz);

    // Create quiz
    const newQuiz = new Quiz({
      userId,
      keyword,
      title,
      slug,
      format: format || 'mixed',
      content: quizContent,
      tokens: {
        prompt: quizPrompt.length,
        completion: quizContent.length,
        total: quizPrompt.length + quizContent.length,
      },
      questionAndAnswers: questionAndAnswers || [],
      viewCount: 0,
      lastVisitedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: isPublic ?? false,
    });

    await newQuiz.save();

    const duration = Date.now() - startTime;

    deps.logger.llm.logRequestSuccess(
      requestId,
      '/api/quiz/create',
      {
        quizId: newQuiz._id,
        slug,
        keyword,
        title,
        contentLength: quizContent?.length,
        provider: result.data.provider,
      },
      duration,
      userId,
      result.data.provider
    );

    res.json({
      success: true,
      message: 'Quiz created successfully',
      quiz: {
        _id: newQuiz._id,
        slug: newQuiz.slug,
        title: newQuiz.title,
        keyword: newQuiz.keyword,
        isPublic: newQuiz.isPublic,
      },
    });
  } catch (error) {
    deps.logger.llm.logRequestError(requestId, '/api/quiz/create', error, {
      userId: req.body.userId,
      keyword: req.body.keyword,
      title: req.body.title,
      provider: req.body.provider,
      model: req.body.model,
      duration: Date.now() - startTime,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create quiz',
    });
  }
});

/**
 * GET /api/quizzes
 * Get user's quizzes with pagination and visibility filter
 */
router.get('/', async (req, res) => {
  try {
    const { userId, page = 1, limit = 10, visibility = 'all' } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    // Build query based on visibility filter
    const query = { userId };
    if (visibility === 'public') {
      query.isPublic = true;
    } else if (visibility === 'private') {
      query.isPublic = false;
    }

    const skip = (page - 1) * limit;
    const totalCount = await Quiz.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const quizzes = await Quiz.find(query)
      .select(
        '_id userId keyword title slug format tokens viewCount lastVisitedAt createdAt updatedAt isPublic forkCount forkedFrom ownerName'
      )
      .sort({ updatedAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: quizzes,
      totalCount,
      totalPages,
      currPage: parseInt(page),
      perPage: parseInt(limit),
    });
  } catch (error) {
    deps.logger.error(`Get quizzes error: ${error.message}`, { error: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quizzes',
    });
  }
});

/**
 * GET /api/quiz/:slug
 * Get quiz by slug (public or owner access)
 */
router.get('/:slug', (req, res, next) => deps.optionalAuth(req, res, next), async (req, res) => {
  try {
    const { slug } = req.params;

    const quiz = await Quiz.findOne({ slug });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Check access control
    const isOwner = req.user && quiz.userId === req.user._id.toString();
    const isPublic = quiz.isPublic === true;

    if (!isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'This content is private',
      });
    }

    // Increment view count
    quiz.viewCount += 1;
    quiz.lastVisitedAt = new Date();
    await quiz.save();

    deps.logger.info(`Quiz accessed by slug: ${slug}`);

    res.json({
      success: true,
      quiz: quiz,
    });
  } catch (error) {
    deps.logger.error(`Get quiz by slug error: ${error.message}`, {
      error: error.stack,
      slug: req.params.slug,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz',
    });
  }
});

/**
 * GET /api/quiz/id/:id
 * Get quiz by ID (Legacy support)
 */
router.get('/id/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Increment view count
    quiz.viewCount += 1;
    quiz.lastVisitedAt = new Date();
    await quiz.save();

    // If quiz has slug, suggest redirect
    if (quiz.slug) {
      return res.json({
        success: true,
        quiz: quiz,
        redirect: `/quiz/${quiz.slug}`,
      });
    }

    deps.logger.info(`Quiz accessed by ID: ${id}`);

    res.json({
      success: true,
      quiz: quiz,
    });
  } catch (error) {
    deps.logger.error(`Get quiz by ID error: ${error.message}`, {
      error: error.stack,
      id: req.params.id,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz',
    });
  }
});

/**
 * DELETE /api/quiz/:slug
 * Delete quiz by slug
 */
router.delete('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    const quiz = await Quiz.findOneAndDelete({ slug, userId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or unauthorized',
      });
    }

    deps.logger.info(`Quiz deleted: ${quiz._id} (${slug})`);

    res.json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    deps.logger.error(`Delete quiz error: ${error.message}`, {
      error: error.stack,
      slug: req.params.slug,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz',
    });
  }
});

// ============================================
// QUIZ FROM DOCUMENT ENDPOINT
// ============================================

/**
 * POST /api/quiz/from-document
 * Generate quiz from uploaded document
 */
router.post('/from-document', (req, res, next) => deps.requireAuth(req, res, next), async (req, res) => {
  const { DocumentProcessing } = await import('../models/DocumentProcessing.js');
  
  const { processingId, text, title, keyword } = req.body;
  const userId = req.user._id.toString();

  const requestId = deps.logger.llm.generateRequestId();
  const startTime = Date.now();

  deps.logger.llm.logRequestStart(
    requestId,
    '/api/quiz/from-document',
    { hasProcessingId: !!processingId, hasDirectText: !!text, title, keyword },
    userId,
    'document-generation'
  );

  try {
    let extractedText = text;
    let sourceDocument = null;

    // If processing ID provided, retrieve extracted text
    if (processingId && !text) {
      const processing = await DocumentProcessing.findById(processingId);

      if (!processing) {
        return res.status(404).json({
          success: false,
          message: 'Processing record not found',
        });
      }

      if (processing.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access to processing record',
        });
      }

      if (processing.extractionStatus !== 'completed') {
        return res.status(400).json({
          success: false,
          message: `Extraction not complete. Current status: ${processing.extractionStatus}`,
        });
      }

      extractedText = processing.extractedText;
      sourceDocument = {
        processingId: processing._id,
        filename: processing.filename,
        extractedFrom: processing.fileType,
      };
    }

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message: 'Either processingId or text must be provided',
      });
    }

    // Check if content is sufficient
    if (extractedText.length < 100) {
      return res.status(422).json({
        success: false,
        message: 'Insufficient content for quiz generation. Please provide more detailed content.',
      });
    }

    // Generate quiz using LLM
    const prompt = `Create a multiple-choice quiz based on the following content.

Title: ${title || 'Quiz'}
Topic: ${keyword || 'General'}

Content:
${extractedText}

Generate 5-10 multiple-choice questions with:
- Clear question text
- 4 answer options (A, B, C, D)
- One correct answer
- Brief explanation for the correct answer

Format as JSON array with structure:
[
  {
    "question": "Question text",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": "A",
    "explanation": "Why this is correct"
  }
]`;

    const result = await deps.llmService.generateContent(prompt, {
      temperature: 0.7,
    });

    if (!result.success) {
      deps.logger.llm.logRequestError(
        requestId,
        '/api/quiz/from-document',
        new Error(result.error.message),
        { userId, title, hasSourceDocument: !!sourceDocument }
      );

      return res.status(500).json({
        success: false,
        message: result.error.message || 'Failed to generate quiz',
      });
    }

    // Parse quiz content
    let quizData;
    try {
      const content = result.data.content;
      const jsonMatch =
        content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      quizData = JSON.parse(jsonString);
    } catch (parseError) {
      deps.logger.error(`Failed to parse quiz JSON: ${parseError.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to parse generated quiz content',
      });
    }

    // Generate slug
    const slug = await generateUniqueSlug(title || 'Quiz', Quiz);

    // Create quiz
    const newQuiz = new Quiz({
      userId,
      title: title || 'Quiz',
      keyword: keyword || 'General',
      slug,
      questions: quizData,
      sourceDocument,
    });

    await newQuiz.save();

    const duration = Date.now() - startTime;

    deps.logger.llm.logRequestSuccess(
      requestId,
      '/api/quiz/from-document',
      {
        quizId: newQuiz._id,
        slug,
        questionCount: quizData.length,
        hasSourceDocument: !!sourceDocument,
        provider: result.data.provider,
      },
      duration,
      userId,
      result.data.provider
    );

    res.json({
      success: true,
      message: 'Quiz created successfully from document',
      quizId: newQuiz._id,
      slug,
    });
  } catch (error) {
    deps.logger.llm.logRequestError(requestId, '/api/quiz/from-document', error, {
      userId,
      title,
      hasProcessingId: !!processingId,
      hasText: !!text,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create quiz from document',
    });
  }
});

export default router;
