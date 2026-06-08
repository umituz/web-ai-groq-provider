/**
 * Request Executor Strategy
 * @description Strategy contract for composing request execution behaviors
 *              (retry, queue, deduplication, etc.).
 *
 * @example
 * ```typescript
 * const retryThenQueue = new CompositeExecutor([
 *   new RetryExecutor(retryManager),
 *   new QueueExecutor(queue, priority),
 * ]);
 * const result = await retryThenQueue.execute(fetchSomething, payload);
 * ```
 */

export interface IRequestExecutor<TArgs extends unknown[], TResult> {
  /**
   * Run `fn(...args)` through this executor's behavior. Implementations
   * may add retries, queueing, dedup, etc.
   */
  execute(fn: (...args: TArgs) => Promise<TResult>, ...args: TArgs): Promise<TResult>;
}
