/**
 * Debounce and Throttle Utility
 * @description Rate limiting utilities for user input and API calls
 */

interface DebounceOptions {
  /** Delay in milliseconds */
  delay?: number;
  /** Execute on leading edge */
  leading?: boolean;
  /** Execute on trailing edge */
  trailing?: boolean;
}

interface ThrottleOptions {
  /** Interval in milliseconds */
  interval?: number;
  /** Execute on leading edge */
  leading?: boolean;
  /** Execute on trailing edge */
  trailing?: boolean;
}

class DebounceManager {
  private timers = new Map<string, NodeJS.Timeout>();
  private lastArgs = new Map<string, unknown[]>();
  private lastThis = new Map<string, unknown>();

  /**
   * Debounce a function
   * Delays execution until after delay milliseconds have elapsed since last invocation
   */
  debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    options: DebounceOptions = {}
  ): T {
    const delay = options.delay ?? 300;
    const leading = options.leading ?? false;
    const trailing = options.trailing ?? true;

    let timer: NodeJS.Timeout | null = null;
    let lastCallTime = 0;
    let lastResult: unknown;

    return ((...args: unknown[]) => {
      const now = Date.now();
      const shouldCallLeading = leading && !timer && now - lastCallTime > delay;

      // Clear existing timer
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      // Call on leading edge
      if (shouldCallLeading) {
        lastCallTime = now;
        lastResult = fn(...args);
        return lastResult;
      }

      // Schedule trailing edge call
      if (trailing) {
        timer = setTimeout(() => {
          timer = null;
          lastCallTime = Date.now();
          lastResult = fn(...args);
        }, delay);
      }

      return lastResult;
    }) as T;
  }

  /**
   * Debounce with key (for multiple independent debounced functions)
   */
  debounceByKey<T extends (...args: unknown[]) => unknown>(
    key: string,
    fn: T,
    delay: number = 300
  ): T {
    return ((...args: unknown[]) => {
      // Store args and context for trailing call
      this.lastArgs.set(key, args);

      // Clear existing timer
      const existingTimer = this.timers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Schedule new call
      const timer = setTimeout(() => {
        this.timers.delete(key);
        const args = this.lastArgs.get(key);
        this.lastArgs.delete(key);
        if (args) {
          fn(...args);
        }
      }, delay);

      this.timers.set(key, timer);
    }) as T;
  }

  /**
   * Cancel a pending debounced call
   */
  cancelDebounce(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    this.lastArgs.delete(key);
  }

  /**
   * Flush a pending debounced call immediately
   */
  flushDebounce<T extends (...args: unknown[]) => unknown>(
    key: string,
    fn: T
  ): void {
    this.cancelDebounce(key);
    const args = this.lastArgs.get(key);
    if (args) {
      fn(...args);
      this.lastArgs.delete(key);
    }
  }
}

class ThrottleManager {
  private timers = new Map<string, NodeJS.Timeout>();
  private lastArgs = new Map<string, unknown[]>();

  /**
   * Throttle a function
   * Limits execution to once per interval
   */
  throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    options: ThrottleOptions = {}
  ): T {
    const interval = options.interval ?? 1000;
    const leading = options.leading ?? true;
    const trailing = options.trailing ?? false;

    let timer: NodeJS.Timeout | null = null;
    let lastCallTime = 0;
    let lastResult: unknown;
    let pendingArgs: unknown[] | null = null;

    return ((...args: unknown[]) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime;
      const shouldCall = timeSinceLastCall >= interval;

      // Store args for potential trailing call
      pendingArgs = args;

      // Call on leading edge or if enough time has passed
      if (shouldCall && (leading || !timer)) {
        lastCallTime = now;
        lastResult = fn(...args);
        return lastResult;
      }

      // Schedule trailing edge call if needed
      if (trailing && !timer) {
        timer = setTimeout(() => {
          timer = null;
          lastCallTime = Date.now();
          if (pendingArgs) {
            lastResult = fn(...pendingArgs);
            pendingArgs = null;
          }
        }, interval - timeSinceLastCall);
      }

      return lastResult;
    }) as T;
  }

  /**
   * Throttle by key (for multiple independent throttled functions)
   */
  throttleByKey<T extends (...args: unknown[]) => unknown>(
    key: string,
    fn: T,
    interval: number = 1000
  ): T {
    return ((...args: unknown[]) => {
      // Check if we're within throttle interval
      const existingTimer = this.timers.get(key);
      if (existingTimer) {
        // Store args for potential trailing call
        this.lastArgs.set(key, args);
        return;
      }

      // Execute immediately
      fn(...args);

      // Set up throttle window
      const timer = setTimeout(() => {
        this.timers.delete(key);

        // Check if there are pending args to execute
        const pendingArgs = this.lastArgs.get(key);
        if (pendingArgs) {
          this.lastArgs.delete(key);
          fn(...pendingArgs);

          // Set up another throttle window
          const nextTimer = setTimeout(() => {
            this.timers.delete(key);
          }, interval);

          this.timers.set(key, nextTimer);
        }
      }, interval);

      this.timers.set(key, timer);
    }) as T;
  }

  /**
   * Cancel a throttled function
   */
  cancelThrottle(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    this.lastArgs.delete(key);
  }

  /**
   * Check if function is currently throttled
   */
  isThrottled(key: string): boolean {
    return this.timers.has(key);
  }
}

export const debounceManager = new DebounceManager();
export const throttleManager = new ThrottleManager();

/**
 * Convenience functions
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay?: number
): T {
  return debounceManager.debounce(fn, { delay });
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  interval?: number
): T {
  return throttleManager.throttle(fn, { interval });
}
