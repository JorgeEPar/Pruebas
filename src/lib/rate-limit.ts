// Rate limit en memoria para el MVP (se reinicia al redeploy).
// Al escalar: mover a Redis (Upstash o el contenedor local).
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterSec: number;
} {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now >= entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}
