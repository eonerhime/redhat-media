import { describe, expect, it, vi } from "vitest";
import { fakeStaff } from "@/lib/auth/testing/fakes";
import type { RateLimiter } from "@/lib/security/rate-limit-core";
import {
  CONTENT_RATE_LIMIT,
  contentErrors,
  parseContentUpdate,
  updateContentBlockCore,
  type UpdateContentDeps,
} from "./update-core";

// updateContentBlock's checks before the database (Phase 27 spec, D4, D5, D8).
// update-core.db.test.ts covers the writes.

describe("parseContentUpdate()", () => {
  it("accepts a listed key and trims the value", () => {
    expect(parseContentUpdate("home.hero.tagline", "  New tagline. \r\n")).toEqual({
      ok: true,
      key: "home.hero.tagline",
      value: "New tagline.",
    });
  });

  it("refuses a key outside the pattern, an unlisted key and a non-string", () => {
    for (const key of ["home.hero.tagline<x>", "admin.panel", "toString", 7, undefined])
      expect(parseContentUpdate(key, "x")).toEqual({ ok: false, error: contentErrors.notEditable });
    expect(parseContentUpdate("home.meta.description", "x")).toEqual({
      ok: false,
      error: contentErrors.notEditable,
    });
    expect(parseContentUpdate("home.hero.tagline", 5)).toEqual({
      ok: false,
      error: contentErrors.notEditable,
    });
  });

  it.each([
    ["home.cta.button", 40],
    ["home.hero.tagline", 120],
    ["home.hero.subtext", 300],
    ["about.story.body", 5000],
  ])("caps %s at %i characters, after trimming", (key, max) => {
    expect(parseContentUpdate(key, `  ${"a".repeat(max)}  `).ok).toBe(true);
    expect(parseContentUpdate(key, "a".repeat(max + 1))).toEqual({
      ok: false,
      error: contentErrors.tooLong(max),
    });
  });

  it("allows line breaks in body blocks only", () => {
    expect(parseContentUpdate("about.story.body", "One.\r\nTwo.")).toEqual({
      ok: true,
      key: "about.story.body",
      value: "One.\nTwo.",
    });
    expect(parseContentUpdate("home.hero.tagline", "One.\nTwo.")).toEqual({
      ok: false,
      error: contentErrors.oneLine,
    });
  });

  it("passes an empty value through, as a reset", () => {
    expect(parseContentUpdate("home.hero.tagline", "   ")).toEqual({
      ok: true,
      key: "home.hero.tagline",
      value: "",
    });
  });
});

function deps(rateLimit: RateLimiter = async () => allowed) {
  const db = { $transaction: vi.fn() };
  const refresh = vi.fn();
  return { db, refresh, deps: { db, rateLimit, refresh } as unknown as UpdateContentDeps };
}
const allowed = { allowed: true, remaining: 59, resetAt: new Date() };

describe("updateContentBlockCore() before the database", () => {
  it.each([
    ["signed out", null, {}],
    ["sales", "sales", {}],
    ["an editor without 2FA", "editor", { session: { twoFactorEnabled: false } }],
  ] as const)("refuses %s without counting or writing", async (_name, role, options) => {
    const guard = await fakeStaff(role, options).requireRole("editor");
    const rateLimit = vi.fn<RateLimiter>();
    const { db, refresh, deps: d } = deps(rateLimit);
    expect(await updateContentBlockCore(guard, "home.hero.tagline", "x", d)).toEqual({
      ok: false,
      error: contentErrors.refused,
    });
    expect(rateLimit).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("counts the save against the editor's own limit (D8)", async () => {
    const guard = await fakeStaff("editor").requireRole("editor");
    const rateLimit = vi.fn<RateLimiter>(async () => allowed);
    const { deps: d } = deps(rateLimit);
    await updateContentBlockCore(guard, "home.meta.description", "x", d);
    expect(rateLimit).toHaveBeenCalledWith("content", "user-1", CONTENT_RATE_LIMIT);
    expect(CONTENT_RATE_LIMIT).toEqual({ max: 60, windowSec: 600 });
  });

  it("refuses over the limit, and when the limiter fails, without writing", async () => {
    const guard = await fakeStaff("admin").requireRole("editor");
    for (const [rateLimit, error] of [
      [async () => ({ ...allowed, allowed: false }), contentErrors.rateLimited],
      [
        async () => {
          throw new Error("db down");
        },
        contentErrors.failed,
      ],
    ] as const) {
      const { db, deps: d } = deps(rateLimit);
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(await updateContentBlockCore(guard, "home.hero.tagline", "x", d)).toEqual({
        ok: false,
        error,
      });
      spy.mockRestore();
      expect(db.$transaction).not.toHaveBeenCalled();
    }
  });

  it("returns the parse refusal without writing", async () => {
    const guard = await fakeStaff("editor").requireRole("editor");
    const { db, deps: d } = deps();
    expect(await updateContentBlockCore(guard, "home.cta.button", "a".repeat(41), d)).toEqual({
      ok: false,
      error: contentErrors.tooLong(40),
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
