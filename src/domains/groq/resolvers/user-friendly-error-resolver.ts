/**
 * User-Friendly Error Resolver
 * @description Maps any thrown value (Error, GroqError, string, etc.)
 *              to a user-facing string suitable for display. No I/O,
 *              no hardcoded user-facing strings: the mapping table
 *              is explicit and overridable.
 *
 * @example
 * ```typescript
 * resolveUserFriendlyErrorMessage(new GroqError(GroqErrorType.RATE_LIMIT_ERROR, "x"));
 * // "You've reached the rate limit. Please wait a moment and try again."
 * ```
 */

import { GroqError } from "../utils/groq-error";
import { GroqErrorType, USER_FRIENDLY_ERROR_MESSAGES } from "../constants/error-types";

/**
 * Keyword-based fallback messages. Used when the error is not a
 * {@link GroqError} and we want to do best-effort classification
 * by string matching.
 */
const KEYWORD_FALLBACK_RULES: ReadonlyArray<{ keywords: ReadonlyArray<string>; type: GroqErrorType }> = [
  { keywords: ["api key", "unauthorized"], type: GroqErrorType.INVALID_API_KEY },
  { keywords: ["rate limit"], type: GroqErrorType.RATE_LIMIT_ERROR },
  { keywords: ["network", "fetch"], type: GroqErrorType.NETWORK_ERROR },
  { keywords: ["abort"], type: GroqErrorType.ABORT_ERROR },
];

export function resolveUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof GroqError) {
    return USER_FRIENDLY_ERROR_MESSAGES[error.type];
  }

  if (error instanceof Error) {
    const lower = error.message.toLowerCase();
    for (const rule of KEYWORD_FALLBACK_RULES) {
      if (rule.keywords.some((kw) => lower.includes(kw))) {
        return USER_FRIENDLY_ERROR_MESSAGES[rule.type];
      }
    }
    if (error.message.length > 0) return error.message;
  }

  return USER_FRIENDLY_ERROR_MESSAGES[GroqErrorType.UNKNOWN_ERROR];
}
