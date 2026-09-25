// Rate limit en memoria para el MVP (se reinicia al redeploy).
// Al escalar: mover a Redis (Upstash o el contenedor local).
const WINDOW_MS = 60_000;
const DEFAULT_MAX = 10;

const hits = new Map<string, { count: number; resetAt: number }>();

function purge(now: number) {
  if (hits.size <= 1000) return;
  for (const [key, entry] of hits) {
    if (now >= entry.resetAt) hits.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  max: number = DEFAULT_MAX,
): {
  allowed: boolean;
  retryAfterSec: number;
} {
  const now = Date.now();
  purge(now);
  const entry = hits.get(key);
  if (!entry || now >= entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  entry.count += 1;
  if (entry.count > max) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}
