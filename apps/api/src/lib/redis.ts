import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "../utils/logger";

/**
 * Redis is optional infrastructure (per project spec). When REDIS_URL isn't
 * set we run with `redis === null` and every caller falls back to doing the
 * real DB read instead of caching it — the app must work identically either
 * way, just faster with Redis present.
 */
export const redis = env.REDIS_URL ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: true }) : null;

let hasWarnedUnavailable = false;

export async function connectRedis() {
  if (!redis) {
    logger.warn("REDIS_URL not set - running without caching/rate-limit store");
    return;
  }
  try {
    await redis.connect();
    logger.info("Connected to Redis");
  } catch (err) {
    if (!hasWarnedUnavailable) {
      logger.warn("Redis connection failed - continuing without cache", { error: (err as Error).message });
      hasWarnedUnavailable = true;
    }
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis || redis.status !== "ready") return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redis || redis.status !== "ready") return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Caching is a performance optimization, never a hard dependency.
  }
}

export async function cacheDeleteByPrefix(prefix: string): Promise<void> {
  if (!redis || redis.status !== "ready") return;
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(keys);
  } catch {
    // Best-effort invalidation only.
  }
}
