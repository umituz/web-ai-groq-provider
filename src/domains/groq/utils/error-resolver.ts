/**
 * Error Resolver
 * @description Resolves any thrown value to a user-friendly message.
 *              Delegates the actual classification → resolvers/user-friendly-error-resolver.
 */

import { resolveUserFriendlyErrorMessage } from "../resolvers/user-friendly-error-resolver";
import { GroqError } from "./groq-error";
import { GroqErrorType, USER_FRIENDLY_ERROR_MESSAGES } from "../constants/error-types";
import type { GroqErrorMetadata } from "./groq-error";

export const resolveUserFriendlyMessage = resolveUserFriendlyErrorMessage;

export interface LoggedError {
  readonly message: string;
  readonly type: string;
  readonly stack?: string;
  readonly metadata?: GroqErrorMetadata;
}

export function formatErrorForLogging(error: unknown): LoggedError {
  if (error instanceof GroqError) {
    return {
      message: error.message,
      type: error.type,
      stack: error.stack,
      metadata: error.metadata,
    };
  }
  if (error instanceof Error) {
    return { message: error.message, type: error.name, stack: error.stack };
  }
  return { message: String(error), type: typeof error };
}

export { GroqErrorType, USER_FRIENDLY_ERROR_MESSAGES };
