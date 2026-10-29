"use server";

import { updateTag } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { attachMediaCore, removeMediaCore, type MediaDeps, type MediaResult } from "./attach-core";
import { cloudinaryAdmin, cloudinarySigner } from "./cloudinary-admin";
import { MEDIA_TAG } from "./read";
import { signUploadCore, uploadEnv, type SignUploadResult } from "./sign-core";

// The ✎ image editor's three actions (Phase 28 spec, D6, D9, D10; tech-stack.md → In-place CMS 5).
// Each opens with the guard, shares one rate-limit allowance, and never throws to the client.

/** Signs a direct upload of one file to `slot`; the server picks the public ID (D6). */
export async function signCloudinaryUpload(slot: string): Promise<SignUploadResult> {
  const guard = await requireRole("editor", { action: "media.sign" });
  return signUploadCore(guard, slot, {
    rateLimit,
    signer: cloudinarySigner(),
    env: uploadEnv(env.vercelEnv),
  });
}

/** Puts a new upload (or new alt text for the image in force) in `slot` (D9). */
export async function attachMedia(
  slot: string,
  publicId: string,
  alt: string,
): Promise<MediaResult> {
  const guard = await requireRole("editor", { action: "media.attach" });
  return attachMediaCore(guard, slot, publicId, alt, mediaDeps());
}

/** Empties `slot`, so its default shows again (D9). */
export async function removeMedia(slot: string): Promise<MediaResult> {
  const guard = await requireRole("editor", { action: "media.remove" });
  return removeMediaCore(guard, slot, mediaDeps());
}

function mediaDeps(): MediaDeps {
  return {
    db: getDb(),
    rateLimit,
    cloudinary: cloudinaryAdmin(),
    env: uploadEnv(env.vercelEnv),
    refresh: () => updateTag(MEDIA_TAG),
  };
}
