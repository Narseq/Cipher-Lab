interface Bucket {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Bucket>();

/**
 * Fixed-window counter kept in memory: enough for a single-instance deployment. Returns false
 * once `limit` hits were recorded for `key` within `windowMs`.
 */
export function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    prune(now);
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

function prune(now: number) {
  if (windows.size < 5000) return;
  for (const [key, bucket] of windows) if (bucket.resetAt <= now) windows.delete(key);
}

export function resetRateLimits() {
  windows.clear();
}
