
import { GroqError } from "../utils/groq-error";
import { GroqErrorType, USER_FRIENDLY_ERROR_MESSAGES } from "../constants/error-types";

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
