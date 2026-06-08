/**
 * Cache Hit Rate Calculator
 * @description Pure function: computes the average access count
 *              per cache entry, used to surface cache effectiveness
 *              in dynamic statistics displays.
 *
 * @example
 * ```typescript
 * calculateCacheHitRate([
 *   { accessCount: 5 },
 *   { accessCount: 3 },
 *   { accessCount: 0 },
 * ]); // 2.67
 *
 * calculateCacheHitRate([]); // 0
 * ```
 */

export interface AccessCounted {
  readonly accessCount: number;
}

export function calculateCacheHitRate(
  entries: ReadonlyArray<AccessCounted>,
): number {
  if (entries.length === 0) return 0;
  const totalAccess = entries.reduce((sum, e) => sum + e.accessCount, 0);
  return totalAccess / entries.length;
}
