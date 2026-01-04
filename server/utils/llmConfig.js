import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * LLM Configuration utility for managing environment variables
 */
class LLMConfig {
  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from environment variables
   */
  loadConfig() {
    return {
      // Provider API Keys
      providers: {
        google: {
          apiKey: process.env.GOOGLE_API_KEY,
          enabled: !!process.env.GOOGLE_API_KEY
        },
        openrouter: {
          apiKey: process.env.OPENROUTER_API_KEY,
          enabled: !!process.env.OPENROUTER_API_KEY
        }
      },
      
      // Default LLM settings
      defaults: {
        temperature: 0.7,
        maxTokens: 2048,
        timeout: 30000 // 30 seconds
      },
      
      // Feature flags
      features: {
        multiLLMEnabled: process.env.MULTI_LLM_ENABLED !== 'false', // Default to true
        fallbackEnabled: process.env.LLM_FALLBACK_ENABLED !== 'false', // Default to true
        debugMode: process.env.LLM_DEBUG === 'true'
      }
    };
  }

  /**
   * Get API key for a specific provider
   */
  getProviderApiKey(provider) {
    return this.config.providers[provider]?.apiKey;
  }

  /**
   * Check if a provider is enabled
   */
  isProviderEnabled(provider) {
    return this.config.providers[provider]?.enabled || false;
  }

  /**
   * Get list of enabled providers
   */
  getEnabledProviders() {
    return Object.entries(this.config.providers)
      .filter(([_, config]) => config.enabled)
      .map(([provider, _]) => provider);
  }

  /**
   * Get default LLM settings
   */
  getDefaults() {
    return this.config.defaults;
  }

  /**
   * Check if multi-LLM feature is enabled
   */
  isMultiLLMEnabled() {
    return this.config.features.multiLLMEnabled;
  }

  /**
   * Check if fallback is enabled
   */
  isFallbackEnabled() {
    return this.config.features.fallbackEnabled;
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugMode() {
    return this.config.features.debugMode;
  }

  /**
   * Validate configuration
   */
  validate() {
    const enabledProviders = this.getEnabledProviders();
    
    if (enabledProviders.length === 0) {
      throw new Error('No LLM providers are configured. Please set at least one API key.');
    }

    if (this.isDebugMode()) {
      console.log('LLM Configuration:');
      console.log('- Enabled providers:', enabledProviders);
      console.log('- Multi-LLM enabled:', this.isMultiLLMEnabled());
      console.log('- Fallback enabled:', this.isFallbackEnabled());
    }

    return {
      valid: true,
      enabledProviders,
      warnings: []
    };
  }

  /**
   * Get configuration summary for logging
   */
  getSummary() {
    const enabledProviders = this.getEnabledProviders();
    
    return {
      enabledProviders,
      totalProviders: enabledProviders.length,
      multiLLMEnabled: this.isMultiLLMEnabled(),
      fallbackEnabled: this.isFallbackEnabled(),
      debugMode: this.isDebugMode()
    };
  }
}

// Create singleton instance
const llmConfig = new LLMConfig();

export default llmConfig;