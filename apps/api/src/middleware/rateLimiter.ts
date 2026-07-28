import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../lib/redis";
import { ApiError } from "../utils/ApiError";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

/**
 * Falls back to express-rate-limit's in-memory store when Redis isn't
 * configured (fine for a single dev instance; a real multi-instance
 * deployment should always set REDIS_URL so limits are shared).
 */
export function createRateLimiter({ windowMs, max, keyPrefix }: RateLimitOptions) {
  const redisClient = redis;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store:
      redisClient && redisClient.status !== "end"
        ? new RedisStore({
            prefix: `rl:${keyPrefix}:`,
            // ioredis's overloaded `call` signature can't accept a plain
            // string[] spread without widening to `any` - this is the
            // pattern rate-limit-redis's own docs use.
            sendCommand: (...args: string[]) =>
              (redisClient as unknown as { call: (...a: string[]) => Promise<never> }).call(...args),
          })
        : undefined,
    handler: (_req, _res, next) => {
      next(ApiError.tooManyRequests());
    },
  });
}

// Tiered limits: auth and checkout endpoints are the highest-value targets
// for credential stuffing / abuse, so they get much tighter windows than
// general browsing traffic.
export const authRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: "auth" });
export const checkoutRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: "checkout" });
export const generalApiRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 600, keyPrefix: "general" });
