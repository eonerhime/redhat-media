// signCloudinaryUpload's logic (Phase 28 spec, D6, D9). The guard's result, the limiter, the
// signer and the clock are arguments, so sign-core.test.ts runs it without a request or a secret;
// actions.ts wires it up after `await requireRole(...)`, which must stay the action's first
// statement (Phase 25 spec, D11). The upload helpers below are shared with attach-core.ts.

import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { GuardResult } from "@/lib/auth/guard-core";
import type { RateLimiter } from "@/lib/security/rate-limit-core";
import { isMediaSlot, MEDIA_SLOTS, type MediaSlot } from "./slots";
import { mediaErrors, UPLOAD_FORMATS } from "./upload-rules";

export { MAX_UPLOAD_BYTES, mediaErrors, UPLOAD_FORMATS } from "./upload-rules";

/** D9: 30 media actions per editor per 10 minutes, one allowance for sign, attach and remove. */
export const MEDIA_RATE_LIMIT = { max: 30, windowSec: 600 } as const;

export type UploadEnv = "production" | "preview" | "local";

/** `{env}` in an upload's public ID, so environments never touch each other's uploads (D6, D10). */
export function uploadEnv(vercelEnv: string | undefined): UploadEnv {
  return vercelEnv === "production" || vercelEnv === "preview" ? vercelEnv : "local";
}

/** Where this environment's uploads for `slot` go, e.g. rhm/page/home-hero/preview. */
export function uploadFolder(slot: MediaSlot, env: UploadEnv): string {
  return `${MEDIA_SLOTS[slot].folder}/${env}`;
}

/**
 * True only for an upload this environment made to `slot`: the only IDs attachMedia accepts as a
 * new image and the only ones ever destroyed. A default, a seed asset, another environment's
 * upload, `..` or a full URL never matches (D9, D10).
 */
export function isOwnUpload(slot: MediaSlot, env: UploadEnv, publicId: unknown): boolean {
  if (typeof publicId !== "string") return false;
  const prefix = `${uploadFolder(slot, env)}/`;
  return publicId.startsWith(prefix) && /^[A-Za-z0-9_-]{1,64}$/.test(publicId.slice(prefix.length));
}

/** What the browser posts to Cloudinary with the file (D5). Nothing here is secret (C5). */
export type SignedUpload = {
  cloudName: string;
  apiKey: string;
  publicId: string;
  assetFolder: string;
  allowedFormats: string;
  timestamp: number;
  signature: string;
};

export type SignUploadResult = { ok: true; upload: SignedUpload } | { ok: false; error: string };

export type Signer = {
  cloudName: string;
  apiKey: string;
  /** Cloudinary's api_sign_request with the site's secret. */
  sign: (params: Record<string, string | number>) => string;
};

export type SignUploadDeps = {
  rateLimit: RateLimiter;
  /** Undefined when the key, secret or cloud name is missing (local runs, CI). */
  signer: Signer | undefined;
  env: UploadEnv;
  /** Unix seconds; Cloudinary refuses a signature more than an hour old. */
  now?: () => number;
  /** The random last segment of the public ID. */
  randomName?: () => string;
};

/**
 * Picks the full public ID for a new upload to `slot` and signs it with `asset_folder`,
 * `timestamp` and the allowed formats, so the browser chooses neither folder nor name (D6).
 */
export async function signUploadCore(
  guard: GuardResult,
  slot: unknown,
  deps: SignUploadDeps,
): Promise<SignUploadResult> {
  if (!guard.ok) return { ok: false, error: mediaErrors.refused };
  const limited = await checkMediaLimit(deps.rateLimit, guard.staff.userId);
  if (limited) return limited;

  const parsed = z.string().refine(isMediaSlot).safeParse(slot);
  if (!parsed.success) return { ok: false, error: mediaErrors.notEditable };
  if (!deps.signer) return { ok: false, error: mediaErrors.notConfigured };

  const assetFolder = uploadFolder(parsed.data as MediaSlot, deps.env);
  const publicId = `${assetFolder}/${(deps.randomName ?? defaultRandomName)()}`;
  const timestamp = (deps.now ?? (() => Math.floor(Date.now() / 1000)))();
  const allowedFormats = UPLOAD_FORMATS.join(",");
  try {
    const signature = deps.signer.sign({
      public_id: publicId,
      asset_folder: assetFolder,
      allowed_formats: allowedFormats,
      timestamp,
    });
    return {
      ok: true,
      upload: {
        cloudName: deps.signer.cloudName,
        apiKey: deps.signer.apiKey,
        publicId,
        assetFolder,
        allowedFormats,
        timestamp,
        signature,
      },
    };
  } catch (error) {
    console.error(`[media] sign failed: ${errorMessage(error)}`);
    return { ok: false, error: mediaErrors.failed };
  }
}

/**
 * The shared media allowance, checked after the guard so a visitor can't use up an editor's
 * (D9). Returns a refusal, or null when the action may go on.
 */
export async function checkMediaLimit(
  rateLimit: RateLimiter,
  userId: string,
): Promise<{ ok: false; error: string } | null> {
  try {
    const limit = await rateLimit("media", userId, MEDIA_RATE_LIMIT);
    return limit.allowed ? null : { ok: false, error: mediaErrors.rateLimited };
  } catch (error) {
    console.error(`[media] rate limit failed: ${errorMessage(error)}`);
    return { ok: false, error: mediaErrors.failed };
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  // The Cloudinary SDK rejects with { error: { message, http_code } }.
  const inner = (error as { error?: { message?: unknown } } | null)?.error?.message;
  return typeof inner === "string" ? inner : String(error);
}

function defaultRandomName() {
  return randomBytes(12).toString("base64url");
}
