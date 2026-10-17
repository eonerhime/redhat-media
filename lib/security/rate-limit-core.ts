// Postgres-backed fixed-window rate limiter (specs/tech-stack.md → Security
// baseline; Phase 7 spec, D8). No in-memory state: every serverless instance
// shares the RateLimitHit table. The server entry point is ./rate-limit.ts;
// this module takes its client and clock as arguments so tests can supply them.

import { createHash } from "node:crypto";
import { z } from "zod";
import type { PrismaClient } from "@/lib/generated/prisma/client";

export type RateLimitOptions = {
  /** Requests allowed per window. */
  max: number;
  /** Window length in seconds. */
  windowSec: number;
};

export type RateLimitResult = {
  allowed: boolean;
  /** Requests left in this window (0 once blocked). */
  remaining: number;
  /** When the current window ends and the count starts again. */
  resetAt: Date;
};

export type RateLimiter = (
  bucket: string,
  key: string,
  options: RateLimitOptions,
) => Promise<RateLimitResult>;

const inputSchema = z.object({
  // e.g. "inquiry", "redhat.cms.mutation"
  bucket: z
    .string()
    .max(64)
    .regex(/^[a-z0-9]+(\.[a-z0-9-]+)*$/),
  key: z.string().min(1).max(512),
  max: z.number().int().positive(),
  windowSec: z.number().int().positive(),
});

/** End of the fixed window that contains `nowMs`. */
export function windowEnd(nowMs: number, windowSec: number): Date {
  const windowMs = windowSec * 1000;
  return new Date((Math.floor(nowMs / windowMs) + 1) * windowMs);
}

/** SHA-256 of salt + key, as 64 hex characters. The raw key is never stored. */
export function hashKey(salt: string, key: string): string {
  return createHash("sha256").update(salt).update(key).digest("hex");
}

export function createRateLimiter(
  db: Pick<PrismaClient, "rateLimitHit">,
  salt: string,
  now: () => Date = () => new Date(),
): RateLimiter {
  if (salt.length < 32) throw new Error("Rate-limit salt must be at least 32 characters");

  return async (bucket, key, options) => {
    const input = inputSchema.parse({ bucket, key, ...options });
    const resetAt = windowEnd(now().getTime(), input.windowSec);
    const where = { bucket: input.bucket, keyHash: hashKey(salt, input.key), windowEnd: resetAt };

    // One INSERT … ON CONFLICT DO UPDATE (Prisma's native upsert), so parallel
    // requests cannot lose a count. Database errors propagate: each caller
    // decides whether to fail open or closed.
    const { count } = await db.rateLimitHit.upsert({
      where: { bucket_keyHash_windowEnd: where },
      create: where,
      update: { count: { increment: 1 } },
      select: { count: true },
    });

    return {
      allowed: count <= input.max,
      remaining: Math.max(0, input.max - count),
      resetAt,
    };
  };
}
