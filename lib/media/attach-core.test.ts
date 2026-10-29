import { describe, expect, it, vi } from "vitest";
import { fakeStaff } from "@/lib/auth/testing/fakes";
import type { RateLimiter } from "@/lib/security/rate-limit-core";
import {
  attachMediaCore,
  parseAlt,
  removeMediaCore,
  type CloudinaryAdmin,
  type MediaDeps,
} from "./attach-core";
import { MAX_UPLOAD_BYTES, mediaErrors } from "./sign-core";
import { MEDIA_SLOTS } from "./slots";

// attachMedia's and removeMedia's checks before the transaction (Phase 28 spec, D9, D10).
// attach-core.db.test.ts covers the writes, the audit and the destroy rule.

const NEW = "rhm/page/home-hero/preview/new_upload";
const allowed = { allowed: true, remaining: 29, resetAt: new Date() };

function fakeCloudinary(resource: Partial<Awaited<ReturnType<CloudinaryAdmin["resource"]>>> = {}) {
  return {
    resource: vi.fn(async () => ({
      resource_type: "image",
      format: "jpg",
      bytes: 1000,
      ...resource,
    })),
    destroy: vi.fn(async () => ({ result: "ok" })),
  };
}

function deps(overrides: Partial<MediaDeps> = {}) {
  const db = {
    $transaction: vi.fn(),
    mediaItem: { findFirst: vi.fn(async () => null) },
  };
  const cloudinary = fakeCloudinary();
  const refresh = vi.fn();
  const d = {
    db,
    rateLimit: (async () => allowed) as RateLimiter,
    cloudinary,
    env: "preview",
    refresh,
    ...overrides,
  } as unknown as MediaDeps;
  return { db, cloudinary, refresh, d };
}

const editor = () => fakeStaff("editor").requireRole("editor");

describe("parseAlt()", () => {
  it("trims, and allows 1–150 characters on one line", () => {
    expect(parseAlt("  A studio at dusk. ")).toEqual({ ok: true, alt: "A studio at dusk." });
    expect(parseAlt("a".repeat(150)).ok).toBe(true);
  });

  it.each([
    ["empty", "", mediaErrors.altRequired],
    ["blank", "   ", mediaErrors.altRequired],
    ["not a string", 5, mediaErrors.altRequired],
    ["151 characters", "a".repeat(151), mediaErrors.altTooLong],
    ["a line break", "One\nTwo", mediaErrors.altOneLine],
    ["a carriage return", "One\rTwo", mediaErrors.altOneLine],
  ])("refuses %s", (_name, alt, error) => {
    expect(parseAlt(alt)).toEqual({ ok: false, error });
  });
});

describe("attachMediaCore() before the database", () => {
  it.each([
    ["signed out", null, {}],
    ["sales", "sales", {}],
    ["an editor without 2FA", "editor", { session: { twoFactorEnabled: false } }],
  ] as const)(
    "refuses %s without counting, reading or calling Cloudinary",
    async (_n, role, opt) => {
      const guard = await fakeStaff(role, opt).requireRole("editor");
      const rateLimit = vi.fn<RateLimiter>();
      const { db, cloudinary, d } = deps({ rateLimit });
      expect(await attachMediaCore(guard, "home.hero", NEW, "Alt", d)).toEqual({
        ok: false,
        error: mediaErrors.refused,
      });
      expect(await removeMediaCore(guard, "home.hero", d)).toEqual({
        ok: false,
        error: mediaErrors.refused,
      });
      expect(rateLimit).not.toHaveBeenCalled();
      expect(db.mediaItem.findFirst).not.toHaveBeenCalled();
      expect(cloudinary.resource).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["an unlisted slot", "about.hero", NEW],
    ["a public ID in another folder", "home.hero", "rhm/page/about-hero/preview/x"],
    ["another environment's upload", "home.hero", "rhm/page/home-hero/production/x"],
    ["a parent segment", "home.hero", "rhm/page/home-hero/preview/../production/x"],
    ["a full URL", "home.hero", `https://res.cloudinary.com/c/image/upload/${NEW}`],
    ["a non-string ID", "home.hero", 7],
  ])("refuses %s before Cloudinary or the transaction", async (_name, slot, publicId) => {
    const { db, cloudinary, d } = deps();
    expect(await attachMediaCore(await editor(), slot, publicId, "Alt", d)).toEqual({
      ok: false,
      error: mediaErrors.notEditable,
    });
    expect(cloudinary.resource).not.toHaveBeenCalled();
    expect(cloudinary.destroy).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("refuses bad alt text before Cloudinary", async () => {
    const { cloudinary, d } = deps();
    expect(await attachMediaCore(await editor(), "home.hero", NEW, " ", d)).toEqual({
      ok: false,
      error: mediaErrors.altRequired,
    });
    expect(cloudinary.resource).not.toHaveBeenCalled();
  });

  it.each([
    ["too large", { bytes: MAX_UPLOAD_BYTES + 1 }],
    ["a HEIC file", { format: "heic" }],
    ["a GIF", { format: "gif" }],
    ["not an image", { resource_type: "raw" }],
    ["missing its size", { bytes: undefined }],
  ])("destroys and refuses an upload that is %s, writing nothing", async (_name, resource) => {
    const cloudinary = fakeCloudinary(resource);
    const { db, refresh, d } = deps({ cloudinary });
    expect(await attachMediaCore(await editor(), "home.hero", NEW, "Alt", d)).toEqual({
      ok: false,
      error: mediaErrors.badFile,
    });
    expect(cloudinary.resource).toHaveBeenCalledWith(NEW);
    expect(cloudinary.destroy).toHaveBeenCalledWith(NEW);
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("accepts the limit itself", async () => {
    const cloudinary = fakeCloudinary({ bytes: MAX_UPLOAD_BYTES, format: "avif" });
    const { db, d } = deps({ cloudinary });
    db.$transaction.mockResolvedValue(MEDIA_SLOTS["home.hero"].default);
    expect(await attachMediaCore(await editor(), "home.hero", NEW, "Alt", d)).toEqual({ ok: true });
    expect(cloudinary.destroy).not.toHaveBeenCalled();
  });

  it("refuses an upload Cloudinary can't find, and destroys nothing", async () => {
    const cloudinary = fakeCloudinary();
    cloudinary.resource.mockRejectedValue({
      error: { message: "Resource not found", http_code: 404 },
    });
    const { db, d } = deps({ cloudinary });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await attachMediaCore(await editor(), "home.hero", NEW, "Alt", d)).toEqual({
      ok: false,
      error: mediaErrors.notFound,
    });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Resource not found"));
    spy.mockRestore();
    expect(cloudinary.destroy).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("refuses a new upload when the site has no Cloudinary key", async () => {
    const { db, d } = deps({ cloudinary: undefined });
    expect(await attachMediaCore(await editor(), "home.hero", NEW, "Alt", d)).toEqual({
      ok: false,
      error: mediaErrors.notConfigured,
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("writes nothing when the default's own alt text is saved unchanged", async () => {
    const { publicId, alt } = MEDIA_SLOTS["home.hero"].default;
    const { db, cloudinary, refresh, d } = deps();
    expect(await attachMediaCore(await editor(), "home.hero", publicId, alt, d)).toEqual({
      ok: true,
    });
    expect(cloudinary.resource).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("removeMediaCore() before the database", () => {
  it("refuses an unlisted slot", async () => {
    const { db, d } = deps();
    expect(await removeMediaCore(await editor(), "about.hero", d)).toEqual({
      ok: false,
      error: mediaErrors.notEditable,
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
