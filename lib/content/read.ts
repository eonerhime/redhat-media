import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/lib/db";
import { fetchContentBlocks, type ContentBlocksResult } from "./read-core";

/** updateContentBlock refreshes this tag (tech-stack.md → Architectural rules 13). */
export const CONTENT_TAG = "content";

/**
 * Every staff copy edit, the one read behind block() (Phase 27 spec, D6). It never throws: a
 * throw inside "use cache" fails the prerender even when the caller catches it. A failure is
 * cached for minutes, so pages show the defaults and try again soon. A success is cached for
 * days, the pages' own lifetime, so reading copy doesn't make them regenerate more often; a save
 * expires it at once with updateTag().
 */
export async function readContentBlocks(): Promise<ContentBlocksResult> {
  "use cache";
  cacheTag(CONTENT_TAG);
  try {
    const overrides = await fetchContentBlocks(getDb());
    cacheLife("days");
    return { ok: true, overrides };
  } catch (error) {
    cacheLife("minutes");
    console.error(
      `[content] read failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return { ok: false };
  }
}
