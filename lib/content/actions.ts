"use server";

import { updateTag } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { rateLimit } from "@/lib/security/rate-limit";
import { CONTENT_TAG } from "./read";
import { updateContentBlockCore, type UpdateContentResult } from "./update-core";

/**
 * Saves one copy block from the ✎ editor (Phase 27 spec, D5; tech-stack.md → In-place CMS 4).
 * An empty value resets it to the default. Every page refreshes through the `content` tag, and
 * the editor's next render reads the write (updateTag). It never throws to the client.
 */
export async function updateContentBlock(key: string, value: string): Promise<UpdateContentResult> {
  const guard = await requireRole("editor", { action: "content.update" });
  return updateContentBlockCore(guard, key, value, {
    db: getDb(),
    rateLimit,
    refresh: () => updateTag(CONTENT_TAG),
  });
}
