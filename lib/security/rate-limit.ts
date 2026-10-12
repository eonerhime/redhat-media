import "server-only";

import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { createRateLimiter, type RateLimiter } from "./rate-limit-core";

export type { RateLimitOptions, RateLimitResult } from "./rate-limit-core";

let limiter: RateLimiter | undefined;

/**
 * Counts one request for `key` (e.g. a client IP) in `bucket` and reports
 * whether it is within `max` per `windowSec`. Throws on database errors.
 *
 * @example const { allowed } = await rateLimit("inquiry", ip, { max: 5, windowSec: 600 });
 */
export const rateLimit: RateLimiter = (bucket, key, options) => {
  if (!limiter) {
    if (!env.rateLimitSalt) throw new Error("RATE_LIMIT_SALT is not set (see .env.example)");
    limiter = createRateLimiter(getDb(), env.rateLimitSalt);
  }
  return limiter(bucket, key, options);
};
