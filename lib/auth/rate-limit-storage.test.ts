import { describe, expect, it, vi } from "vitest";
import type { RateLimiter } from "@/lib/security/rate-limit-core";
import { AUTH_RATE_BUCKET, AUTH_RATE_RULES, createRateLimitStorage } from "./rate-limit-storage";

const NOW = Date.UTC(2026, 9, 26, 12, 0, 0);

function setup(allowed: boolean) {
  const limiter = vi.fn<RateLimiter>(async () => ({
    allowed,
    remaining: allowed ? 1 : 0,
    resetAt: new Date(NOW + 42_500),
  }));
  const log = vi.fn();
  const storage = createRateLimitStorage(
    limiter,
    log,
    (key) => `hash(${key.length})`,
    () => NOW,
  );
  return { limiter, log, storage };
}

describe("Better Auth rate-limit storage (Phase 24 spec, D2, D3)", () => {
  it("passes the key and rule to rateLimit() in the auth bucket", async () => {
    const { limiter, storage } = setup(true);
    await storage.consume("203.0.113.9/sign-in/email", { window: 60, max: 5 });
    expect(limiter).toHaveBeenCalledWith(AUTH_RATE_BUCKET, "203.0.113.9/sign-in/email", {
      max: 5,
      windowSec: 60,
    });
  });

  it("allows within the limit, with no log line", async () => {
    const { log, storage } = setup(true);
    await expect(storage.consume("k", { window: 60, max: 5 })).resolves.toEqual({
      allowed: true,
      retryAfter: null,
    });
    expect(log).not.toHaveBeenCalled();
  });

  it("refuses over the limit with whole seconds to wait, and logs only a hash", async () => {
    const { log, storage } = setup(false);
    await expect(
      storage.consume("203.0.113.9/sign-in/email", { window: 60, max: 5 }),
    ).resolves.toEqual({
      allowed: false,
      retryAfter: 43,
    });
    expect(log).toHaveBeenCalledWith("auth.rate_limited", { keyHash: "hash(25)" });
    expect(JSON.stringify(log.mock.calls)).not.toContain("203.0.113.9");
  });

  it("is strict on sign-in, 2FA and password changes", () => {
    expect(AUTH_RATE_RULES["/sign-in/email"]).toEqual({ window: 60, max: 5 });
    expect(AUTH_RATE_RULES["/two-factor/*"]).toEqual({ window: 60, max: 5 });
    expect(AUTH_RATE_RULES["/change-password"]).toEqual({ window: 600, max: 5 });
  });
});
