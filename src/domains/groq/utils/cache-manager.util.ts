/**
 * Cache Manager Utility
 * @description LRU cache for storing API responses
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
}

interface CacheOptions {
  /** Maximum number of entries in cache */
  maxSize?: number;
  /** Time-to-live for cache entries in milliseconds */
  ttl?: number;
  /** Custom key generator */
  keyGenerator?: (input: unknown) => string;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100; // Default 100 entries
    this.ttl = options.ttl || 300000; // 5 minutes default TTL
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccess = Date.now();

    return entry.value as T;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T): void {
    // If cache is full, remove least recently used entry
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now(),
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Delete a specific entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; accessCount: number; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      accessCount: entry.accessCount,
      age: now - entry.timestamp,
    }));

    // Calculate average hit rate
    const totalAccessCount = entries.reduce(
      (sum, e) => sum + e.accessCount,
      0
    );
    const hitRate = this.cache.size > 0 ? totalAccessCount / this.cache.size : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      entries,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let removed = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /**
   * Check if an entry has expired
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < lruTime) {
        lruTime = entry.lastAccess;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Generate a cache key from parameters
   */
  generateKey(params: Record<string, unknown>): string {
    // Sort keys to ensure consistent key generation
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, unknown>);

    return JSON.stringify(sortedParams);
  }

  /**
   * Preload cache with multiple entries
   */
  preload<T>(entries: Array<{ key: string; value: T }>): void {
    for (const entry of entries) {
      this.set(entry.key, entry.value);
    }
  }

  /**
   * Get or set pattern - return cached value or compute and cache it
   */
  async getOrSet<T>(
    key: string,
    computeFn: () => Promise<T>
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await computeFn();
    this.set(key, value);
    return value;
  }

  /**
   * Reset cache to initial state
   */
  reset(): void {
    this.cache.clear();
  }
}

export const cacheManager = new CacheManager();
export { CacheManager };
