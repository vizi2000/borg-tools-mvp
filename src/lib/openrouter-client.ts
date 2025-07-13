// OpenRouter API client for AI model integration
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  created: number;
}

export interface OpenRouterError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

// Available free models on OpenRouter (as of July 2025)
export const FREE_MODELS = {
  MISTRAL_SMALL: 'mistralai/mistral-small:free',
  OPTIMUS_ALPHA: 'openrouter/optimus-alpha:free',
  CYPHER_ALPHA: 'openrouter/cypher-alpha:free',
  LLAMA_MAVERICK: 'meta-llama/llama-4-maverick:free',
  SCOUT: 'anthropic/scout:free',
  DEEPSEEK_V3: 'deepseek/deepseek-v3-base:free',
  QWEN_VL: 'qwen/qwen2.5-vl-72b-instruct:free',
} as const;

export class OpenRouterClient {
  private config: OpenRouterConfig;

  constructor(config: OpenRouterConfig) {
    this.config = {
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: FREE_MODELS.MISTRAL_SMALL,
      timeout: 30000,
      ...config,
    };
  }

  async chat(request: Partial<OpenRouterRequest>): Promise<OpenRouterResponse> {
    const url = `${this.config.baseUrl}/chat/completions`;
    
    const body: OpenRouterRequest = {
      model: this.config.defaultModel!,
      max_tokens: 1000,
      temperature: 0.7,
      stream: false,
      ...request,
      messages: request.messages || [],
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004',
          'X-Title': 'Borg-Tools CV Generator',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        const errorData: OpenRouterError = await response.json();
        throw new OpenRouterApiError(
          errorData.error.message,
          response.status,
          errorData.error.type,
          errorData.error.code
        );
      }

      const data: OpenRouterResponse = await response.json();
      return data;

    } catch (error) {
      if (error instanceof OpenRouterApiError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new OpenRouterApiError('Network error: Unable to connect to OpenRouter API', 0, 'network_error');
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new OpenRouterApiError('Request timeout: OpenRouter API took too long to respond', 0, 'timeout');
      }

      throw new OpenRouterApiError(
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        0,
        'unexpected_error'
      );
    }
  }

  async generateText(
    systemPrompt: string,
    userPrompt: string,
    model?: string,
    options?: Partial<OpenRouterRequest>
  ): Promise<string> {
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.chat({
      model: model || this.config.defaultModel,
      messages,
      ...options,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new OpenRouterApiError('No response generated from OpenRouter API', 0, 'empty_response');
    }

    return response.choices[0].message.content.trim();
  }

  // Test connection to OpenRouter API
  async testConnection(): Promise<{ success: boolean; model: string; response: string }> {
    try {
      const testResponse = await this.generateText(
        'You are a helpful assistant. Respond with exactly: "OpenRouter connection successful!"',
        'Test connection',
        this.config.defaultModel,
        { max_tokens: 20, temperature: 0 }
      );

      return {
        success: true,
        model: this.config.defaultModel!,
        response: testResponse,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get available models (for debugging)
  async getAvailableModels(): Promise<any> {
    const url = `${this.config.baseUrl}/models`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new OpenRouterApiError(`Failed to fetch models: ${response.statusText}`, response.status, 'api_error');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch available models:', error);
      throw error;
    }
  }
}

export class OpenRouterApiError extends Error {
  public status: number;
  public type: string;
  public code?: string;

  constructor(message: string, status: number = 0, type: string = 'unknown', code?: string) {
    super(message);
    this.name = 'OpenRouterApiError';
    this.status = status;
    this.type = type;
    this.code = code;
  }

  get isRateLimited(): boolean {
    return this.status === 429 || this.type === 'rate_limit_exceeded';
  }

  get isModelUnavailable(): boolean {
    return this.status === 503 || this.type === 'model_unavailable' || this.message.includes('unavailable');
  }

  get isInvalidKey(): boolean {
    return this.status === 401 || this.type === 'invalid_api_key';
  }

  get isInsufficientCredits(): boolean {
    return this.status === 402 || this.type === 'insufficient_credits';
  }
}

// Factory function to create OpenRouter client
export function createOpenRouterClient(): OpenRouterClient {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not found. Please set OPENROUTER_API_KEY environment variable.');
  }

  return new OpenRouterClient({
    apiKey,
    defaultModel: FREE_MODELS.MISTRAL_SMALL,
  });
}

// Utility functions for model selection
export function getOptimalModelForTask(task: 'summary' | 'experience' | 'projects' | 'skills' | 'ats'): string {
  switch (task) {
    case 'summary':
      return FREE_MODELS.MISTRAL_SMALL; // Best for professional writing
    case 'experience':
      return FREE_MODELS.OPTIMUS_ALPHA; // Optimized instruction following
    case 'projects':
      return FREE_MODELS.CYPHER_ALPHA; // Good for creative descriptions
    case 'skills':
      return FREE_MODELS.MISTRAL_SMALL; // Structured output
    case 'ats':
      return FREE_MODELS.OPTIMUS_ALPHA; // Keyword optimization
    default:
      return FREE_MODELS.MISTRAL_SMALL;
  }
}

export function getFallbackModels(): string[] {
  return [
    FREE_MODELS.MISTRAL_SMALL,
    FREE_MODELS.OPTIMUS_ALPHA,
    FREE_MODELS.CYPHER_ALPHA,
    FREE_MODELS.DEEPSEEK_V3,
  ];
}

// Export types for external use
export type { OpenRouterMessage, OpenRouterRequest, OpenRouterResponse, OpenRouterConfig };