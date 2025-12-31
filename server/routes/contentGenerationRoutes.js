
import express from 'express';
import { Quiz } from '../models/index.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import llmService from '../services/llmService.js';
import logger from '../utils/logger.js';
import { generateSlug, generateUniqueSlug } from '../utils/slugify.js';

const router = express.Router();

/**
 * AI Content Generation Routes
 * All routes require authentication and interact with LLM services
 * Supports: Quiz generation
 */

// ============================================================================
// QUIZ GENERATION ENDPOINTS
// ============================================================================

/**
 * POST /api/quiz/create - Create AI-generated quiz
 * @auth Required
 * @body {string} userId - User ID
 * @body {string} keyword - Quiz topic/keyword
 * @body {string} title - Quiz title
 * @body {string} format - Quiz format (optional)
 * @body {string} provider - LLM provider (optional)
 * @body {string} model - LLM model (optional)
 * @body {Array} questionAndAnswers - Q&A pairs (optional)
 * @body {boolean} isPublic - Public visibility (optional, defaults to false)
 */
router.post('/quiz/create', requireAuth, async (req, res) => {
    const requestId = logger.llm.generateRequestId();
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

        logger.llm.logRequestStart(
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

        const result = await llmService.generateContent(quizPrompt, {
            provider: provider,
            model: model,
        });

        if (!result.success) {
            logger.llm.logRequestError(
                requestId,
                '/api/quiz/create',
                new Error(result.error || 'Failed to generate quiz content'),
                { userId, keyword, title, provider, model }
            );
            throw new Error(result.error || 'Failed to generate quiz content');
        }

        const quizContent = result.data.content;
        const baseSlug = generateSlug(`${title}-${Date.now()}`);
        const slug = await generateUniqueSlug(baseSlug, Quiz);

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

        logger.llm.logRequestSuccess(
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
        logger.llm.logRequestError(requestId, '/api/quiz/create', error, {
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

export default router;