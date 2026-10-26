// Better Auth's rate limiter on our Postgres limiter (Phase 24 spec, D2, D3).
// Better Auth builds each key from the client IP and the path; rateLimit() stores
// it only as a salted SHA-256 hash in RateLimitHit, which the retention job
// purges after 30 days. Better Auth's own rateLimit table is never created.

import type { BetterAuthOptions } from "better-auth";
import type { RateLimiter } from "@/lib/security/rate-limit-core";
import type { SecurityLogger } from "./security-log";

/** Per-IP limits (D3). Every other auth path gets DEFAULT_AUTH_RULE. */
export const AUTH_RATE_RULES = {
  "/sign-in/email": { window: 60, max: 5 },
  "/two-factor/*": { window: 60, max: 5 },
  "/change-password": { window: 600, max: 5 },
  // Disabled until the domain amendment (D10); the limits are ready for it.
  "/request-password-reset": { window: 3600, max: 3 },
  "/reset-password": { window: 3600, max: 3 },
  "/reset-password/*": { window: 3600, max: 3 },
} as const;

export const DEFAULT_AUTH_RULE = { window: 60, max: 30 } as const;

export const AUTH_RATE_BUCKET = "auth";

type RateLimitStorage = NonNullable<NonNullable<BetterAuthOptions["rateLimit"]>["customStorage"]>;

export function createRateLimitStorage(
  limiter: RateLimiter,
  log: SecurityLogger,
  hashForLog: (key: string) => string,
  now: () => number = Date.now,
): RateLimitStorage {
  return {
    async consume(key, rule) {
      const result = await limiter(AUTH_RATE_BUCKET, key, {
        max: rule.max,
        windowSec: rule.window,
      });
      if (result.allowed) return { allowed: true, retryAfter: null };
      log("auth.rate_limited", { keyHash: hashForLog(key) });
      return {
        allowed: false,
        retryAfter: Math.max(1, Math.ceil((result.resetAt.getTime() - now()) / 1000)),
      };
    },
  };
}
