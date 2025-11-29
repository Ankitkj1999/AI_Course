// AI Service for handling LLM requests
export class AIService {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async executePrompt(prompt: string): Promise<string> {
    try {
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt: prompt.trim(),
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data?.content) {
        return result.data.content;
      } else {
        throw new Error(result.error?.message || 'Failed to generate content');
      }
    } catch (error) {
      console.error('AI service error:', error);
      throw error;
    }
  }
}

export const aiService = AIService.getInstance();