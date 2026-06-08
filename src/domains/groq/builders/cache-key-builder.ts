/**
 * Cache Key Builder
 * @description Pure function: builds a stable cache key from a
 *              parameter object by sorting its keys and JSON-stringifying.
 *              No hardcoded values.
 *
 * @example
 * ```typescript
 * buildCacheKey({ b: 1, a: 2 }); // '{"a":2,"b":1}'
 * buildCacheKey({ model: "x", prompt: "hi" });
 * ```
 */

export function buildCacheKey(params: Readonly<Record<string, unknown>>): string {
  const sortedKeys = Object.keys(params).sort();
  const sortedParams: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sortedParams[key] = params[key];
  }
  return JSON.stringify(sortedParams);
}
