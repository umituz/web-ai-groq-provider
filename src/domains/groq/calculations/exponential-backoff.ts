/**
 * Exponential Backoff Calculator
 * @description Pure function: computes a retry delay using
 *              exponential backoff with optional jitter.
 *              No hardcoded values: all parameters are explicit.
 *
 *              Formula:
 *                base   = initialDelay * (backoffMultiplier ^ (attempt - 1))
 *                capped = min(base, maxDelay)
 *                jitter = capped * jitterFactor * (random * 2 - 1)
 *                final  = max(0, capped + jitter)
 *
 * @example
 * ```typescript
 * calculateExponentialBackoff({
 *   attempt: 1,
 *   initialDelay: 1000,
 *   maxDelay: 10_000,
 *   backoffMultiplier: 2,
 *   jitterFactor: 0.1,
 * }); // ~1000ms (with small jitter)
 * ```
 */

export interface ExponentialBackoffParams {
  /** 1-based attempt number. */
  readonly attempt: number;
  /** Initial delay in milliseconds. */
  readonly initialDelay: number;
  /** Maximum delay cap in milliseconds. */
  readonly maxDelay: number;
  /** Multiplier applied per attempt (commonly 2). */
  readonly backoffMultiplier: number;
  /** Jitter factor (0 = no jitter, 0.5 = ±50%). */
  readonly jitterFactor: number;
  /** Random source in [0, 1). Defaults to Math.random. */
  readonly random?: () => number;
}

export function calculateExponentialBackoff(params: ExponentialBackoffParams): number {
  const {
    attempt,
    initialDelay,
    maxDelay,
    backoffMultiplier,
    jitterFactor,
    random = Math.random,
  } = params;

  const base = initialDelay * Math.pow(backoffMultiplier, Math.max(0, attempt - 1));
  const capped = Math.min(base, maxDelay);
  const jitterMultiplier = random() * 2 - 1;
  const jitter = capped * jitterFactor * jitterMultiplier;

  return Math.max(0, capped + jitter);
}
