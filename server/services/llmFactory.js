import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';

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
  groq: {
    id: 'groq',
    name: 'Groq',
    isFree: true,
    defaultModel: 'llama-3.1-8b-instant',
    envKeyName: 'GROQ_API_KEY',
    availableModels: ['llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'llama-3.2-90b-text-preview']
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    isFree: false,
    defaultModel: 'gpt-3.5-turbo',
    envKeyName: 'OPENAI_API_KEY',
    availableModels: ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o']
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    isFree: false,
    defaultModel: 'claude-3-5-sonnet-20241022',
    envKeyName: 'ANTHROPIC_API_KEY',
    availableModels: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307']
  }
};

/**
 * LangChain Factory for creating LLM instances
 */
class LangChainFactory {
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  /**
   * Initialize available providers based on environment variables
   */
  initializeProviders() {
    console.log('Initializing LLM providers...');
    
    for (const [providerId, config] of Object.entries(PROVIDER_CONFIGS)) {
      const apiKey = process.env[config.envKeyName];
      
      if (apiKey) {
        try {
          const provider = this.createProvider(providerId, config, apiKey);
          this.providers.set(providerId, {
            config,
            instance: provider,
            isAvailable: true
          });
          console.log(`✓ ${config.name} provider initialized`);
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
      
      case 'groq':
        return new ChatGroq({
          apiKey,
          model: config.defaultModel,
          temperature: 0.7
        });
      
      case 'openai':
        return new ChatOpenAI({
          apiKey,
          model: config.defaultModel,
          temperature: 0.7
        });
      
      case 'anthropic':
        return new ChatAnthropic({
          apiKey,
          model: config.defaultModel,
          temperature: 0.7
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
  refreshProviders() {
    console.log('Refreshing LLM providers...');
    this.providers.clear();
    this.initializeProviders();
    return this.getProviderStats();
  }
}

// Create singleton instance
const llmFactory = new LangChainFactory();

export default llmFactory;