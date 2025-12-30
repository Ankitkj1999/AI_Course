/**
 * LLM and Content Generation Routes
 * 
 * This module handles all AI-powered content generation routes including:
 * - LLM provider management
 * - Content generation (text, theory, prompts)
 * - Media generation (images, videos, transcripts)
 * - Chat functionality
 */

import express from 'express';
import gis from 'g-i-s';
import youtubesearchapi from 'youtube-search-api';
import { YoutubeTranscript } from 'youtube-transcript';
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const router = express.Router();

// Import services and middleware (will be passed from server.js)
let llmService, logger, requireAuth;

// Initialize function to inject dependencies
export function initializeLlmRoutes(dependencies) {
  llmService = dependencies.llmService;
  logger = dependencies.logger;
  requireAuth = dependencies.requireAuth;
}

// ============================================================================
// LLM PROVIDER MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/llm/providers
 * Get list of available LLM providers with their status
 */
router.get('/llm/providers', async (req, res) => {
  try {
    const providers = llmService.getProviders();
    const status = llmService.getStatus();

    res.status(200).json({
      success: true,
      providers: providers,
      status: status.status,
      summary: {
        total: status.total,
        available: status.available,
        free: status.free,
        paid: status.paid,
      },
    });
  } catch (error) {
    logger.error(`Get providers error: ${error.message}`, {
      error: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get providers',
      error: error.message,
    });
  }
});

/**
 * GET /api/llm/health
 * Health check for all LLM providers
 */
router.get('/llm/health', async (req, res) => {
  try {
    const healthResults = await llmService.checkAllProvidersHealth();

    res.status(200).json({
      success: true,
      health: healthResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`All providers health check error: ${error.message}`, {
      error: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
    });
  }
});

/**
 * GET /api/llm/health/:providerId
 * Health check for specific LLM provider
 */
router.get('/llm/health/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const healthResult = await llmService.checkProviderHealth(providerId);

    res.status(200).json({
      success: true,
      health: healthResult,
    });
  } catch (error) {
    logger.error(`Provider health check error: ${error.message}`, {
      error: error.stack,
      providerId: req.params.providerId,
    });

    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
    });
  }
});

// ============================================================================
// CONTENT GENERATION ROUTES
// ============================================================================

/**
 * POST /api/llm/generate
 * Generate content with multi-LLM support
 */
router.post('/llm/generate', requireAuth, async (req, res) => {
  try {
    const { prompt, provider, model, temperature, preferFree } = req.body;

    // Validate request
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required and must be a non-empty string',
      });
    }

    // Generate content using LLM service
    const result = await llmService.generateContentAuto(prompt, {
      provider,
      model,
      temperature,
      preferFree,
    });

    res.status(200).json(result);
  } catch (error) {
    logger.error(`LLM generation error: ${error.message}`, {
      error: error.stack,
      prompt: req.body.prompt?.substring(0, 100),
      provider: req.body.provider,
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Content generation failed',
        code: 'GENERATION_ERROR',
        details: error.message,
      },
    });
  }
});

/**
 * POST /api/prompt
 * Legacy prompt endpoint with multi-LLM support
 */
router.post('/prompt', requireAuth, async (req, res) => {
  const receivedData = req.body;
  const promptString = receivedData.prompt;
  const { provider, model, temperature } = receivedData;

  try {
    // If provider is specified, use new LLM service
    if (provider) {
      const result = await llmService.generateContent(promptString, {
        provider,
        model,
        temperature,
      });

      if (result.success) {
        // Maintain backward compatibility with existing response format
        res.status(200).json({
          generatedText: result.data.content,
          // Add metadata for enhanced clients
          metadata: {
            provider: result.data.provider,
            providerName: result.data.providerName,
            model: result.data.model,
            responseTime: result.data.responseTime,
            timestamp: result.timestamp,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.error.message || 'Content generation failed',
        });
      }
      return;
    }

    // Fallback to LangChain Gemini for backward compatibility
    const result = await llmService.generateContent(promptString, {
      provider: 'gemini',
      temperature: 0.7,
    });

    if (result.success) {
      res.status(200).json({
        generatedText: result.data.content,
        // Add metadata to indicate this used fallback path
        metadata: {
          provider: result.data.provider,
          providerName: result.data.providerName + ' (Fallback)',
          model: result.data.model,
          responseTime: result.data.responseTime,
          legacy: true,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error.message || 'Content generation failed',
      });
    }
  } catch (error) {
    logger.error(`Prompt generation error: ${error.message}`, {
      error: error.stack,
      prompt: promptString?.substring(0, 100),
      provider,
    });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/generate
 * Generate theory/content with multi-LLM support and direct section save
 */
router.post('/generate', requireAuth, async (req, res) => {
  const receivedData = req.body;
  const promptString = receivedData.prompt;
  const { provider, model, temperature, sectionId, metadata } = receivedData;

  // Generate request ID for logging correlation
  const requestId = logger.llm.generateRequestId();
  const startTime = Date.now();

  // Log request start
  logger.llm.logRequestStart(
    requestId,
    '/api/generate',
    {
      prompt: promptString?.substring(0, 100) + '...',
      provider,
      model,
      temperature,
      sectionId: sectionId || 'none',
    },
    req.user?.id,
    provider
  );

  try {
    // If provider is specified, use new LLM service
    if (provider) {
      const result = await llmService.generateContent(promptString, {
        provider,
        model,
        temperature,
      });

      if (result.success) {
        const duration = Date.now() - startTime;

        // Log successful request
        logger.llm.logRequestSuccess(
          requestId,
          '/api/generate',
          {
            contentLength: result.data.content?.length,
            provider: result.data.provider,
            model: result.data.model,
            sectionId: sectionId || 'none',
          },
          duration,
          req.user?.id,
          result.data.provider
        );

        // If sectionId is provided, save content directly to section
        if (sectionId) {
          try {
            const { default: SectionService } = await import('../services/sectionService.js');
            const { default: ContentConverter } = await import('../services/contentConverter.js');
            
            // Verify section exists and user has access
            const section = await SectionService.getSection(sectionId);
            if (!section) {
              return res.status(404).json({ 
                success: false, 
                message: 'Section not found' 
              });
            }
            
            // Verify user owns the course
            const Course = (await import('../models/Course.js')).default;
            const course = await Course.findById(section.courseId);
            if (!course || course.user !== req.user._id.toString()) {
              return res.status(403).json({ 
                success: false, 
                message: 'Access denied' 
              });
            }
            
            // Convert content to multi-format
            const convertedContent = await ContentConverter.convertToMultiFormat(
              result.data.content, 
              'markdown'
            );
            
            // Prepare update data with content
            const updateData = {
              content: convertedContent,
              userId: req.user._id.toString()
            };
            
            // If metadata is provided, merge it with existing metadata
            if (metadata) {
              updateData.content.metadata = {
                ...convertedContent.metadata,
                ...metadata
              };
            }
            
            // Update section with generated content and metadata
            const updatedSection = await SectionService.updateSection(sectionId, updateData);
            
            console.log('✅ Content generated and saved to section:', {
              sectionId: updatedSection._id,
              title: updatedSection.title,
              wordCount: updatedSection.wordCount,
              hasContent: updatedSection.hasContent
            });
            
            // Return enhanced response with section data
            return res.status(200).json({
              success: true,
              text: result.data.content,
              contentType: 'html',
              section: {
                id: updatedSection._id,
                title: updatedSection.title,
                wordCount: updatedSection.wordCount,
                hasContent: updatedSection.hasContent,
                readTime: updatedSection.readTime
              },
              metadata: {
                provider: result.data.provider,
                providerName: result.data.providerName,
                model: result.data.model,
                responseTime: result.data.responseTime,
                timestamp: result.timestamp,
                savedToSection: true
              },
            });
          } catch (saveError) {
            console.error('❌ Error saving content to section:', saveError);
            // Still return the generated content even if save fails
            return res.status(200).json({
              success: true,
              text: result.data.content,
              contentType: 'html',
              metadata: {
                provider: result.data.provider,
                providerName: result.data.providerName,
                model: result.data.model,
                responseTime: result.data.responseTime,
                timestamp: result.timestamp,
                savedToSection: false,
                saveError: saveError.message
              },
            });
          }
        }

        // Maintain backward compatibility with existing response format (no sectionId)
        res.status(200).json({
          text: result.data.content,
          contentType: 'html',
          // Add metadata for enhanced clients
          metadata: {
            provider: result.data.provider,
            providerName: result.data.providerName,
            model: result.data.model,
            responseTime: result.data.responseTime,
            timestamp: result.timestamp,
          },
        });
      } else {
        // Log error with context
        logger.llm.logRequestError(
          requestId,
          '/api/generate',
          new Error(result.error.message || 'Content generation failed'),
          {
            userId: req.user?.id,
            provider,
            model,
            prompt: promptString?.substring(0, 100),
          }
        );

        res.status(500).json({
          success: false,
          message: result.error.message || 'Content generation failed',
        });
      }
      return;
    }

    // Fallback to original Gemini implementation for backward compatibility
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    // Use LangChain Gemini for backward compatibility
    const result = await llmService.generateContent(promptString, {
      provider: 'gemini',
      temperature: 0.7,
    });

    if (result.success) {
      const duration = Date.now() - startTime;

      // Log fallback usage
      logger.llm.logProviderFallback(
        requestId,
        '/api/generate',
        provider || 'none',
        'gemini',
        'Legacy fallback path'
      );

      // Log successful request
      logger.llm.logRequestSuccess(
        requestId,
        '/api/generate',
        {
          contentLength: result.data.content?.length,
          provider: result.data.provider,
          model: result.data.model,
          legacy: true,
        },
        duration,
        req.user?.id,
        result.data.provider
      );

      res.status(200).json({
        text: result.data.content,
        contentType: 'html',
        // Add metadata to indicate this used fallback path
        metadata: {
          provider: result.data.provider,
          providerName: result.data.providerName + ' (Fallback)',
          model: result.data.model,
          responseTime: result.data.responseTime,
          legacy: true,
        },
      });
    } else {
      // Log error with context
      logger.llm.logRequestError(
        requestId,
        '/api/generate',
        new Error(result.error.message || 'Content generation failed'),
        {
          userId: req.user?.id,
          provider: 'gemini',
          prompt: promptString?.substring(0, 100),
          legacy: true,
        }
      );

      res.status(500).json({
        success: false,
        message: result.error.message || 'Content generation failed',
      });
    }
  } catch (error) {
    // Log error with enhanced context
    logger.llm.logRequestError(requestId, '/api/generate', error, {
      userId: req.user?.id,
      provider,
      model,
      temperature,
      prompt: promptString?.substring(0, 100),
      duration: Date.now() - startTime,
    });

    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================================
// MEDIA GENERATION ROUTES
// ============================================================================

/**
 * POST /api/image
 * Search for images using Google Image Search
 */
router.post('/image', async (req, res) => {
  const receivedData = req.body;
  const promptString = receivedData.prompt;
  
  gis(promptString, logResults);
  
  function logResults(error, results) {
    if (error) {
      logger.error('Image search error', {
        error: error.message,
        prompt: promptString?.substring(0, 100),
      });
      res.status(500).json({ success: false, message: 'Image search failed' });
    } else {
      res.status(200).json({ url: results[0].url });
    }
  }
});

/**
 * POST /api/yt
 * Search for YouTube videos
 */
router.post('/yt', async (req, res) => {
  try {
    const receivedData = req.body;
    const promptString = receivedData.prompt;
    const video = await youtubesearchapi.GetListByKeyword(
      promptString,
      [false],
      [1],
      [{ type: 'video' }]
    );
    const videoId = await video.items[0].id;
    res.status(200).json({ url: videoId });
  } catch (error) {
    console.log('Error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/transcript
 * Get YouTube video transcript
 */
router.post('/transcript', async (req, res) => {
  const receivedData = req.body;
  const promptString = receivedData.prompt;
  
  YoutubeTranscript.fetchTranscript(promptString)
    .then((video) => {
      res.status(200).json({ url: video });
    })
    .catch((error) => {
      console.log('Error', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    });
});

// ============================================================================
// CHAT ROUTES
// ============================================================================

/**
 * POST /api/chat
 * Chat endpoint with multi-LLM support
 */
router.post('/chat', requireAuth, async (req, res) => {
  const receivedData = req.body;
  const promptString = receivedData.prompt;
  const { provider, model, temperature } = receivedData;

  try {
    // Use new LLM service with provider support
    const result = await llmService.generateContent(promptString, {
      provider,
      model,
      temperature: temperature || 0.7,
    });

    if (result.success) {
      // Maintain backward compatibility with existing response format
      res.status(200).json({
        text: result.data.content,
        contentType: 'html',
        // Add metadata for enhanced clients
        metadata: {
          provider: result.data.provider,
          providerName: result.data.providerName,
          model: result.data.model,
          responseTime: result.data.responseTime,
          timestamp: result.timestamp,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error.message || 'Chat generation failed',
      });
    }
  } catch (error) {
    logger.error(`Chat generation error: ${error.message}`, {
      error: error.stack,
      prompt: promptString?.substring(0, 100),
      provider,
    });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
