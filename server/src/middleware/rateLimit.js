/** Minimal in-memory rate limiter (per IP + route). Good enough for a single instance. */
const buckets = new Map();

/** `name` shares one bucket across a route's paths (e.g. every /orders/:number), instead of one per path. */
export function rateLimit({ windowMs = 60_000, max = 30, name } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${name || `${req.baseUrl}${req.path}`}`;
    const now = Date.now();
    // Bound memory: if something floods us with distinct keys, start over rather than grow forever.
    if (!buckets.has(key) && buckets.size > 50_000) buckets.clear();
    const bucket = buckets.get(key) || { count: 0, reset: now + windowMs };
    if (now > bucket.reset) {
      bucket.count = 0;
      bucket.reset = now + windowMs;
    }
    bucket.count += 1;
    buckets.set(key, bucket);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - bucket.count));
    if (bucket.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please slow down a little.' });
    }
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (now > bucket.reset + 60_000) buckets.delete(key);
}, 120_000).unref();
