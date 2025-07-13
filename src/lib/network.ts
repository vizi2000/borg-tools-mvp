export interface NetworkError extends Error {
  code?: string;
  status?: number;
  isNetworkError: boolean;
  isRetryable: boolean;
}

export function createNetworkError(
  message: string,
  status?: number,
  code?: string
): NetworkError {
  const error = new Error(message) as NetworkError;
  error.name = 'NetworkError';
  error.status = status;
  error.code = code;
  error.isNetworkError = true;
  error.isRetryable = isRetryableError(status);
  return error;
}

export function isRetryableError(status?: number): boolean {
  if (!status) return true; // Network errors are retryable
  
  // Retryable HTTP status codes
  return [408, 429, 500, 502, 503, 504].includes(status);
}

export function categorizeError(error: any): {
  type: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  isRetryable: boolean;
  userMessage: string;
  technicalMessage: string;
} {
  // Network/Connection errors
  if (!navigator.onLine) {
    return {
      type: 'network',
      isRetryable: true,
      userMessage: 'You appear to be offline. Please check your internet connection.',
      technicalMessage: 'No internet connection detected',
    };
  }

  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      type: 'network',
      isRetryable: true,
      userMessage: 'Unable to connect to the server. Please try again.',
      technicalMessage: `Network error: ${error.message}`,
    };
  }

  // HTTP status-based errors
  const status = error.status || error.response?.status;
  
  switch (status) {
    case 400:
      return {
        type: 'validation',
        isRetryable: false,
        userMessage: 'Invalid request. Please check your input and try again.',
        technicalMessage: `Bad Request: ${error.message}`,
      };
    
    case 401:
      return {
        type: 'auth',
        isRetryable: false,
        userMessage: 'Authentication failed. Please sign in again.',
        technicalMessage: `Unauthorized: ${error.message}`,
      };
    
    case 403:
      return {
        type: 'auth',
        isRetryable: false,
        userMessage: 'Access denied. You don\'t have permission for this action.',
        technicalMessage: `Forbidden: ${error.message}`,
      };
    
    case 404:
      return {
        type: 'server',
        isRetryable: false,
        userMessage: 'Resource not found. Please try refreshing the page.',
        technicalMessage: `Not Found: ${error.message}`,
      };
    
    case 408:
      return {
        type: 'network',
        isRetryable: true,
        userMessage: 'Request timed out. Please try again.',
        technicalMessage: `Request Timeout: ${error.message}`,
      };
    
    case 429:
      return {
        type: 'server',
        isRetryable: true,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        technicalMessage: `Rate Limited: ${error.message}`,
      };
    
    case 500:
      return {
        type: 'server',
        isRetryable: true,
        userMessage: 'Server error. Please try again in a few moments.',
        technicalMessage: `Internal Server Error: ${error.message}`,
      };
    
    case 502:
    case 503:
    case 504:
      return {
        type: 'server',
        isRetryable: true,
        userMessage: 'Service temporarily unavailable. Please try again later.',
        technicalMessage: `Server Error ${status}: ${error.message}`,
      };
    
    default:
      return {
        type: 'unknown',
        isRetryable: false,
        userMessage: 'An unexpected error occurred. Please try again.',
        technicalMessage: error.message || 'Unknown error',
      };
  }
}

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => categorizeError(error).isRetryable,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let attempt = 1;
  let lastError: any;

  while (attempt <= config.maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      if (!config.retryCondition!(error)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === config.maxAttempts) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay * (0.5 + Math.random() * 0.5);
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      attempt++;
    }
  }

  throw lastError;
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: Partial<RetryOptions> = {}
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw createNetworkError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }
    
    return response;
  }, retryOptions);
}

export async function apiCall<T>(
  url: string,
  options: RequestInit = {},
  retryOptions: Partial<RetryOptions> = {}
): Promise<T> {
  try {
    const response = await fetchWithRetry(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }, retryOptions);

    return await response.json();
  } catch (error) {
    const categorized = categorizeError(error);
    
    // Re-throw with enhanced error information
    const enhancedError = createNetworkError(
      categorized.userMessage,
      error.status,
      error.code
    );
    
    // Preserve original error for debugging
    enhancedError.cause = error;
    
    throw enhancedError;
  }
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onlineListener(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}