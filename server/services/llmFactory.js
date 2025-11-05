import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

/**
 * Provider configurations for different LLM services
 */
const PROVIDER_CONFIGS = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    isFree: false,
    defaultModel: 'gemini-2.0-flash-exp',
    envKeyName: 'GOOGLE_API_KEY',
    availableModels: ['gemini-2.0-flash-exp', 'gemini-pro', 'gemini-1.5-flash']
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter (Multi-Model)',
    isFree: false,
    defaultModel: null, // Will be set dynamically
    envKeyName: 'OPENROUTER_API_KEY',
    availableModels: [], // Will be populated dynamically
    dynamicModels: true
  }
};

/**
 * LangChain Factory for creating LLM instances
 */
class LangChainFactory {
  constructor() {
    this.providers = new Map();
    this.modelCache = new Map(); // Cache for OpenRouter models
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes cache
    this.initializeProviders();
  }

  /**
   * Initialize available providers based on environment variables
   */
  async initializeProviders() {
    console.log('Initializing LLM providers...');

    for (const [providerId, config] of Object.entries(PROVIDER_CONFIGS)) {
      const apiKey = process.env[config.envKeyName];

      if (apiKey) {
        try {
          // Handle dynamic models for OpenRouter
          if (config.dynamicModels) {
            await this.initializeDynamicProvider(providerId, config, apiKey);
          } else {
            const provider = this.createProvider(providerId, config, apiKey);
            this.providers.set(providerId, {
              config,
              instance: provider,
              isAvailable: true
            });
            console.log(`✓ ${config.name} provider initialized`);
          }
        } catch (error) {
          console.error(`✗ Failed to initialize ${config.name}:`, error.message);
          this.providers.set(providerId, {
            config,
            instance: null,
            isAvailable: false,
            error: error.message
          });
        }
      } else {
        console.log(`- ${config.name} provider skipped (no API key)`);
        this.providers.set(providerId, {
          config,
          instance: null,
          isAvailable: false,
          error: 'API key not provided'
        });
      }
    }
  }

  /**
   * Initialize dynamic provider (OpenRouter)
   */
  async initializeDynamicProvider(providerId, config, apiKey) {
    try {
      const models = await this.fetchOpenRouterModels(apiKey);

      if (models.length === 0) {
        throw new Error('No models available from OpenRouter');
      }

      // Update config with dynamic models
      const updatedConfig = {
        ...config,
        availableModels: models.map(m => m.id),
        defaultModel: models[0].id // Use first available model as default
      };

      const provider = this.createProvider(providerId, updatedConfig, apiKey);
      this.providers.set(providerId, {
        config: updatedConfig,
        instance: provider,
        isAvailable: true
      });

      console.log(`✓ ${config.name} provider initialized with ${models.length} models`);
    } catch (error) {
      console.error(`✗ Failed to initialize ${config.name}:`, error.message);
      this.providers.set(providerId, {
        config,
        instance: null,
        isAvailable: false,
        error: error.message
      });
    }
  }

  /**
   * Fetch available models from OpenRouter API
   */
  async fetchOpenRouterModels(apiKey, preferFree = true) {
    const cacheKey = `openrouter_models_${preferFree}`;
    const cached = this.modelCache.get(cacheKey);

    // Check if cache is still valid
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.models;
    }

    try {
      const response = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      const allModels = response.data.data || [];

      // Filter models based on pricing preference
      let filteredModels = allModels;

      if (preferFree) {
        // Get free models (pricing.prompt = 0 and pricing.completion = 0)
        filteredModels = allModels.filter(model =>
          model.pricing &&
          model.pricing.prompt === 0 &&
          model.pricing.completion === 0
        );

        console.log(`Found ${filteredModels.length} truly free models`);

        // If no free models, fall back to low-cost models
        if (filteredModels.length === 0) {
          filteredModels = allModels.filter(model =>
            model.pricing &&
            (model.pricing.prompt + model.pricing.completion) <= 0.0001 // Very low cost threshold
          );
          console.log(`No free models found, using ${filteredModels.length} low-cost models`);
        }

        // If still no models, use all available models as last resort
        if (filteredModels.length === 0) {
          console.log('No free or low-cost models found, using all available models');
          filteredModels = allModels;
        }
      }

      // Sort by context length (prefer models with more context)
      filteredModels.sort((a, b) => (b.context_length || 0) - (a.context_length || 0));

      // Cache the results
      this.modelCache.set(cacheKey, {
        models: filteredModels,
        timestamp: Date.now()
      });

      console.log(`Fetched ${filteredModels.length} models from OpenRouter (${preferFree ? 'free/low-cost' : 'all'})`);

      // Log some examples for debugging
      if (filteredModels.length > 0) {
        console.log('Sample models:');
        filteredModels.slice(0, 3).forEach(model => {
          const cost = model.pricing ? `$${model.pricing.prompt + model.pricing.completion}` : 'unknown';
          console.log(`- ${model.id} (${cost}, context: ${model.context_length || 'unknown'})`);
        });
      }

      return filteredModels;

    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error.message);

      // Return cached models if available, even if expired
      if (cached) {
        console.log('Using expired cached models as fallback');
        return cached.models;
      }

      throw error;
    }
  }

  /**
   * Create a provider instance based on the provider ID
   */
  createProvider(providerId, config, apiKey) {
    switch (providerId) {
      case 'gemini':
        return new ChatGoogleGenerativeAI({
          apiKey,
          model: config.defaultModel,
          temperature: 0.7
        });

      case 'openrouter':
        return new ChatOpenAI({
          apiKey,
          model: config.defaultModel,
          temperature: 0.7,
          configuration: {
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
              'HTTP-Referer': process.env.WEBSITE_URL || 'http://localhost:8080',
              'X-Title': 'AI Course Generator'
            }
          }
        });

      default:
        throw new Error(`Unknown provider: ${providerId}`);
    }
  }

  /**
   * Get an LLM instance for the specified provider
   */
  getLLM(providerId, options = {}) {
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }
    
    if (!provider.isAvailable) {
      throw new Error(`Provider ${providerId} is not available: ${provider.error}`);
    }

    // If custom model or temperature is specified, create a new instance
    if (options.model || options.temperature !== undefined) {
      const apiKey = process.env[provider.config.envKeyName];
      const config = { ...provider.config };
      
      if (options.model) config.defaultModel = options.model;
      
      const llm = this.createProvider(providerId, config, apiKey);
      
      if (options.temperature !== undefined) {
        llm.temperature = options.temperature;
      }
      
      return llm;
    }

    return provider.instance;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders() {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({
      id,
      name: provider.config.name,
      isFree: provider.config.isFree,
      isAvailable: provider.isAvailable,
      models: provider.config.availableModels,
      error: provider.error || null
    }));
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(providerId) {
    const provider = this.providers.get(providerId);
    return provider && provider.isAvailable;
  }

  /**
   * Get the first available provider
   */
  getDefaultProvider() {
    for (const [id, provider] of this.providers.entries()) {
      if (provider.isAvailable) {
        return id;
      }
    }
    return null;
  }

  /**
   * Validate provider configuration
   */
  validateProvider(providerId) {
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      return { valid: false, error: `Provider ${providerId} not found` };
    }
    
    if (!provider.isAvailable) {
      return { valid: false, error: provider.error };
    }
    
    return { valid: true };
  }

  /**
   * Perform health check on a specific provider
   */
  async healthCheck(providerId) {
    const startTime = Date.now();
    
    try {
      const validation = this.validateProvider(providerId);
      if (!validation.valid) {
        return {
          provider: providerId,
          healthy: false,
          error: validation.error,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }

      // Test with a minimal prompt
      const llm = this.getLLM(providerId, { temperature: 0 });
      const testPrompt = 'Hello';
      
      const response = await llm.invoke(testPrompt);
      const responseTime = Date.now() - startTime;

      return {
        provider: providerId,
        healthy: true,
        responseTime,
        testResponse: response.content?.substring(0, 50) || 'No content',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        provider: providerId,
        healthy: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Perform health check on all available providers
   */
  async healthCheckAll() {
    const availableProviders = Array.from(this.providers.keys())
      .filter(id => this.isProviderAvailable(id));
    
    const healthChecks = await Promise.allSettled(
      availableProviders.map(id => this.healthCheck(id))
    );

    return healthChecks.map((result, index) => ({
      providerId: availableProviders[index],
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : { error: result.reason?.message }
    }));
  }

  /**
   * Get provider statistics and metadata
   */
  getProviderStats() {
    const providers = this.getAvailableProviders();
    const available = providers.filter(p => p.isAvailable);
    const unavailable = providers.filter(p => !p.isAvailable);
    const freeProviders = available.filter(p => p.isFree);
    const paidProviders = available.filter(p => !p.isFree);

    return {
      total: providers.length,
      available: available.length,
      unavailable: unavailable.length,
      free: freeProviders.length,
      paid: paidProviders.length,
      providers: {
        available: available.map(p => ({ id: p.id, name: p.name, isFree: p.isFree })),
        unavailable: unavailable.map(p => ({ id: p.id, name: p.name, error: p.error }))
      }
    };
  }

  /**
   * Create unified response format for LLM responses
   */
  createUnifiedResponse(success, data = {}) {
    const baseResponse = {
      success,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    if (success) {
      return {
        ...baseResponse,
        data: {
          content: data.content || '',
          provider: data.provider || 'unknown',
          providerName: data.providerName || 'Unknown Provider',
          model: data.model || 'default',
          responseTime: data.responseTime || 0,
          metadata: {
            promptLength: data.promptLength || 0,
            responseLength: data.responseLength || 0,
            temperature: data.temperature || 0.7,
            ...data.additionalMetadata
          }
        }
      };
    } else {
      return {
        ...baseResponse,
        error: {
          message: data.error || 'Unknown error',
          provider: data.provider || 'unknown',
          code: data.errorCode || 'UNKNOWN_ERROR',
          details: data.errorDetails || null
        }
      };
    }
  }

  /**
   * Get provider by priority (free providers first, then by availability)
   */
  getProviderByPriority(preferFree = true) {
    const providers = this.getAvailableProviders().filter(p => p.isAvailable);
    
    if (providers.length === 0) {
      return null;
    }

    if (preferFree) {
      const freeProvider = providers.find(p => p.isFree);
      if (freeProvider) {
        return freeProvider.id;
      }
    }

    // Return first available provider
    return providers[0].id;
  }

  /**
   * Refresh provider configurations (useful for runtime updates)
   */
  async refreshProviders() {
    console.log('Refreshing LLM providers...');
    this.providers.clear();
    this.modelCache.clear(); // Clear model cache too
    await this.initializeProviders();
    return this.getProviderStats();
  }

  /**
   * Force refresh OpenRouter models (bypass cache)
   */
  async refreshOpenRouterModels(preferFree = true) {
    const cacheKey = `openrouter_models_${preferFree}`;
    this.modelCache.delete(cacheKey);

    const provider = this.providers.get('openrouter');
    if (provider && provider.isAvailable) {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (apiKey) {
        try {
          const models = await this.fetchOpenRouterModels(apiKey, preferFree);
          // Update provider config with new models
          const updatedConfig = {
            ...provider.config,
            availableModels: models.map(m => m.id),
            defaultModel: models[0]?.id || provider.config.defaultModel
          };

          this.providers.set('openrouter', {
            ...provider,
            config: updatedConfig
          });

          console.log(`Refreshed OpenRouter models: ${models.length} available`);
          return models;
        } catch (error) {
          console.error('Failed to refresh OpenRouter models:', error.message);
          throw error;
        }
      }
    }

    return [];
  }
}

// Create singleton instance
const llmFactory = new LangChainFactory();

export default llmFactory;