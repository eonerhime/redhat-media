// Staff image choices for page slots (Phase 28 spec, D8). The client is a parameter, so
// read-core.db.test.ts runs the fetch against the CI Postgres; read.ts wraps it in the cached,
// server-only read that mediaSlot() uses. resolveSlot() is the pure half of mediaSlot().

import type { PrismaClient } from "@/lib/generated/prisma/client";
import { isRhmPublicId } from "./cloudinary";
import { MEDIA_SLOTS, type MediaSlot, type SlotImage } from "./slots";

/** Saved images by slot key: only slots with a row. A plain object, so it can be cached. */
export type SlotOverrides = Record<string, SlotImage>;

export type MediaSlotsResult = { ok: true; overrides: SlotOverrides } | { ok: false };

/** Every page-slot image row, as slot key → image. */
export async function fetchMediaSlots(db: Pick<PrismaClient, "mediaItem">): Promise<SlotOverrides> {
  const rows = await db.mediaItem.findMany({
    where: { ownerType: "PAGE", kind: "IMAGE" },
    select: { ownerId: true, cloudinaryId: true, alt: true },
  });
  const overrides: SlotOverrides = {};
  for (const row of rows) {
    if (row.cloudinaryId && row.alt) {
      overrides[row.ownerId] = { publicId: row.cloudinaryId, alt: row.alt };
    }
  }
  return overrides;
}

/**
 * The image in force for `slot`: a saved one, otherwise the default. A row that isn't usable
 * (outside rhm/…, which <MediaImage> would refuse) is ignored, so a bad row can't break the page.
 * With no overrides (a failed read), every slot shows its default.
 */
export function resolveSlot(slot: MediaSlot, overrides: SlotOverrides | null): SlotImage {
  if (!Object.hasOwn(MEDIA_SLOTS, slot)) throw new Error(`Unknown media slot: ${String(slot)}`);
  const saved = overrides && Object.hasOwn(overrides, slot) ? overrides[slot] : null;
  if (saved && isRhmPublicId(saved.publicId)) return saved;
  return MEDIA_SLOTS[slot].default;
}
