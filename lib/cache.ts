// Narration cache — keyed on (city, condition, hour-bucket)
// 30-minute TTL. Same context within the same hour returns the same vibe
// without spending tokens.
//
// If Upstash isn't configured (UPSTASH_REDIS_REST_URL / _TOKEN missing),
// the cache no-ops — every request goes through to Groq. The vibe panel
// still works, you just spend tokens on every hour-bucket transition.

import { Redis } from "@upstash/redis";

function upstashConfigured(): boolean {
  return !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
}

let _redis: Redis | null = null;
function redis(): Redis {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

const TTL_SECONDS = 30 * 60;

function cacheKey(city: string, condition: string, hour: number): string {
  return `aurora:vibe:cache:${city.toLowerCase()}:${condition}:${hour}`;
}

export async function getCachedVibe(
  city: string,
  condition: string,
  hour: number,
): Promise<string | null> {
  if (!upstashConfigured()) return null;
  return redis().get<string>(cacheKey(city, condition, hour));
}

export async function setCachedVibe(
  city: string,
  condition: string,
  hour: number,
  vibe: string,
): Promise<void> {
  if (!upstashConfigured()) return;
  await redis().set(cacheKey(city, condition, hour), vibe, { ex: TTL_SECONDS });
}
