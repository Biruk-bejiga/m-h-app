import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getServerEnv } from "./env";

type LimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
};

// Simple in-memory fallback (single-instance only).
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowMs: number): LimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, limit, remaining: limit - 1, resetMs: windowMs };
  }
  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  return {
    ok: bucket.count <= limit,
    limit,
    remaining,
    resetMs: Math.max(0, bucket.resetAt - now),
  };
}

let cachedUpstash:
  | { ratelimit: Ratelimit; windowMs: number; limit: number }
  | null
  | undefined;

function getUpstash(limit: number, windowMs: number) {
  if (cachedUpstash !== undefined) return cachedUpstash;
  const env = getServerEnv();
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    cachedUpstash = null;
    return cachedUpstash;
  }

  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  cachedUpstash = {
    ratelimit: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${Math.floor(windowMs / 1000)} s`),
      analytics: true,
      prefix: "mhcb:rl",
    }),
    windowMs,
    limit,
  };

  return cachedUpstash;
}

export async function rateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<LimitResult> {
  const upstash = getUpstash(params.limit, params.windowMs);
  if (!upstash) {
    return memoryLimit(params.key, params.limit, params.windowMs);
  }

  const res = await upstash.ratelimit.limit(params.key);
  return {
    ok: res.success,
    limit: res.limit,
    remaining: res.remaining,
    resetMs: res.reset,
  };
}
