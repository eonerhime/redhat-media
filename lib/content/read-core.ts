// Staff copy edits (Phase 27 spec, D6). The client is a parameter, so read-core.db.test.ts runs
// the fetch against the CI Postgres; read.ts wraps it in the cached, server-only read that
// block() uses. resolveBlock() is the pure half of block().

import { defaults } from "../../content/defaults";
import type { PrismaClient } from "@/lib/generated/prisma/client";

export type BlockKey = keyof typeof defaults;

/** Saved values by key: only keys with a ContentBlock row. A plain object, so it can be cached. */
export type ContentOverrides = Record<string, string>;

export type ContentBlocksResult = { ok: true; overrides: ContentOverrides } | { ok: false };

/** Every ContentBlock row, as key → value. */
export async function fetchContentBlocks(
  db: Pick<PrismaClient, "contentBlock">,
): Promise<ContentOverrides> {
  const rows = await db.contentBlock.findMany({ select: { key: true, value: true } });
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

/**
 * The text in force for `key`: a saved value, otherwise the default. Unknown keys throw, and a
 * row whose key is no longer a default is ignored. With no overrides (a failed read), every key
 * shows its default.
 */
export function resolveBlock(key: BlockKey, overrides: ContentOverrides | null): string {
  // A key widened through a cast, or one arriving from the database or a URL.
  if (!Object.hasOwn(defaults, key)) throw new Error(`Unknown content block key: ${String(key)}`);
  if (overrides && Object.hasOwn(overrides, key)) return overrides[key];
  return defaults[key];
}
