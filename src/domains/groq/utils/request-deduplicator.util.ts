/**
 * Request Deduplicator Utility
 * @description Prevents duplicate API calls for the same request
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

interface DeduplicatorOptions {
  /** Time-to-live for pending requests in milliseconds */
  ttl?: number;
  /** Custom key generator for requests */
  keyGenerator?: (request: unknown) => string;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<unknown>>();
  private readonly defaultTTL: number;

  constructor(options: DeduplicatorOptions = {}) {
    this.defaultTTL = options.ttl || 30000; // 30 seconds default
  }

  /**
   * Execute a request with deduplication
   * If a similar request is pending, return its promise instead of creating a new one
   */
  async execute<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Clean up expired requests
    this.cleanup();

    // Check if there's a pending request with the same key
    const existing = this.pendingRequests.get(key);
    if (existing) {
      return existing.promise as Promise<T>;
    }

    // Create new request
    const promise = requestFn();

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    // Clean up after completion (success or failure)
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });

    return promise;
  }

  /**
   * Generate a default key from request parameters
   */
  generateKey(params: Record<string, unknown>): string {
    return JSON.stringify(params, Object.keys(params).sort());
  }

  /**
   * Check if a request is currently pending
   */
  isPending(key: string): boolean {
    this.cleanup();
    return this.pendingRequests.has(key);
  }

  /**
   * Cancel a pending request by key
   */
  cancel(key: string): boolean {
    const request = this.pendingRequests.get(key);
    if (request) {
      this.pendingRequests.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get count of pending requests
   */
  getPendingCount(): number {
    this.cleanup();
    return this.pendingRequests.size;
  }

  /**
   * Clean up expired pending requests
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.defaultTTL) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Clear all pending requests and reset state
   */
  reset(): void {
    this.pendingRequests.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();
export { RequestDeduplicator };
