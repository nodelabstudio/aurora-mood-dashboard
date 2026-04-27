// Upstash sliding-window rate limit for /api/vibe
// 3 requests / minute / IP, 20 / day / IP
//
// If Upstash isn't configured (UPSTASH_REDIS_REST_URL / _TOKEN missing),
// this no-ops — every request is allowed through. Acceptable for dev or
// for portfolio-traffic levels where the LLM provider's own rate limits
// are sufficient protection.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function upstashConfigured(): boolean {
  return !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
}

// Lazy init so the module can be imported without env vars present
// (so `next build` doesn't fail before the user fills .env.local).
let _instances: { minute: Ratelimit; daily: Ratelimit } | null = null;

function instances() {
  if (_instances) return _instances;
  const redis = Redis.fromEnv();
  _instances = {
    minute: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 m"),
      prefix: "aurora:vibe:min",
      analytics: true,
    }),
    daily: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 d"),
      prefix: "aurora:vibe:day",
      analytics: true,
    }),
  };
  return _instances;
}

export async function checkLimits(
  ip: string,
): Promise<{ ok: true } | { ok: false; reason: "minute" | "day" }> {
  if (!upstashConfigured()) return { ok: true };
  const { minute, daily } = instances();
  const m = await minute.limit(ip);
  if (!m.success) return { ok: false, reason: "minute" };
  const d = await daily.limit(ip);
  if (!d.success) return { ok: false, reason: "day" };
  return { ok: true };
}
