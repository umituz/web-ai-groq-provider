/**
 * Composite Executor Strategy
 * @description Chains multiple IRequestExecutor instances.
 *              Order matters: the OUTERMOST executor wraps the others.
 *              Execution flows top-to-bottom on the way in,
 *              bottom-to-top on the way out.
 *
 * Example with [Dedupe, Retry, Queue]:
 *   Dedupe -> Retry -> Queue -> fn
 */

import type { IRequestExecutor } from "./request-executor.strategy";

type AnyExecutor = IRequestExecutor<unknown[], unknown>;

export class CompositeExecutor<TArgs extends unknown[], TResult>
  implements IRequestExecutor<TArgs, TResult>
{
  private readonly executors: ReadonlyArray<AnyExecutor>;

  constructor(executors: ReadonlyArray<IRequestExecutor<TArgs, TResult>>) {
    this.executors = executors as unknown as ReadonlyArray<AnyExecutor>;
  }

  execute(fn: (...args: TArgs) => Promise<TResult>, ...args: TArgs): Promise<TResult> {
    const composed = this.compress(fn as unknown as (...a: unknown[]) => Promise<unknown>);
    return composed(...args) as Promise<TResult>;
  }

  private compress(fn: (...args: unknown[]) => Promise<unknown>): (...args: unknown[]) => Promise<unknown> {
    return this.executors.reduceRight(
      (innerFn, executor) => (...a: unknown[]) => executor.execute(innerFn, ...a),
      fn,
    );
  }
}
