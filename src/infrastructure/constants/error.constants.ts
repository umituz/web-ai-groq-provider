/**
 * Error Type Constants
 * @description Error types and mappings for Groq API
 */

/**
 * Error types enum
 */
export enum GroqErrorType {
  INVALID_API_KEY = "INVALID_API_KEY",
  MISSING_CONFIG = "MISSING_CONFIG",
  NETWORK_ERROR = "NETWORK_ERROR",
  ABORT_ERROR = "ABORT_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Map HTTP status to error type
 */
export function mapHttpStatusToErrorType(status: number): GroqErrorType {
  if (status === 401 || status === 403) return GroqErrorType.INVALID_API_KEY;
  if (status === 429) return GroqErrorType.RATE_LIMIT_ERROR;
  if (status >= 500) return GroqErrorType.SERVER_ERROR;
  if (status >= 400) return GroqErrorType.INVALID_API_KEY;
  return GroqErrorType.UNKNOWN_ERROR;
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
