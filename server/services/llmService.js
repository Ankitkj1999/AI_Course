import llmFactory from './llmFactory.js';
import llmConfig from '../utils/llmConfig.js';
import logger from '../utils/logger.js';

/**
 * LLM Service for handling content generation requests
 */
class LLMService {
  constructor() {
    this.factory = llmFactory;
    this.config = llmConfig;

    // Validate configuration on startup
    try {
      this.config.validate();
    } catch (error) {
      console.error('LLM Configuration Error:', error.message);
    }

    // Ensure providers are initialized asynchronously
    this.initializeProviders();
  }

  /**
   * Initialize providers asynchronously
   */
  async initializeProviders() {
    const startTime = Date.now();
    const requestId = logger.llm.generateRequestId();
    
    try {
      logger.llm.logLLMOperation('info', 'LLM Service initialization started', {
        requestId,
        tags: ['SERVICE_INIT', 'PROVIDER_INITIALIZATION']
      });

      await this.factory.initializeProviders();
      const duration = Date.now() - startTime;
      const stats = this.factory.getProviderStats();

      logger.llm.logLLMOperation('info', 'LLM Service providers initialized successfully', {
        requestId,
        tags: ['SERVICE_INIT', 'PROVIDER_INITIALIZATION', 'SUCCESS'],
        duration,
        providersAvailable: stats.available,
        providersTotal: stats.total,
        freeProviders: stats.free,
        paidProviders: stats.paid
      });

      console.log('LLM Service providers initialized successfully');
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.llm.logLLMOperation('error', 'Failed to initialize LLM providers', {
        requestId,
        tags: ['SERVICE_INIT', 'PROVIDER_INITIALIZATION', 'ERROR'],
        duration,
        error
      });

      console.error('Failed to initialize LLM providers:', error.message);
    }
  }

  /**
   * Generate content using the specified provider
   */
  async generateContent(prompt, options = {}) {
    const startTime = Date.now();
    const requestId = logger.llm.generateRequestId();
    const endpoint = options.endpoint || '/api/generate';

    // Determine which provider to use (declare outside try block)
    const providerId = options.provider || this.factory.getDefaultProvider();

    // Log provider selection
    logger.llm.logLLMOperation('info', 'Provider selection for content generation', {
      requestId,
      endpoint,
      tags: ['PROVIDER_SELECTION'],
      requestedProvider: options.provider,
      selectedProvider: providerId,
      isDefaultProvider: !options.provider,
      userId: options.userId,
      promptLength: prompt.length
    });

    if (!providerId) {
      const error = new Error('No LLM providers are available');
      logger.llm.logRequestError(requestId, endpoint, error, {
        userId: options.userId,
        tags: ['NO_PROVIDERS_AVAILABLE']
      });
      throw error;
    }

    // Wait for providers to be initialized if needed
    if (this.factory.providers.size === 0) {
      logger.llm.logLLMOperation('warn', 'Waiting for provider initialization', {
        requestId,
        endpoint,
        tags: ['PROVIDER_INITIALIZATION_WAIT'],
        userId: options.userId
      });
      console.log('Waiting for provider initialization...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }

    // Validate provider
    const validation = this.factory.validateProvider(providerId);
    if (!validation.valid) {
      const error = new Error(`Provider validation failed: ${validation.error}`);
      logger.llm.logValidationFailure(requestId, endpoint, validation, {
        providerId,
        userId: options.userId
      });
      throw error;
    }

    try {
      // Log request start
      logger.llm.logRequestStart(requestId, endpoint, {
        provider: providerId,
        model: options.model,
        temperature: options.temperature,
        promptLength: prompt.length,
        isFallback: options.isFallback || false
      }, options.userId, providerId);

      // Get LLM instance (now async)
      const llmStartTime = Date.now();
      const llm = await this.factory.getLLM(providerId, {
        model: options.model,
        temperature: options.temperature
      });
      const llmInstanceTime = Date.now() - llmStartTime;

      // Log LLM instance creation timing
      logger.llm.logPerformance(requestId, endpoint, {
        llmInstanceCreationTime: llmInstanceTime,
        provider: providerId,
        model: options.model
      });

      // Generate content
      const generationStartTime = Date.now();
      const response = await llm.invoke(prompt);
      const generationTime = Date.now() - generationStartTime;
      const responseTime = Date.now() - startTime;

      // Validate response structure
      if (!response || typeof response.content !== 'string') {
        logger.llm.logValidationFailure(requestId, endpoint, {
          expected: 'response with content string',
          received: typeof response
        }, response);
        throw new Error('Invalid response structure from LLM provider');
      }

      // Get provider info
      const providers = this.factory.getAvailableProviders();
      const providerInfo = providers.find(p => p.id === providerId);

      const result = this.factory.createUnifiedResponse(true, {
        content: response.content,
        provider: providerId,
        providerName: providerInfo?.name || providerId,
        model: options.model || providerInfo?.models?.[0] || 'default',
        responseTime,
        promptLength: prompt.length,
        responseLength: response.content.length,
        temperature: options.temperature || 0.7
      });

      // Log successful completion with performance metrics
      logger.llm.logRequestSuccess(requestId, endpoint, {
        contentLength: response.content.length,
        provider: providerId,
        model: options.model || providerInfo?.models?.[0] || 'default'
      }, responseTime, options.userId, providerId);

      logger.llm.logPerformance(requestId, endpoint, {
        totalResponseTime: responseTime,
        llmGenerationTime: generationTime,
        llmInstanceTime: llmInstanceTime,
        provider: providerId,
        model: options.model,
        promptTokens: prompt.length,
        responseTokens: response.content.length,
        isFallback: options.isFallback || false
      });

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Log the error with full context
      logger.llm.logRequestError(requestId, endpoint, error, {
        provider: providerId,
        model: options.model,
        temperature: options.temperature,
        promptLength: prompt.length,
        responseTime,
        isFallback: options.isFallback || false,
        userId: options.userId
      });
      
      console.error(`LLM Generation Error for provider ${providerId}:`, error.message);
      console.error('Error details:', {
        provider: providerId,
        model: options.model,
        temperature: options.temperature,
        errorType: error.constructor.name
      });
      
      // Try fallback if enabled and not already using fallback
      if (this.config.isFallbackEnabled() && options.provider && !options.isFallback) {
        const fallbackProvider = this.factory.getDefaultProvider();
        
        logger.llm.logProviderFallback(requestId, endpoint, options.provider, fallbackProvider, error.message);
        console.log(`Provider ${options.provider} failed, attempting fallback...`);
        
        try {
          if (fallbackProvider && fallbackProvider !== options.provider) {
            logger.llm.logLLMOperation('info', 'Executing fallback provider', {
              requestId,
              endpoint,
              tags: ['FALLBACK_EXECUTION'],
              originalProvider: options.provider,
              fallbackProvider,
              userId: options.userId
            });

            console.log(`Using fallback provider: ${fallbackProvider}`);
            return await this.generateContent(prompt, {
              provider: fallbackProvider,
              model: undefined, // Use default model for fallback provider
              temperature: options.temperature,
              isFallback: true,
              userId: options.userId,
              endpoint
            });
          } else {
            logger.llm.logLLMOperation('warn', 'No suitable fallback provider available', {
              requestId,
              endpoint,
              tags: ['FALLBACK_UNAVAILABLE'],
              originalProvider: options.provider,
              availableProviders: this.factory.getAvailableProviders().map(p => p.id),
              userId: options.userId
            });
            console.log('No suitable fallback provider available');
          }
        } catch (fallbackError) {
          logger.llm.logRequestError(requestId, endpoint, fallbackError, {
            provider: fallbackProvider,
            isFallback: true,
            originalError: error.message,
            userId: options.userId,
            tags: ['FALLBACK_FAILED']
          });
          console.error('Fallback also failed:', fallbackError.message);
        }
      }

      return this.factory.createUnifiedResponse(false, {
        error: error.message,
        provider: options.provider || 'unknown',
        responseTime,
        errorCode: 'GENERATION_FAILED',
        errorDetails: {
          promptLength: prompt.length,
          isFallback: options.isFallback || false
        }
      });
    }
  }

  /**
   * Get available providers
   */
  getProviders() {
    return this.factory.getAvailableProviders();
  }

  /**
   * Check provider health using factory's health check
   */
  async checkProviderHealth(providerId) {
    const requestId = logger.llm.generateRequestId();
    const startTime = Date.now();

    logger.llm.logLLMOperation('info', 'Provider health check started', {
      requestId,
      tags: ['HEALTH_CHECK'],
      provider: providerId
    });

    try {
      const result = await this.factory.healthCheck(providerId);
      const duration = Date.now() - startTime;

      logger.llm.logLLMOperation(result.healthy ? 'info' : 'warn', 'Provider health check completed', {
        requestId,
        tags: ['HEALTH_CHECK', result.healthy ? 'HEALTHY' : 'UNHEALTHY'],
        provider: providerId,
        duration,
        healthy: result.healthy,
        responseTime: result.responseTime,
        error: result.error
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.llm.logLLMOperation('error', 'Provider health check failed', {
        requestId,
        tags: ['HEALTH_CHECK', 'ERROR'],
        provider: providerId,
        duration,
        error
      });

      throw error;
    }
  }

  /**
   * Check health of all providers
   */
  async checkAllProvidersHealth() {
    const requestId = logger.llm.generateRequestId();
    const startTime = Date.now();

    logger.llm.logLLMOperation('info', 'All providers health check started', {
      requestId,
      tags: ['HEALTH_CHECK_ALL']
    });

    try {
      const results = await this.factory.healthCheckAll();
      const duration = Date.now() - startTime;
      const healthyCount = results.filter(r => r.data.healthy).length;

      logger.llm.logLLMOperation('info', 'All providers health check completed', {
        requestId,
        tags: ['HEALTH_CHECK_ALL'],
        duration,
        totalProviders: results.length,
        healthyProviders: healthyCount,
        unhealthyProviders: results.length - healthyCount,
        results: results.map(r => ({
          provider: r.providerId,
          healthy: r.data.healthy,
          error: r.data.error
        }))
      });

      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.llm.logLLMOperation('error', 'All providers health check failed', {
        requestId,
        tags: ['HEALTH_CHECK_ALL', 'ERROR'],
        duration,
        error
      });

      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    const providers = this.getProviders();
    const stats = this.factory.getProviderStats();
    
    return {
      status: stats.available > 0 ? 'healthy' : 'unhealthy',
      ...stats,
      providers: providers.map(p => ({
        id: p.id,
        name: p.name,
        available: p.isAvailable,
        isFree: p.isFree,
        models: p.models,
        error: p.error
      })),
      config: this.config.getSummary()
    };
  }

  /**
   * Get recommended provider based on preferences
   */
  getRecommendedProvider(preferFree = true) {
    const requestId = logger.llm.generateRequestId();
    const recommendedProvider = this.factory.getProviderByPriority(preferFree);
    const availableProviders = this.factory.getAvailableProviders();

    logger.llm.logLLMOperation('info', 'Provider recommendation requested', {
      requestId,
      tags: ['PROVIDER_RECOMMENDATION'],
      preferFree,
      recommendedProvider,
      availableProviders: availableProviders.map(p => ({
        id: p.id,
        name: p.name,
        isFree: p.isFree,
        isAvailable: p.isAvailable
      }))
    });

    return recommendedProvider;
  }

  /**
   * Refresh all providers (useful for runtime configuration updates)
   */
  async refreshProviders() {
    const requestId = logger.llm.generateRequestId();
    const startTime = Date.now();

    logger.llm.logLLMOperation('info', 'Provider refresh started', {
      requestId,
      tags: ['PROVIDER_REFRESH']
    });

    try {
      const result = await this.factory.refreshProviders();
      const duration = Date.now() - startTime;

      logger.llm.logLLMOperation('info', 'Provider refresh completed', {
        requestId,
        tags: ['PROVIDER_REFRESH', 'SUCCESS'],
        duration,
        providersAvailable: result.available,
        providersTotal: result.total,
        freeProviders: result.free,
        paidProviders: result.paid
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.llm.logLLMOperation('error', 'Provider refresh failed', {
        requestId,
        tags: ['PROVIDER_REFRESH', 'ERROR'],
        duration,
        error
      });

      throw error;
    }
  }

  /**
   * Generate content with automatic provider selection
   */
  async generateContentAuto(prompt, options = {}) {
    const requestId = logger.llm.generateRequestId();
    
    // If no provider specified, use recommended provider
    if (!options.provider) {
      const recommendedProvider = this.getRecommendedProvider(options.preferFree !== false);
      options.provider = recommendedProvider;

      logger.llm.logLLMOperation('info', 'Automatic provider selection for content generation', {
        requestId,
        tags: ['AUTO_PROVIDER_SELECTION'],
        preferFree: options.preferFree !== false,
        selectedProvider: recommendedProvider,
        userId: options.userId
      });
    }

    // Pass the requestId and endpoint info to generateContent
    options.endpoint = options.endpoint || '/api/generate-auto';
    return await this.generateContent(prompt, options);
  }
}

// Create singleton instance
const llmService = new LLMService();

export default llmService;