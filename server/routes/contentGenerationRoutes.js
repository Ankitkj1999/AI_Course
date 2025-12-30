
import express from 'express';
import { Quiz, Flashcard } from '../models/index.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import llmService from '../services/llmService.js';
import logger from '../utils/logger.js';
import { generateSlug, generateUniqueSlug } from '../utils/slugify.js';

const router = express.Router();

/**
 * AI Content Generation Routes
 * All routes require authentication and interact with LLM services
 * Supports: Quiz, Flashcard generation
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

/**
 * POST /api/quiz/from-document - Generate quiz from document
 * @auth Required
 * @body {string} processingId - Document processing ID (optional)
 * @body {string} text - Direct text content (optional)
 * @body {string} title - Quiz title
 * @body {string} keyword - Quiz keyword
 */
router.post('/quiz/from-document', requireAuth, async (req, res) => {
    const { processingId, text, title, keyword } = req.body;
    const userId = req.user._id.toString();

    const requestId = logger.llm.generateRequestId();
    const startTime = Date.now();

    logger.llm.logRequestStart(
        requestId,
        '/api/quiz/from-document',
        { hasProcessingId: !!processingId, hasDirectText: !!text, title, keyword },
        userId,
        'document-generation'
    );

    try {
        let extractedText = text;
        let sourceDocument = null;

        // Retrieve extracted text from document processing if processingId provided
        if (processingId && !text) {
            const { default: DocumentProcessing } = await import('../models/DocumentProcessing.js');
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

        const result = await llmService.generateContent(prompt, { temperature: 0.7 });

        if (!result.success) {
            logger.llm.logRequestError(
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
            logger.error(`Failed to parse quiz JSON: ${parseError.message}`);
            return res.status(500).json({
                success: false,
                message: 'Failed to parse generated quiz content',
            });
        }

        const slug = await generateUniqueSlug(title || 'Quiz', Quiz);

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

        logger.llm.logRequestSuccess(
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
        logger.llm.logRequestError(requestId, '/api/quiz/from-document', error, {
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

// ============================================================================
// FLASHCARD GENERATION ENDPOINTS
// ============================================================================

/**
 * POST /api/flashcard/create - Create AI-generated flashcards
 * @auth Required
 * @body {string} userId - User ID
 * @body {string} keyword - Flashcard topic/keyword
 * @body {string} title - Flashcard set title
 * @body {string} provider - LLM provider (optional)
 * @body {string} model - LLM model (optional)
 * @body {boolean} isPublic - Public visibility (optional, defaults to false)
 */
router.post('/flashcard/create', requireAuth, async (req, res) => {
    const requestId = logger.llm.generateRequestId();
    const startTime = Date.now();

    try {
        const { userId, keyword, title, provider, model, isPublic } = req.body;

        logger.llm.logRequestStart(
            requestId,
            '/api/flashcard/create',
            { keyword, title, provider, model },
            userId,
            provider
        );

        if (!userId || !keyword || !title) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, keyword, title',
            });
        }

        const prompt = `Create a comprehensive set of flashcards for the topic: "${keyword}". 
        
        Generate 15-20 flashcards that cover the key concepts, definitions, and important facts about this topic.
        
        Format your response as a JSON array where each flashcard has:
        - "front": The question or term (keep it concise)
        - "back": The answer or definition (detailed but clear)
        - "difficulty": "easy", "medium", or "hard"
        - "tags": Array of relevant tags for categorization
        
        Make sure the flashcards are educational, accurate, and cover different aspects of the topic.
        
        Example format:
        [
          {
            "front": "What is photosynthesis?",
            "back": "The process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen.",
            "difficulty": "medium",
            "tags": ["biology", "plants", "energy"]
          }
        ]
        
        Return only the JSON array, no additional text.`;

        const result = await llmService.generateContent(prompt, {
            provider: provider,
            model: model,
        });

        if (!result.success) {
            logger.llm.logRequestError(
                requestId,
                '/api/flashcard/create',
                new Error(result.error || 'Failed to generate flashcard content'),
                { userId, keyword, title, provider, model }
            );
            throw new Error(result.error || 'Failed to generate flashcard content');
        }

        const generatedText = result.data.content;

        let cards = [];
        try {
            const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                cards = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No valid JSON found in response');
            }
        } catch (parseError) {
            logger.llm.logRequestError(
                requestId,
                '/api/flashcard/create',
                parseError,
                {
                    userId,
                    keyword,
                    title,
                    provider,
                    model,
                    step: 'json_parsing',
                    generatedText: generatedText?.substring(0, 200),
                }
            );
            return res.status(500).json({
                success: false,
                message: 'Failed to parse generated flashcards',
            });
        }

        const slug = await generateUniqueSlug(title, Flashcard);

        const newFlashcard = new Flashcard({
            userId,
            keyword,
            title,
            slug,
            content: generatedText,
            cards,
            tokens: {
                prompt: prompt.length,
                completion: generatedText.length,
                total: prompt.length + generatedText.length,
            },
            isPublic: isPublic ?? false,
        });

        await newFlashcard.save();

        const duration = Date.now() - startTime;

        logger.llm.logRequestSuccess(
            requestId,
            '/api/flashcard/create',
            {
                flashcardId: newFlashcard._id,
                slug,
                keyword,
                title,
                cardsCount: cards.length,
                contentLength: generatedText?.length,
                provider: result.data.provider,
            },
            duration,
            userId,
            result.data.provider
        );

        res.json({
            success: true,
            message: 'Flashcard set created successfully',
            flashcardId: newFlashcard._id,
            slug: slug,
            cards: cards,
            isPublic: newFlashcard.isPublic,
        });
    } catch (error) {
        logger.llm.logRequestError(requestId, '/api/flashcard/create', error, {
            userId: req.body.userId,
            keyword: req.body.keyword,
            title: req.body.title,
            provider: req.body.provider,
            model: req.body.model,
            duration: Date.now() - startTime,
        });

        res.status(500).json({
            success: false,
            message: 'Failed to create flashcard set',
        });
    }
});

/**
 * POST /api/flashcard/from-document - Generate flashcards from document
 * @auth Required
 * @body {string} processingId - Document processing ID (optional)
 * @body {string} text - Direct text content (optional)
 * @body {string} title - Flashcard set title
 * @body {string} keyword - Flashcard keyword
 */
router.post('/flashcard/from-document', requireAuth, async (req, res) => {
    const { processingId, text, title, keyword } = req.body;
    const userId = req.user._id.toString();

    const requestId = logger.llm.generateRequestId();
    const startTime = Date.now();

    logger.llm.logRequestStart(
        requestId,
        '/api/flashcard/from-document',
        { hasProcessingId: !!processingId, hasDirectText: !!text, title, keyword },
        userId,
        'document-generation'
    );

    try {
        let extractedText = text;
        let sourceDocument = null;

        if (processingId && !text) {
            const { default: DocumentProcessing } = await import('../models/DocumentProcessing.js');
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

        const prompt = `Create educational flashcards based on the following content.

Title: ${title || 'Flashcards'}
Topic: ${keyword || 'General'}

Content:
${extractedText}

Generate 10-15 flashcard pairs with:
- Front: A clear question or term
- Back: A concise answer or definition

Focus on key concepts, important terms, and essential information.

Format as JSON array with structure:
[
  {
    "front": "Question or term",
    "back": "Answer or definition"
  }
]`;

        const result = await llmService.generateContent(prompt, { temperature: 0.7 });

        if (!result.success) {
            logger.llm.logRequestError(
                requestId,
                '/api/flashcard/from-document',
                new Error(result.error.message),
                { userId, title, hasSourceDocument: !!sourceDocument }
            );

            return res.status(500).json({
                success: false,
                message: result.error.message || 'Failed to generate flashcards',
            });
        }

        let flashcardData;
        try {
            const content = result.data.content;
            const jsonMatch =
                content.match(/```json\s*([\s\S]*?)\s*```/) ||
                content.match(/\[[\s\S]*\]/);
            const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
            flashcardData = JSON.parse(jsonString);
        } catch (parseError) {
            logger.error(`Failed to parse flashcard JSON: ${parseError.message}`);
            return res.status(500).json({
                success: false,
                message: 'Failed to parse generated flashcard content',
            });
        }

        const slug = await generateUniqueSlug(title || 'Flashcards', Flashcard);

        const newFlashcard = new Flashcard({
            userId,
            title: title || 'Flashcards',
            keyword: keyword || 'General',
            slug,
            cards: flashcardData,
            sourceDocument,
        });

        await newFlashcard.save();

        const duration = Date.now() - startTime;

        logger.llm.logRequestSuccess(
            requestId,
            '/api/flashcard/from-document',
            {
                flashcardId: newFlashcard._id,
                slug,
                cardCount: flashcardData.length,
                hasSourceDocument: !!sourceDocument,
                provider: result.data.provider,
            },
            duration,
            userId,
            result.data.provider
        );

        res.json({
            success: true,
            message: 'Flashcards created successfully from document',
            flashcardId: newFlashcard._id,
            slug,
        });
    } catch (error) {
        logger.llm.logRequestError(
            requestId,
            '/api/flashcard/from-document',
            error,
            {
                userId,
                title,
                hasProcessingId: !!processingId,
                hasText: !!text,
            }
        );

        res.status(500).json({
            success: false,
            message: 'Failed to create flashcards from document',
        });
    }
});








export default router;