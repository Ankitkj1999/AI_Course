import llmFactory from './llmFactory.js';
import llmConfig from '../utils/llmConfig.js';

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
    try {
      await this.factory.initializeProviders();
      console.log('LLM Service providers initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LLM providers:', error.message);
    }
  }

  /**
   * Generate content using the specified provider
   */
  async generateContent(prompt, options = {}) {
    const startTime = Date.now();

    // Determine which provider to use (declare outside try block)
    const providerId = options.provider || this.factory.getDefaultProvider();

    if (!providerId) {
      throw new Error('No LLM providers are available');
    }

    // Wait for providers to be initialized if needed
    if (this.factory.providers.size === 0) {
      console.log('Waiting for provider initialization...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }

    // Validate provider
    const validation = this.factory.validateProvider(providerId);
    if (!validation.valid) {
      throw new Error(`Provider validation failed: ${validation.error}`);
    }

    try {

      // Get LLM instance (now async)
      const llm = await this.factory.getLLM(providerId, {
        model: options.model,
        temperature: options.temperature
      });

      // Generate content
      const response = await llm.invoke(prompt);
      const responseTime = Date.now() - startTime;

      // Get provider info
      const providers = this.factory.getAvailableProviders();
      const providerInfo = providers.find(p => p.id === providerId);

      return this.factory.createUnifiedResponse(true, {
        content: response.content,
        provider: providerId,
        providerName: providerInfo?.name || providerId,
        model: options.model || providerInfo?.models?.[0] || 'default',
        responseTime,
        promptLength: prompt.length,
        responseLength: response.content.length,
        temperature: options.temperature || 0.7
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error(`LLM Generation Error for provider ${providerId}:`, error.message);
      console.error('Error details:', {
        provider: providerId,
        model: options.model,
        temperature: options.temperature,
        errorType: error.constructor.name
      });
      
      // Try fallback if enabled and not already using fallback
      if (this.config.isFallbackEnabled() && options.provider && !options.isFallback) {
        console.log(`Provider ${options.provider} failed, attempting fallback...`);
        
        try {
          const fallbackProvider = this.factory.getDefaultProvider();
          if (fallbackProvider && fallbackProvider !== options.provider) {
            console.log(`Using fallback provider: ${fallbackProvider}`);
            return await this.generateContent(prompt, {
              provider: fallbackProvider,
              model: undefined, // Use default model for fallback provider
              temperature: options.temperature,
              isFallback: true
            });
          } else {
            console.log('No suitable fallback provider available');
          }
        } catch (fallbackError) {
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
    return await this.factory.healthCheck(providerId);
  }

  /**
   * Check health of all providers
   */
  async checkAllProvidersHealth() {
    return await this.factory.healthCheckAll();
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
    return this.factory.getProviderByPriority(preferFree);
  }

  /**
   * Refresh all providers (useful for runtime configuration updates)
   */
  refreshProviders() {
    return this.factory.refreshProviders();
  }

  /**
   * Generate content with automatic provider selection
   */
  async generateContentAuto(prompt, options = {}) {
    // If no provider specified, use recommended provider
    if (!options.provider) {
      options.provider = this.getRecommendedProvider(options.preferFree !== false);
    }

    return await this.generateContent(prompt, options);
  }
}

// Create singleton instance
const llmService = new LLMService();

export default llmService;