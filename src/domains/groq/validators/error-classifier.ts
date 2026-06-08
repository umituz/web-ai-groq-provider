/**
 * Error Classifier
 * @description Pure functions: classify a GroqErrorType into actionable
 *              categories (retryable, auth-related, etc.).
 *              No hardcoded error types in the call sites; the sets
 *              are explicit and configurable.
 *
 * @example
 * ```typescript
 * isRetryableErrorType(GroqErrorType.RATE_LIMIT_ERROR); // true
 * isRetryableErrorType(GroqErrorType.INVALID_API_KEY);   // false
 * isAuthErrorType(GroqErrorType.INVALID_API_KEY);        // true
 * ```
 */

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
