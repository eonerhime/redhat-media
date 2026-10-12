import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { testPrisma } from "@/lib/db/test-client";
import { createRateLimiter, hashKey } from "./rate-limit-core";

// Roadmap Phase 7 "Done when": request N+1 inside the window is blocked and
// the window resets (Phase 7 spec, D8, D9). Runs as rhm_app.

const SALT = "test-salt-".padEnd(32, "x");
const db = testPrisma();
const RUN = randomUUID().slice(0, 8);
let n = 0;
const bucket = () => `test.${RUN}-${++n}`;

afterAll(async () => {
  await db.rateLimitHit.deleteMany({ where: { bucket: { startsWith: `test.${RUN}-` } } });
  await db.$disconnect();
});

describe("rateLimit (Postgres)", () => {
  it("allows N requests in a window and blocks request N+1", async () => {
    const limit = createRateLimiter(db, SALT);
    const b = bucket();
    const results = [];
    for (let i = 0; i < 4; i++)
      results.push(await limit(b, "203.0.113.7", { max: 3, windowSec: 600 }));

    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0]);
    expect(new Set(results.map((r) => r.resetAt.getTime())).size).toBe(1);
  });

  it("starts counting again when the window resets", async () => {
    let now = new Date("2026-10-12T10:00:05.000Z");
    const limit = createRateLimiter(db, SALT, () => now);
    const b = bucket();
    const options = { max: 2, windowSec: 60 };

    await limit(b, "k", options);
    await limit(b, "k", options);
    const blocked = await limit(b, "k", options);
    expect(blocked.allowed).toBe(false);
    expect(blocked.resetAt.toISOString()).toBe("2026-10-12T10:01:00.000Z");

    now = blocked.resetAt;
    const next = await limit(b, "k", options);
    expect(next).toEqual({
      allowed: true,
      remaining: 1,
      resetAt: new Date("2026-10-12T10:02:00.000Z"),
    });
  });

  it("counts buckets and keys independently", async () => {
    const limit = createRateLimiter(db, SALT);
    const [b1, b2] = [bucket(), bucket()];
    const options = { max: 1, windowSec: 600 };

    expect((await limit(b1, "a", options)).allowed).toBe(true);
    expect((await limit(b1, "a", options)).allowed).toBe(false);
    expect((await limit(b1, "b", options)).allowed).toBe(true);
    expect((await limit(b2, "a", options)).allowed).toBe(true);
  });

  it("loses no count under concurrency: 25 parallel calls with max 10 allow exactly 10", async () => {
    const limit = createRateLimiter(db, SALT);
    const b = bucket();
    const results = await Promise.all(
      Array.from({ length: 25 }, () => limit(b, "burst", { max: 10, windowSec: 600 })),
    );

    expect(results.filter((r) => r.allowed)).toHaveLength(10);
    const row = await db.rateLimitHit.findFirstOrThrow({ where: { bucket: b } });
    expect(row.count).toBe(25);
  });

  it("stores a salted SHA-256 of the key, never the key itself", async () => {
    const limit = createRateLimiter(db, SALT);
    const b = bucket();
    await limit(b, "198.51.100.23", { max: 5, windowSec: 600 });

    const rows = await db.rateLimitHit.findMany({ where: { bucket: b } });
    expect(rows).toHaveLength(1);
    expect(rows[0].keyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(rows[0].keyHash).toBe(hashKey(SALT, "198.51.100.23"));
    expect(JSON.stringify(rows)).not.toContain("198.51.100.23");
  });
});
