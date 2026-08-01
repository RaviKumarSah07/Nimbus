import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../lib/redis";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

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
    // The integration test suite legitimately performs many more
    // register/login calls per run than a real client would in the same
    // window - rate limiting itself is exercised by unit-level assertions
    // instead of by tripping the real limiter here.
    skip: () => env.NODE_ENV === "test",
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
// Refresh deliberately sits well above the credential endpoints. It isn't a
// guessing target - it presents an opaque token that reuse detection already
// guards - but it fires on every cold page load and whenever the 15-minute
// access token lapses, so an ordinary shopping session reaches double digits
// on its own. Sharing the credential limit meant a browsing user could spend
// it and have their next refresh 429, which the client reads as a dead
// session: signed out mid-purchase for doing nothing wrong.
export const refreshRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 120, keyPrefix: "refresh" });
export const checkoutRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: "checkout" });
export const generalApiRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 600, keyPrefix: "general" });
