/**
 * Retry Logic Utility
 * @description Exponential backoff retry mechanism for failed requests
 */

import { GroqError } from "./groq-error.util";
import { GroqErrorType, isRetryableError } from "../constants/error.constants";

interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay between retries */
  maxDelay?: number;
  /** Backoff multiplier */
  backoffMultiplier?: number;
  /** Jitter factor to prevent thundering herd (0-1) */
  jitterFactor?: number;
  /** Custom retry condition */
  shouldRetry?: (error: Error) => boolean;
}

interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDelay: number;
}

class RetryManager {
  private readonly defaultMaxAttempts: number;
  private readonly defaultInitialDelay: number;
  private readonly defaultMaxDelay: number;
  private readonly defaultBackoffMultiplier: number;
  private readonly defaultJitterFactor: number;

  constructor() {
    this.defaultMaxAttempts = 3;
    this.defaultInitialDelay = 1000; // 1 second
    this.defaultMaxDelay = 10000; // 10 seconds
    this.defaultBackoffMultiplier = 2;
    this.defaultJitterFactor = 0.1; // 10% jitter
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const maxAttempts = options.maxAttempts ?? this.defaultMaxAttempts;
    let lastError: Error | null = null;
    let totalDelay = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry
        if (attempt >= maxAttempts || !this.shouldRetry(lastError, options)) {
          throw lastError;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, options);
        totalDelay += delay;

        // Wait before retrying
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Execute with detailed retry result
   */
  async executeWithDetails<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const maxAttempts = options.maxAttempts ?? this.defaultMaxAttempts;
    let lastError: Error | null = null;
    let totalDelay = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const data = await fn();
        return {
          success: true,
          data,
          attempts: attempt,
          totalDelay,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt >= maxAttempts || !this.shouldRetry(lastError, options)) {
          return {
            success: false,
            error: lastError,
            attempts: attempt,
            totalDelay,
          };
        }

        const delay = this.calculateDelay(attempt, options);
        totalDelay += delay;
        await this.delay(delay);
      }
    }

    return {
      success: false,
      error: lastError || new Error("Unknown error"),
      attempts: maxAttempts,
      totalDelay,
    };
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, options: RetryOptions): number {
    const initialDelay = options.initialDelay ?? this.defaultInitialDelay;
    const maxDelay = options.maxDelay ?? this.defaultMaxDelay;
    const backoffMultiplier = options.backoffMultiplier ?? this.defaultBackoffMultiplier;
    const jitterFactor = options.jitterFactor ?? this.defaultJitterFactor;

    // Exponential backoff
    let delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);

    // Cap at max delay
    delay = Math.min(delay, maxDelay);

    // Add jitter to prevent thundering herd
    const jitter = delay * jitterFactor * (Math.random() * 2 - 1);
    delay = delay + jitter;

    // Ensure delay is not negative
    return Math.max(0, delay);
  }

  /**
   * Check if error should trigger a retry
   */
  private shouldRetry(error: Error, options: RetryOptions): boolean {
    // Use custom retry condition if provided
    if (options.shouldRetry) {
      return options.shouldRetry(error);
    }

    // Check if it's a GroqError
    if (error instanceof GroqError) {
      return isRetryableError(error.type);
    }

    // Default: retry on network errors
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes("network") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("econnrefused") ||
      errorMessage.includes("enotfound") ||
      errorMessage.includes("etimedout")
    );
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retryable function wrapper
   */
  wrap<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    options?: RetryOptions
  ): T {
    return (async (...args: unknown[]) => {
      return this.execute(() => fn(...args), options);
    }) as T;
  }
}

export const retryManager = new RetryManager();
export { RetryManager };

/**
 * Convenience function to execute with retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retryManager.execute(fn, options);
}
