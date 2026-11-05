
import { useEffect, useState } from "react";
import type { CacheManager, CacheStats } from "../utils/cache-manager";

export interface UseCacheStatsOptions {
  readonly pollIntervalMs?: number;
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
