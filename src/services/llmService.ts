/**
 * Frontend LLM Service - Bridge to backend LLM infrastructure
 * Connects to server/services/llmService.js via API
 */

export interface LLMGenerateOptions {
  provider?: string;
  model?: string;
  temperature?: number;
  preferFree?: boolean;
}

export interface LLMResponse {
  success: boolean;
  data?: {
    content: string;
    provider: string;
    providerName: string;
    model: string;
    responseTime: number;
  };
  error?: {
    message: string;
    code?: string;
  };
}

class LLMService {
  private static instance: LLMService;

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  /**
   * Generate content using the backend LLM service
   */
  async generateContent(prompt: string, options: LLMGenerateOptions = {}): Promise<LLMResponse> {
    try {
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt: prompt.trim(),
          provider: options.provider,
          model: options.model,
          temperature: options.temperature ?? 0.7,
          preferFree: options.preferFree ?? true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: LLMResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to generate content');
      }

      return result;
    } catch (error) {
      console.error('LLM service error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'GENERATION_FAILED',
        },
      };
    }
  }

  /**
   * Get available LLM providers
   */
  async getProviders() {
    try {
      const response = await fetch('/api/llm/providers', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get providers:', error);
      return { providers: [] };
    }
  }

  /**
   * Check LLM service health
   */
  async checkHealth() {
    try {
      const response = await fetch('/api/llm/health', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Health check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const llmService = LLMService.getInstance();
