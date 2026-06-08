/**
 * Queue Executor Strategy
 * @description Wraps a request function with a concurrency-limiting queue.
 *
 * @example
 * ```typescript
 * const executor = new QueueExecutor(queue, 10); // priority 10
 * await executor.execute(someRequest, payload);
 * ```
 */

import type { IRequestExecutor } from "./request-executor.strategy";
import { RequestQueue } from "../utils/request-queue.util";

export class QueueExecutor<TArgs extends unknown[], TResult>
  implements IRequestExecutor<TArgs, TResult>
{
  constructor(
    private readonly queue: RequestQueue,
    private readonly priority: number,
  ) {}

  execute(fn: (...args: TArgs) => Promise<TResult>, ...args: TArgs): Promise<TResult> {
    return this.queue.add(() => fn(...args), this.priority);
  }
}
