/**
 * Error Utilities
 * @description Helper functions for error handling
 */

// Error utilities - moved to error constants for better organization

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

// isRetryableError and isAuthError are exported from ../constants/error.constants.ts
// Re-export them here for backward compatibility
export { isRetryableError, isAuthError } from "../constants/error.constants";

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
