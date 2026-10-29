import { createHash } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { describe, expect, it, vi } from "vitest";
import { fakeStaff } from "@/lib/auth/testing/fakes";
import type { RateLimiter } from "@/lib/security/rate-limit-core";
import {
  isOwnUpload,
  MEDIA_RATE_LIMIT,
  mediaErrors,
  signUploadCore,
  uploadEnv,
  type Signer,
} from "./sign-core";
import { MEDIA_SLOTS } from "./slots";

// signCloudinaryUpload's logic and the upload-path rule (Phase 28 spec, D6, D9, D10).

// Test-only values: not a real key or secret.
const SECRET = "test-secret-not-real";
const signer: Signer = {
  cloudName: "test-cloud",
  apiKey: "000000000000000",
  sign: (params) => cloudinary.utils.api_sign_request(params, SECRET),
};
const allowed = { allowed: true, remaining: 29, resetAt: new Date() };

function deps(overrides: Partial<Parameters<typeof signUploadCore>[2]> = {}) {
  return {
    rateLimit: (async () => allowed) as RateLimiter,
    signer,
    env: "preview" as const,
    now: () => 1_700_000_000,
    randomName: () => "Fixed_name-1",
    ...overrides,
  };
}

describe("uploadEnv()", () => {
  it("maps VERCEL_ENV to the public ID's environment segment", () => {
    expect(uploadEnv("production")).toBe("production");
    expect(uploadEnv("preview")).toBe("preview");
    expect(uploadEnv("development")).toBe("local");
    expect(uploadEnv(undefined)).toBe("local");
  });
});

describe("isOwnUpload()", () => {
  it("accepts this environment's upload to the slot", () => {
    expect(isOwnUpload("home.hero", "preview", "rhm/page/home-hero/preview/k3x9_A-b")).toBe(true);
  });

  it.each([
    ["the default", MEDIA_SLOTS["home.hero"].default.publicId],
    ["the owner's default", "rhm/page/home-hero/default"],
    ["another environment's upload", "rhm/page/home-hero/production/k3x9"],
    ["another slot's folder", "rhm/page/about-hero/preview/k3x9"],
    ["a nested path", "rhm/page/home-hero/preview/a/b"],
    ["a parent segment", "rhm/page/home-hero/preview/../production/k3x9"],
    ["a full URL", "https://res.cloudinary.com/x/image/upload/rhm/page/home-hero/preview/k3x9"],
    ["the folder itself", "rhm/page/home-hero/preview/"],
    ["a non-string", 7],
  ])("refuses %s", (_name, publicId) => {
    expect(isOwnUpload("home.hero", "preview", publicId)).toBe(false);
  });
});

describe("signUploadCore()", () => {
  it("matches Cloudinary's documented example signature", () => {
    // Cloudinary docs, Authentication signatures → Minimal signed HTTP upload.
    expect(cloudinary.utils.api_sign_request({ timestamp: 1315060510 }, "abcd")).toBe(
      "a21ad0f63beb4de2e5575204b79ab90bffb02c10",
    );
  });

  it("picks the public ID and signs it with the folder, formats and timestamp (D6)", async () => {
    const guard = await fakeStaff("editor").requireRole("editor");
    const result = await signUploadCore(guard, "home.hero", deps());
    expect(result).toEqual({
      ok: true,
      upload: {
        cloudName: "test-cloud",
        apiKey: "000000000000000",
        publicId: "rhm/page/home-hero/preview/Fixed_name-1",
        assetFolder: "rhm/page/home-hero/preview",
        allowedFormats: "jpg,png,webp,avif",
        timestamp: 1_700_000_000,
        signature: expect.any(String),
      },
    });
    // The same signature by hand: sorted parameters, then the secret, SHA-1.
    const toSign =
      "allowed_formats=jpg,png,webp,avif&asset_folder=rhm/page/home-hero/preview" +
      "&public_id=rhm/page/home-hero/preview/Fixed_name-1&timestamp=1700000000";
    const expected = createHash("sha1")
      .update(toSign + SECRET)
      .digest("hex");
    expect(result.ok && result.upload.signature).toBe(expected);
    expect(JSON.stringify(result)).not.toContain(SECRET);
  });

  it("picks a fresh random name that the attach rule accepts", async () => {
    const guard = await fakeStaff("editor").requireRole("editor");
    const rest = { ...deps(), randomName: undefined };
    const a = await signUploadCore(guard, "home.hero", rest);
    const b = await signUploadCore(guard, "home.hero", rest);
    if (!a.ok || !b.ok) throw new Error("expected signed uploads");
    expect(a.upload.publicId).not.toBe(b.upload.publicId);
    expect(isOwnUpload("home.hero", "preview", a.upload.publicId)).toBe(true);
  });

  it.each([
    ["signed out", null, {}],
    ["sales", "sales", {}],
    ["an editor without 2FA", "editor", { session: { twoFactorEnabled: false } }],
  ] as const)("refuses %s without counting", async (_name, role, options) => {
    const guard = await fakeStaff(role, options).requireRole("editor");
    const rateLimit = vi.fn<RateLimiter>();
    expect(await signUploadCore(guard, "home.hero", deps({ rateLimit }))).toEqual({
      ok: false,
      error: mediaErrors.refused,
    });
    expect(rateLimit).not.toHaveBeenCalled();
  });

  it("counts against the editor's shared media allowance (D9)", async () => {
    const guard = await fakeStaff("editor").requireRole("editor");
    const rateLimit = vi.fn<RateLimiter>(async () => allowed);
    await signUploadCore(guard, "home.hero", deps({ rateLimit }));
    expect(rateLimit).toHaveBeenCalledWith("media", "user-1", MEDIA_RATE_LIMIT);
    expect(MEDIA_RATE_LIMIT).toEqual({ max: 30, windowSec: 600 });
    expect(
      await signUploadCore(
        guard,
        "home.hero",
        deps({ rateLimit: async () => ({ ...allowed, allowed: false }) }),
      ),
    ).toEqual({ ok: false, error: mediaErrors.rateLimited });
  });

  it.each(["about.hero", "toString", "", 7, undefined])("refuses the slot %j", async (slot) => {
    const guard = await fakeStaff("editor").requireRole("editor");
    expect(await signUploadCore(guard, slot, deps())).toEqual({
      ok: false,
      error: mediaErrors.notEditable,
    });
  });

  it("refuses when the site has no signing key", async () => {
    const guard = await fakeStaff("editor").requireRole("editor");
    expect(await signUploadCore(guard, "home.hero", deps({ signer: undefined }))).toEqual({
      ok: false,
      error: mediaErrors.notConfigured,
    });
  });
});
