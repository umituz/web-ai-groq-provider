
import { GroqErrorType } from "../constants/error-types";

const DEFAULT_RETRYABLE_TYPES: ReadonlySet<GroqErrorType> = new Set([
  GroqErrorType.NETWORK_ERROR,
  GroqErrorType.RATE_LIMIT_ERROR,
  GroqErrorType.SERVER_ERROR,
]);

const DEFAULT_AUTH_TYPES: ReadonlySet<GroqErrorType> = new Set([
  GroqErrorType.INVALID_API_KEY,
]);

export interface ErrorClassificationRule {
  readonly retryable: ReadonlySet<GroqErrorType>;
  readonly auth: ReadonlySet<GroqErrorType>;
}

export const DEFAULT_ERROR_CLASSIFICATION_RULE: ErrorClassificationRule = {
  retryable: DEFAULT_RETRYABLE_TYPES,
  auth: DEFAULT_AUTH_TYPES,
};

export function isRetryableErrorType(
  type: GroqErrorType,
  rule: ErrorClassificationRule = DEFAULT_ERROR_CLASSIFICATION_RULE,
): boolean {
  return rule.retryable.has(type);
}

export function isAuthErrorType(
  type: GroqErrorType,
  rule: ErrorClassificationRule = DEFAULT_ERROR_CLASSIFICATION_RULE,
): boolean {
  return rule.auth.has(type);
}
