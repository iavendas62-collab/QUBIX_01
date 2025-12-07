/**
 * Error Handling Utilities
 * Centralized error handling with retry logic and user-friendly messages
 */

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);

      // Call retry callback
      onRetry?.(attempt, lastError);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Network errors
  if (errorMessage.includes('fetch') || errorMessage.includes('NetworkError')) {
    return 'Network connection error. Please check your internet connection.';
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    return 'Request timed out. Please try again.';
  }

  // Server errors
  if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
    return 'Server error. Our team has been notified. Please try again later.';
  }

  // Authentication errors
  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
    return 'Authentication failed. Please sign in again.';
  }

  // Permission errors
  if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
    return 'You do not have permission to perform this action.';
  }

  // Not found errors
  if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
    return 'The requested resource was not found.';
  }

  // Validation errors
  if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
    return 'Invalid request. Please check your input and try again.';
  }

  // File upload errors
  if (errorMessage.includes('file too large') || errorMessage.includes('size limit')) {
    return 'File is too large. Maximum size is 500MB.';
  }

  if (errorMessage.includes('unsupported format') || errorMessage.includes('invalid file')) {
    return 'Unsupported file format. Please upload .py, .ipynb, .csv, .json, or Dockerfile.';
  }

  // Blockchain errors
  if (errorMessage.includes('insufficient funds') || errorMessage.includes('balance')) {
    return 'Insufficient balance. Please add funds to your wallet.';
  }

  if (errorMessage.includes('transaction failed') || errorMessage.includes('tx failed')) {
    return 'Transaction failed. Please try again or check the blockchain explorer.';
  }

  if (errorMessage.includes('wallet') || errorMessage.includes('signature')) {
    return 'Wallet error. Please check your wallet connection and try again.';
  }

  // GPU/Job errors
  if (errorMessage.includes('no compatible GPU') || errorMessage.includes('no available')) {
    return 'No compatible GPUs available. Please try again later or adjust your requirements.';
  }

  if (errorMessage.includes('job failed') || errorMessage.includes('execution error')) {
    return 'Job execution failed. Please check the logs for details.';
  }

  // Default message
  return errorMessage || 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Network errors are retryable
  if (errorMessage.includes('fetch') || errorMessage.includes('NetworkError')) {
    return true;
  }

  // Timeout errors are retryable
  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    return true;
  }

  // 5xx server errors are retryable
  if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
    return true;
  }

  // Rate limiting is retryable
  if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
    return true;
  }

  // 4xx client errors are NOT retryable (except 429)
  if (errorMessage.includes('400') || errorMessage.includes('401') || 
      errorMessage.includes('403') || errorMessage.includes('404')) {
    return false;
  }

  // Default: not retryable
  return false;
}

/**
 * Log error to console with context
 */
export function logError(error: unknown, context?: Record<string, any>) {
  console.error('[Error]', {
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle API errors with retry logic
 */
export async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  options: {
    retryOptions?: RetryOptions;
    errorContext?: Record<string, any>;
    showToast?: (message: string, type: 'error' | 'success') => void;
  } = {}
): Promise<T> {
  const { retryOptions, errorContext, showToast } = options;

  try {
    if (retryOptions) {
      return await retryWithBackoff(apiCall, {
        ...retryOptions,
        onRetry: (attempt, error) => {
          console.log(`Retry attempt ${attempt} after error:`, error.message);
          retryOptions.onRetry?.(attempt, error);
        },
      });
    } else {
      return await apiCall();
    }
  } catch (error) {
    logError(error, errorContext);
    
    const message = getUserFriendlyErrorMessage(error);
    showToast?.(message, 'error');
    
    throw error;
  }
}

