/**
 * Cache Manager
 * @description LRU cache for API responses with TTL. Delegates:
 *              - LRU key selection → calculations/lru-key-selector
 *              - Cache key construction → builders/cache-key-builder
 *              - Hit rate calculation → calculations/cache-hit-rate
 */

import { selectLeastRecentlyUsedKey } from "../calculations/lru-key-selector";
import { calculateCacheHitRate } from "../calculations/cache-hit-rate";
import { buildCacheKey } from "../builders/cache-key-builder";

interface CacheEntry<T> {
  readonly value: T;
  readonly timestamp: number;
  accessCount: number;
  lastAccess: number;
}

export interface CacheOptions {
  /** Maximum number of entries. Default 100. */
  readonly maxSize?: number;
  /** Time-to-live in milliseconds. Default 5 minutes. */
  readonly ttl?: number;
}

const DEFAULT_CACHE_MAX_SIZE = 100;
const DEFAULT_CACHE_TTL_MS = 300_000;

export class CacheManager {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? DEFAULT_CACHE_MAX_SIZE;
    this.ttl = options.ttl ?? DEFAULT_CACHE_TTL_MS;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    entry.accessCount += 1;
    entry.lastAccess = Date.now();
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const lruKey = selectLeastRecentlyUsedKey(this.cache);
      if (lruKey !== null) this.cache.delete(lruKey);
    }
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now(),
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  /** Build a stable cache key from a parameter object. */
  generateKey(params: Readonly<Record<string, unknown>>): string {
    return buildCacheKey(params);
  }

  /**
   * Dynamic cache statistics. All numbers are computed at call time
   * from the current state; nothing is hardcoded.
   */
  getStats(): CacheStats {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      accessCount: entry.accessCount,
      ageMs: now - entry.timestamp,
    }));
    const hitRate = calculateCacheHitRate(
      Array.from(this.cache.values()).map((e) => ({ accessCount: e.accessCount })),
    );
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      entries,
    };
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }
}

export interface CacheStats {
  readonly size: number;
  readonly maxSize: number;
  readonly hitRate: number;
  readonly entries: ReadonlyArray<{
    readonly key: string;
    readonly accessCount: number;
    readonly ageMs: number;
  }>;
}

export const cacheManager = new CacheManager();
