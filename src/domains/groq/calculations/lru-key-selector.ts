/**
 * LRU Key Selector
 * @description Pure function: selects the least recently used key from
 *              a collection of timestamped entries. Used by LRU caches
 *              to choose which entry to evict when at capacity.
 *
 * @example
 * ```typescript
 * const entries = new Map([
 *   ["a", { lastAccess: 100 }],
 *   ["b", { lastAccess: 50 }],
 *   ["c", { lastAccess: 200 }],
 * ]);
 * selectLeastRecentlyUsedKey(entries); // "b"
 * ```
 */

export interface AccessTimestamped {
  readonly lastAccess: number;
}

export function selectLeastRecentlyUsedKey<K, V extends AccessTimestamped>(
  entries: ReadonlyMap<K, V>,
): K | null {
  let oldestKey: K | null = null;
  let oldestAccess = Number.POSITIVE_INFINITY;

  for (const [key, entry] of entries.entries()) {
    if (entry.lastAccess < oldestAccess) {
      oldestAccess = entry.lastAccess;
      oldestKey = key;
    }
  }

  return oldestKey;
}
