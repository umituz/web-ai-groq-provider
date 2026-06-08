/**
 * Timing Window Calculator
 * @description Pure function: computes time-based decisions for
 *              debounce and throttle logic. No hardcoded values.
 *
 * @example
 * ```typescript
 * shouldCallOnLeadingEdge({
 *   now: Date.now(),
 *   lastCallTime: 0,
 *   interval: 1000,
 *   leadingEnabled: true,
 *   isThrottled: false,
 * }); // true
 * ```
 */

export interface LeadingEdgeParams {
  readonly now: number;
  readonly lastCallTime: number;
  readonly interval: number;
  readonly leadingEnabled: boolean;
  readonly isThrottled: boolean;
}

export function shouldCallOnLeadingEdge(params: LeadingEdgeParams): boolean {
  const { now, lastCallTime, interval, leadingEnabled, isThrottled } = params;
  if (!leadingEnabled) return false;
  if (isThrottled) return false;
  return now - lastCallTime >= interval;
}

export interface TrailingDelayParams {
  readonly interval: number;
  readonly timeSinceLastCall: number;
}

export function calculateTrailingDelay(params: TrailingDelayParams): number {
  return Math.max(0, params.interval - params.timeSinceLastCall);
}

export function isWithinWindow(now: number, lastCallTime: number, interval: number): boolean {
  return now - lastCallTime < interval;
}
