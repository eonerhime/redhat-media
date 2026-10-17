import { describe, expect, it, vi } from "vitest";
import { createRateLimiter, hashKey, windowEnd } from "./rate-limit-core";

const SALT = "s".repeat(32);

describe("windowEnd", () => {
  it("ends the window at the next multiple of its length", () => {
    expect(windowEnd(Date.parse("2026-10-12T10:00:00.000Z"), 600).toISOString()).toBe(
      "2026-10-12T10:10:00.000Z",
    );
    expect(windowEnd(Date.parse("2026-10-12T10:09:59.999Z"), 600).toISOString()).toBe(
      "2026-10-12T10:10:00.000Z",
    );
  });

  it("starts a new window exactly at the boundary", () => {
    expect(windowEnd(Date.parse("2026-10-12T10:10:00.000Z"), 600).toISOString()).toBe(
      "2026-10-12T10:20:00.000Z",
    );
  });
});

describe("hashKey", () => {
  it("is 64 hex characters and never contains the key", () => {
    const hash = hashKey(SALT, "203.0.113.7");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("203.0.113.7");
  });

  it("depends on the salt", () => {
    expect(hashKey(SALT, "k")).not.toBe(hashKey("t".repeat(32), "k"));
  });
});

describe("createRateLimiter input checks", () => {
  const db = { rateLimitHit: { upsert: vi.fn() } };
  const limit = createRateLimiter(db as never, SALT);

  it("refuses a short salt", () => {
    expect(() => createRateLimiter(db as never, "short")).toThrow(/salt/);
  });

  it.each([
    ["an upper-case bucket", "Inquiry", "k", { max: 1, windowSec: 1 }],
    ["an empty bucket", "", "k", { max: 1, windowSec: 1 }],
    ["an empty key", "inquiry", "", { max: 1, windowSec: 1 }],
    ["max 0", "inquiry", "k", { max: 0, windowSec: 1 }],
    ["a fractional window", "inquiry", "k", { max: 1, windowSec: 0.5 }],
  ])("rejects %s before touching the database", async (_, bucket, key, options) => {
    await expect(limit(bucket, key, options)).rejects.toThrow();
    expect(db.rateLimitHit.upsert).not.toHaveBeenCalled();
  });
});
