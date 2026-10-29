// attachMedia's and removeMedia's logic (Phase 28 spec, D9, D10). The guard's result, the
// limiter, the database and the Cloudinary client are arguments, so attach-core.test.ts and
// attach-core.db.test.ts run them with fakes; actions.ts wires them up after
// `await requireRole(...)`, which must stay each action's first statement (Phase 25 spec, D11).

import { z } from "zod";
import { audit } from "@/lib/audit/audit";
import type { GuardResult } from "@/lib/auth/guard-core";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { RateLimiter } from "@/lib/security/rate-limit-core";
import { resolveSlot, type SlotOverrides } from "./read-core";
import {
  checkMediaLimit,
  errorMessage,
  isOwnUpload,
  MAX_UPLOAD_BYTES,
  mediaErrors,
  UPLOAD_FORMATS,
  type UploadEnv,
} from "./sign-core";
import { isMediaSlot, MEDIA_SLOTS, type MediaSlot, type SlotImage } from "./slots";
import { ALT_MAX } from "./upload-rules";

export type MediaResult = { ok: true } | { ok: false; error: string };

/** The two Admin API calls the cores make; actions.ts passes the SDK, tests pass a fake. */
export type CloudinaryAdmin = {
  resource: (
    publicId: string,
  ) => Promise<{ resource_type?: string; format?: string; bytes?: number }>;
  destroy: (publicId: string) => Promise<{ result?: string }>;
};

export type MediaDeps = {
  db: Pick<PrismaClient, "$transaction" | "mediaItem">;
  rateLimit: RateLimiter;
  /** Undefined when the key, secret or cloud name is missing (local runs, CI). */
  cloudinary: CloudinaryAdmin | undefined;
  env: UploadEnv;
  /** Expires the cached slots, e.g. updateTag("media"). */
  refresh: () => void;
};

/** D9: alt text is trimmed, 1–150 characters, one line. */
export function parseAlt(alt: unknown): { ok: true; alt: string } | { ok: false; error: string } {
  if (typeof alt !== "string") return { ok: false, error: mediaErrors.altRequired };
  const text = alt.trim();
  if (text === "") return { ok: false, error: mediaErrors.altRequired };
  if (text.length > ALT_MAX) return { ok: false, error: mediaErrors.altTooLong };
  if (/[\r\n]/.test(text)) return { ok: false, error: mediaErrors.altOneLine };
  return { ok: true, alt: text };
}

const slotSchema = z.string().refine(isMediaSlot);
const publicIdSchema = z.string().max(256);

/**
 * Puts `publicId` with `alt` in `slot`. `publicId` is either the image now in force (an alt-only
 * save) or this environment's new upload for the slot, which must exist on Cloudinary as one of
 * the four formats at 15 MB or less; otherwise it is destroyed and the save refused. The old row
 * is replaced in one transaction with its AuditEvent, then the old upload is destroyed (D10).
 */
export async function attachMediaCore(
  guard: GuardResult,
  slot: unknown,
  publicId: unknown,
  alt: unknown,
  deps: MediaDeps,
): Promise<MediaResult> {
  if (!guard.ok) return { ok: false, error: mediaErrors.refused };
  const limited = await checkMediaLimit(deps.rateLimit, guard.staff.userId);
  if (limited) return limited;

  const slotInput = slotSchema.safeParse(slot);
  const idInput = publicIdSchema.safeParse(publicId);
  if (!slotInput.success || !idInput.success) return { ok: false, error: mediaErrors.notEditable };
  const key = slotInput.data as MediaSlot;
  const altInput = parseAlt(alt);
  if (!altInput.ok) return altInput;
  const next: SlotImage = { publicId: idInput.data, alt: altInput.alt };

  let current: SlotImage;
  try {
    current = await currentImage(deps.db, key);
  } catch (error) {
    console.error(`[media] read failed for ${key}: ${errorMessage(error)}`);
    return { ok: false, error: mediaErrors.failed };
  }

  const isNew = next.publicId !== current.publicId;
  if (isNew) {
    if (!isOwnUpload(key, deps.env, next.publicId)) {
      return { ok: false, error: mediaErrors.notEditable };
    }
    if (!deps.cloudinary) return { ok: false, error: mediaErrors.notConfigured };
    const checked = await checkUpload(deps.cloudinary, next.publicId);
    if (!checked.ok) {
      if (checked.destroy) await destroyUpload(deps.cloudinary, next.publicId);
      return { ok: false, error: checked.error };
    }
  } else if (next.alt === current.alt) {
    return { ok: true };
  }

  let before: SlotImage;
  try {
    before = await deps.db.$transaction(async (tx) => {
      const row = await findRow(tx, key);
      const old = rowImage(key, row);
      await tx.mediaItem.deleteMany({ where: { ownerType: "PAGE", ownerId: key } });
      await tx.mediaItem.create({
        data: {
          ownerType: MEDIA_SLOTS[key].owner,
          ownerId: key,
          kind: "IMAGE",
          cloudinaryId: next.publicId,
          alt: next.alt,
        },
      });
      await audit(tx, {
        actorId: guard.staff.userId,
        action: isNew ? "media.replace" : "media.alt",
        entityType: "MediaItem",
        entityId: key,
        diff: { before: { ...old }, after: { ...next } },
      });
      return old;
    });
  } catch (error) {
    console.error(`[media] save failed for ${key}: ${errorMessage(error)}`);
    return { ok: false, error: mediaErrors.failed };
  }
  deps.refresh();
  if (before.publicId !== next.publicId) await destroyOld(deps, key, before.publicId);
  return { ok: true };
}

/** Removes `slot`'s row with its AuditEvent, so the default shows, then destroys the upload. */
export async function removeMediaCore(
  guard: GuardResult,
  slot: unknown,
  deps: MediaDeps,
): Promise<MediaResult> {
  if (!guard.ok) return { ok: false, error: mediaErrors.refused };
  const limited = await checkMediaLimit(deps.rateLimit, guard.staff.userId);
  if (limited) return limited;

  const slotInput = slotSchema.safeParse(slot);
  if (!slotInput.success) return { ok: false, error: mediaErrors.notEditable };
  const key = slotInput.data as MediaSlot;

  let removed: SlotImage | null;
  try {
    removed = await deps.db.$transaction(async (tx) => {
      const row = await findRow(tx, key);
      if (!row) return null;
      const old = rowImage(key, row);
      await tx.mediaItem.deleteMany({ where: { ownerType: "PAGE", ownerId: key } });
      await audit(tx, {
        actorId: guard.staff.userId,
        action: "media.remove",
        entityType: "MediaItem",
        entityId: key,
        diff: { before: { ...old }, after: { ...MEDIA_SLOTS[key].default } },
      });
      return old;
    });
  } catch (error) {
    console.error(`[media] remove failed for ${key}: ${errorMessage(error)}`);
    return { ok: false, error: mediaErrors.failed };
  }
  if (!removed) return { ok: true };
  deps.refresh();
  await destroyOld(deps, key, removed.publicId);
  return { ok: true };
}

type SlotRow = { cloudinaryId: string | null; alt: string | null } | null;

function findRow(db: Pick<PrismaClient, "mediaItem">, slot: MediaSlot): Promise<SlotRow> {
  return db.mediaItem.findFirst({
    where: { ownerType: "PAGE", ownerId: slot },
    select: { cloudinaryId: true, alt: true },
  });
}

/** The image a row shows, as mediaSlot() would: the default when there is none. */
function rowImage(slot: MediaSlot, row: SlotRow): SlotImage {
  const saved: SlotOverrides = {};
  if (row?.cloudinaryId && row.alt) saved[slot] = { publicId: row.cloudinaryId, alt: row.alt };
  return resolveSlot(slot, saved);
}

async function currentImage(db: Pick<PrismaClient, "mediaItem">, slot: MediaSlot) {
  return rowImage(slot, await findRow(db, slot));
}

type UploadCheck = { ok: true } | { ok: false; error: string; destroy: boolean };

/** D9: Cloudinary's record of the upload, since a signed upload can't limit its size. */
async function checkUpload(cloudinary: CloudinaryAdmin, publicId: string): Promise<UploadCheck> {
  let resource: Awaited<ReturnType<CloudinaryAdmin["resource"]>>;
  try {
    resource = await cloudinary.resource(publicId);
  } catch (error) {
    // Not found, or Cloudinary is unreachable: nothing to keep. An orphan is swept in Phase 36.
    console.error(`[media] resource check failed for ${publicId}: ${errorMessage(error)}`);
    return { ok: false, error: mediaErrors.notFound, destroy: false };
  }
  const format = resource.format ?? "";
  const usable =
    resource.resource_type === "image" &&
    (UPLOAD_FORMATS as readonly string[]).includes(format) &&
    typeof resource.bytes === "number" &&
    resource.bytes <= MAX_UPLOAD_BYTES;
  return usable ? { ok: true } : { ok: false, error: mediaErrors.badFile, destroy: true };
}

/** D10: only this environment's uploads to the slot are destroyed, never a default or seed. */
async function destroyOld(deps: MediaDeps, slot: MediaSlot, publicId: string) {
  if (!deps.cloudinary || !isOwnUpload(slot, deps.env, publicId)) return;
  await destroyUpload(deps.cloudinary, publicId);
}

/** A failed destroy is logged and the change stands (D10; Phase 36 surfaces these). */
async function destroyUpload(cloudinary: CloudinaryAdmin, publicId: string) {
  try {
    const { result } = await cloudinary.destroy(publicId);
    if (result !== "ok" && result !== "not found") {
      console.error(`[media] destroy failed ${publicId}: ${String(result)}`);
    }
  } catch (error) {
    console.error(`[media] destroy failed ${publicId}: ${errorMessage(error)}`);
  }
}
