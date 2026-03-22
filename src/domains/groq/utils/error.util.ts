/**
 * Error Utilities
 * @description Helper functions for error handling
 */

import type { GroqMessage } from "../../domain/entities";
import { GroqErrorType } from "../constants/error.constants";

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: Error): string {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes("api key") || errorMessage.includes("unauthorized")) {
    return "Please check your Groq API key and try again.";
  }

  if (errorMessage.includes("rate limit")) {
    return "You've reached the rate limit. Please wait a moment and try again.";
  }

  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  if (errorMessage.includes("abort")) {
    return "Request was cancelled.";
  }

  return error.message || "An unexpected error occurred. Please try again.";
}

/**
 * Check if error is retryable
 */
export function isRetryableError(errorType: GroqErrorType): boolean {
  return [
    GroqErrorType.NETWORK_ERROR,
    GroqErrorType.RATE_LIMIT_ERROR,
    GroqErrorType.SERVER_ERROR,
  ].includes(errorType);
}

/**
 * Check if error is auth-related
 */
export function isAuthError(errorType: GroqErrorType): boolean {
  return errorType === GroqErrorType.INVALID_API_KEY;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): {
  message: string;
  type: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      type: error.name,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
    type: typeof error,
  };
}
