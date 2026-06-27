/**
 * Best-effort in-memory sliding-window rate limiter. A cheap first line of
 * defence against burst abuse of PUBLIC endpoints (e.g. donation bill creation).
 *
 * NOTE: on serverless this state is per-instance, so it is NOT a hard global
 * guarantee — for that, back it with a shared store (Upstash/Redis). It still
 * meaningfully throttles a single abusive client hitting a warm instance.
 */
const buckets = new Map();

export function rateLimit(key, { limit = 10, windowMs = 60000 } = {}) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  buckets.set(key, hits);

  // Opportunistic cleanup so the map can't grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (!v.length || now - v[v.length - 1] > windowMs) buckets.delete(k);
    }
  }

  return { allowed: hits.length <= limit, remaining: Math.max(0, limit - hits.length) };
}
