/**
 * Request Queue Manager Utility
 * @description Manages concurrent requests with priority and limits
 */

interface QueuedRequest<T> {
  id: string;
  priority: number;
  requestFn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
  timestamp: number;
}

interface QueueOptions {
  /** Maximum concurrent requests */
  maxConcurrent?: number;
  /** Default priority for requests (higher = more important) */
  defaultPriority?: number;
  /** Request timeout in milliseconds */
  requestTimeout?: number;
}

class RequestQueue {
  private queue: QueuedRequest<unknown>[] = [];
  private activeRequests = new Set<string>();
  private readonly maxConcurrent: number;
  private readonly defaultPriority: number;
  private readonly requestTimeout: number;
  private requestIdCounter = 0;

  constructor(options: QueueOptions = {}) {
    this.maxConcurrent = options.maxConcurrent || 3;
    this.defaultPriority = options.defaultPriority || 0;
    this.requestTimeout = options.requestTimeout || 30000; // 30 seconds
  }

  /**
   * Add a request to the queue
   */
  async add<T>(
    requestFn: () => Promise<T>,
    priority?: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `req-${++this.requestIdCounter}`;

      const queuedRequest: QueuedRequest<T> = {
        id,
        priority: priority ?? this.defaultPriority,
        requestFn,
        resolve: resolve as (value: unknown) => void,
        reject,
        timestamp: Date.now(),
      };

      this.queue.push(queuedRequest as QueuedRequest<unknown>);
      this.sortQueue();
      this.process();
    });
  }

  /**
   * Sort queue by priority (higher priority first) and timestamp
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.timestamp - b.timestamp; // Earlier requests first
    });
  }

  /**
   * Process queued requests
   */
  private process(): void {
    // Process as many requests as we can concurrently
    while (
      this.queue.length > 0 &&
      this.activeRequests.size < this.maxConcurrent
    ) {
      const request = this.queue.shift();
      if (!request) break;

      this.executeRequest(request);
    }
  }

  /**
   * Execute a single request
   */
  private async executeRequest<T>(request: QueuedRequest<T>): Promise<void> {
    this.activeRequests.add(request.id);

    // Add timeout
    const timeoutId = setTimeout(() => {
      this.activeRequests.delete(request.id);
      request.reject(new Error(`Request ${request.id} timed out`));
      this.process();
    }, this.requestTimeout);

    try {
      const result = await request.requestFn();
      clearTimeout(timeoutId);
      request.resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      request.reject(error);
    } finally {
      this.activeRequests.delete(request.id);
      // Process next request
      this.process();
    }
  }

  /**
   * Cancel a specific request by ID
   */
  cancel(requestId: string): boolean {
    // Check if it's in the queue
    const queueIndex = this.queue.findIndex(r => r.id === requestId);
    if (queueIndex !== -1) {
      const request = this.queue[queueIndex];
      this.queue.splice(queueIndex, 1);
      request.reject(new Error(`Request ${requestId} was cancelled`));
      return true;
    }

    // Check if it's active (we can't cancel active requests, but we can track)
    return this.activeRequests.has(requestId);
  }

  /**
   * Cancel all queued requests
   */
  cancelAll(): void {
    // Reject all queued requests
    for (const request of this.queue) {
      request.reject(new Error('Request was cancelled'));
    }
    this.queue = [];
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queued: number;
    active: number;
    maxConcurrent: number;
  } {
    return {
      queued: this.queue.length,
      active: this.activeRequests.size,
      maxConcurrent: this.maxConcurrent,
    };
  }

  /**
   * Check if queue is at capacity
   */
  isAtCapacity(): boolean {
    return this.activeRequests.size >= this.maxConcurrent;
  }

  /**
   * Clear queue and reset state
   */
  reset(): void {
    this.cancelAll();
    this.activeRequests.clear();
  }
}

export const requestQueue = new RequestQueue();
export { RequestQueue };
