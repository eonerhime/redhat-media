// updateContentBlock's logic (Phase 27 spec, D4, D5, D7, D8). The guard's result, the limiter
// and the client are arguments, so update-core.test.ts and update-core.db.test.ts run it without
// a request; actions.ts wires it up after `await requireRole(...)`, which must stay the action's
// first statement (Phase 25 spec, D11).

import { z } from "zod";
import { audit } from "@/lib/audit/audit";
import type { GuardResult } from "@/lib/auth/guard-core";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { RateLimiter } from "@/lib/security/rate-limit-core";
import { BLOCK_KINDS, editableKind } from "./editable";
import { BLOCK_KEY_PATTERN } from "./keys";
import { resolveBlock, type BlockKey } from "./read-core";

export type UpdateContentResult = { ok: true; value: string } | { ok: false; error: string };

/** D8: 60 saves per editor per 10 minutes. */
export const CONTENT_RATE_LIMIT = { max: 60, windowSec: 600 } as const;

// Generic messages only: the editor sees why a save failed, never anything internal.
export const contentErrors = {
  refused: "You can't edit this. Sign in again as an editor.",
  rateLimited: "Too many saves. Try again in a few minutes.",
  notEditable: "This text can't be edited.",
  tooLong: (max: number) => `Keep it to ${max} characters or fewer.`,
  oneLine: "This text must stay on one line.",
  failed: "The change wasn't saved. Try again.",
} as const;

/**
 * The key and the value as they will be saved: `\r` removed and the value trimmed (an empty
 * value resets the block). A refusal carries the message for the editor.
 */
export function parseContentUpdate(
  key: unknown,
  value: unknown,
): { ok: true; key: BlockKey; value: string } | { ok: false; error: string } {
  const input = z
    .object({ key: z.string().regex(BLOCK_KEY_PATTERN), value: z.string() })
    .safeParse({ key, value });
  if (!input.success) return { ok: false, error: contentErrors.notEditable };
  const kind = editableKind(input.data.key);
  if (!kind) return { ok: false, error: contentErrors.notEditable };
  const { max, multiline } = BLOCK_KINDS[kind];
  const text = input.data.value.replaceAll("\r", "").trim();
  if (text.length > max) return { ok: false, error: contentErrors.tooLong(max) };
  if (!multiline && text.includes("\n")) return { ok: false, error: contentErrors.oneLine };
  return { ok: true, key: input.data.key as BlockKey, value: text };
}

export type UpdateContentDeps = {
  db: Pick<PrismaClient, "$transaction">;
  rateLimit: RateLimiter;
  /** Expires the cached copy, e.g. updateTag("content"). */
  refresh: () => void;
};

/**
 * Saves `value` for `key`, or deletes the row when it is empty, with its AuditEvent in the same
 * transaction. Returns the text now in force (the default after a reset). An unchanged value
 * writes nothing.
 */
export async function updateContentBlockCore(
  guard: GuardResult,
  key: unknown,
  value: unknown,
  deps: UpdateContentDeps,
): Promise<UpdateContentResult> {
  if (!guard.ok) return { ok: false, error: contentErrors.refused };
  // After the guard, so a visitor can't use up an editor's allowance (D8).
  try {
    const limit = await deps.rateLimit("content", guard.staff.userId, CONTENT_RATE_LIMIT);
    if (!limit.allowed) return { ok: false, error: contentErrors.rateLimited };
  } catch (error) {
    console.error(`[content] rate limit failed: ${message(error)}`);
    return { ok: false, error: contentErrors.failed };
  }

  const parsed = parseContentUpdate(key, value);
  if (!parsed.ok) return parsed;
  const fallback = resolveBlock(parsed.key, null);
  // The row to keep: none for an empty value or the default itself, so a row is always an edit.
  const saved = parsed.value === "" || parsed.value === fallback ? null : parsed.value;
  const after = saved ?? fallback;

  try {
    const changed = await deps.db.$transaction(async (tx) => {
      const row = await tx.contentBlock.findUnique({ where: { key: parsed.key } });
      if ((row?.value ?? null) === saved) return false;
      if (saved === null) {
        await tx.contentBlock.delete({ where: { key: parsed.key } });
      } else {
        await tx.contentBlock.upsert({
          where: { key: parsed.key },
          create: { key: parsed.key, value: saved, updatedById: guard.staff.userId },
          update: { value: saved, updatedById: guard.staff.userId },
        });
      }
      const before = row?.value ?? fallback;
      await audit(tx, {
        actorId: guard.staff.userId,
        action: saved === null ? "content.reset" : "content.update",
        entityType: "ContentBlock",
        entityId: parsed.key,
        diff: { before, after },
      });
      return true;
    });
    if (changed) deps.refresh();
    return { ok: true, value: after };
  } catch (error) {
    console.error(`[content] save failed for ${parsed.key}: ${message(error)}`);
    return { ok: false, error: contentErrors.failed };
  }
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
