/**
 * Error Types
 * @description Error type enum and user-friendly message table.
 *              The classification logic (status → type, type → retryable, ...)
 *              lives in the validators/ and resolvers/ folders; this file
 *              only contains the enum and the message table.
 */

export enum GroqErrorType {
  INVALID_API_KEY = "INVALID_API_KEY",
  MISSING_CONFIG = "MISSING_CONFIG",
  NETWORK_ERROR = "NETWORK_ERROR",
  ABORT_ERROR = "ABORT_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  CLIENT_ERROR = "CLIENT_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export const USER_FRIENDLY_ERROR_MESSAGES: Readonly<Record<GroqErrorType, string>> = {
  [GroqErrorType.INVALID_API_KEY]: "Please check your Groq API key and try again.",
  [GroqErrorType.MISSING_CONFIG]: "The provider is not configured. Please call configureProvider first.",
  [GroqErrorType.NETWORK_ERROR]: "Network error. Please check your connection and try again.",
  [GroqErrorType.ABORT_ERROR]: "Request was cancelled.",
  [GroqErrorType.RATE_LIMIT_ERROR]: "You've reached the rate limit. Please wait a moment and try again.",
  [GroqErrorType.SERVER_ERROR]: "Groq service is temporarily unavailable. Please try again later.",
  [GroqErrorType.CLIENT_ERROR]: "The request was invalid. Please check your input and try again.",
  [GroqErrorType.UNKNOWN_ERROR]: "An unexpected error occurred. Please try again.",
};
