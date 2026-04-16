/**
 * Simple in-memory rate limiter.
 *
 * NOTE: In-memory means limits reset on serverless cold starts and are NOT
 * shared across multiple instances.  This is intentional — it gives a
 * "best-effort" layer against naive abuse without adding a Redis dependency.
 * Upgrade to Upstash / Vercel KV for per-instance enforcement in production.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Prune stale entries every 5 minutes so the Map doesn't grow unbounded.
// (setInterval is a no-op in Edge Runtime but fine in Node.js runtime.)
if (typeof globalThis.setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, e] of store) {
      if (now > e.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

/**
 * Returns `true` if the request is within limits, `false` if rate-limited.
 *
 * @param key      - Bucket key (IP address, userId, etc.)
 * @param limit    - Max requests allowed per window
 * @param windowMs - Window length in milliseconds
 */
export function rateLimit(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

/** Extract the best-available client IP from common proxy headers. */
export function clientIp(req: Request): string {
  const h = req.headers as Headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}
