/**
 * useCacheStats Hook
 * @description React hook that exposes dynamic, real-time statistics
 *              of the active CacheManager. The numbers are computed
 *              on every interval tick — no value is hardcoded.
 *
 * @example
 * ```tsx
 * function CacheDebug() {
 *   const stats = useCacheStats({ pollIntervalMs: 2000 });
 *   return <pre>{JSON.stringify(stats, null, 2)}</pre>;
 * }
 * ```
 */

import { useEffect, useState } from "react";
import type { CacheManager, CacheStats } from "../utils/cache-manager";

export interface UseCacheStatsOptions {
  /** Polling interval in milliseconds. Default 1000. */
  readonly pollIntervalMs?: number;
  /** When false, polling is paused and the last snapshot is returned. */
  readonly enabled?: boolean;
}

const DEFAULT_POLL_INTERVAL_MS = 1000;

export function useCacheStats(
  cache: CacheManager,
  options: UseCacheStatsOptions = {},
): CacheStats {
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const enabled = options.enabled ?? true;

  const [snapshot, setSnapshot] = useState<CacheStats>(() => cache.getStats());

  useEffect(() => {
    if (!enabled) return;
    setSnapshot(cache.getStats());
    const intervalId = setInterval(() => {
      setSnapshot(cache.getStats());
    }, pollIntervalMs);
    return () => clearInterval(intervalId);
  }, [cache, pollIntervalMs, enabled]);

  return snapshot;
}
