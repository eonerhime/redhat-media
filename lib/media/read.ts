import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/lib/db";
import { fetchMediaSlots, resolveSlot, type MediaSlotsResult } from "./read-core";
import type { MediaSlot, SlotImage } from "./slots";

/** attachMedia and removeMedia refresh this tag (tech-stack.md → Architectural rules 13). */
export const MEDIA_TAG = "media";

/**
 * Every page-slot image, the one read behind mediaSlot() (Phase 28 spec, D8), cached as
 * readContentBlocks() is: it never throws, a failure is cached for minutes so slots show their
 * defaults and try again soon, and a success is cached for days until a save expires the tag.
 */
export async function readMediaSlots(): Promise<MediaSlotsResult> {
  "use cache";
  cacheTag(MEDIA_TAG);
  try {
    const overrides = await fetchMediaSlots(getDb());
    cacheLife("days");
    return { ok: true, overrides };
  } catch (error) {
    cacheLife("minutes");
    console.error(`[media] read failed: ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false };
  }
}

/** The image a page shows in `slot`: a staff upload when there is one, otherwise the default. */
export async function mediaSlot(slot: MediaSlot): Promise<SlotImage> {
  const result = await readMediaSlots();
  return resolveSlot(slot, result.ok ? result.overrides : null);
}
