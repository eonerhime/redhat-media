// The audit log's writer (Phase 25 spec, D4, D5; tech-stack.md → Authorization &
// application). A change and its AuditEvent are written in one $transaction, so
// both commit or neither does: pass the transaction client as `db`. Events with
// no change of their own (a lockout, 2FA set-up seen by a hook) go through
// auditBestEffort(), which never breaks sign-in. The table is append-only for
// rhm_app (D6). It takes its client as an argument and has no env access, so the
// owner scripts run it under plain Node: relative imports only, and no
// "server-only" import, which would throw there.

import type { PrismaClient } from "../generated/prisma/client.ts";

/** Plain JSON values only: no Dates, class instances or undefined. */
export type AuditJson =
  string | number | boolean | null | AuditJson[] | { [key: string]: AuditJson };

export type AuditEventInput = {
  /** The staff member who acted; null for the system (a lockout) and the owner scripts. */
  actorId: string | null;
  /** "area.verb", e.g. "auth.lockout", "content.update". */
  action: string;
  entityType: string;
  entityId: string;
  diff?: { [key: string]: AuditJson };
};

/** A Prisma client or a transaction client. */
export type AuditDb = Pick<PrismaClient, "auditEvent">;

const ACTION = /^[a-z][a-z0-9_]*\.[a-z0-9_]+$/;

// A diff records what changed, never a credential. Any key that looks like one is
// refused, at any depth, so a careless `diff: { ...user }` fails loudly in tests.
const SECRET_KEY =
  /password|passwd|secret|token|backup_?codes?|totp|otp_?code|hash|cookie|api_?key/i;

function secretKeyIn(value: AuditJson, path: string): string | null {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = secretKeyIn(item, `${path}[${index}]`);
      if (found) return found;
    }
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (SECRET_KEY.test(key)) return `${path}.${key}`;
      const found = secretKeyIn(item, `${path}.${key}`);
      if (found) return found;
    }
  }
  return null;
}

/** Throws on a malformed action or a credential-like diff key. */
export function checkAuditEvent(event: AuditEventInput): void {
  if (!ACTION.test(event.action))
    throw new Error(`audit: action "${event.action}" is not area.verb`);
  if (!event.entityType || !event.entityId)
    throw new Error("audit: entityType and entityId are required");
  const secret = event.diff ? secretKeyIn(event.diff, "diff") : null;
  if (secret) throw new Error(`audit: ${secret} looks like a credential and is never recorded`);
}

/** Writes one AuditEvent. Inside a $transaction, pass the transaction client. */
export async function audit(db: AuditDb, event: AuditEventInput): Promise<void> {
  checkAuditEvent(event);
  await db.auditEvent.create({
    data: {
      actorId: event.actorId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      ...(event.diff ? { diff: event.diff } : {}),
    },
  });
}

/**
 * For an event with no change of its own to roll back with. A failure is
 * logged as one `audit.write_failed` line (action and entity only) and never thrown.
 */
export async function auditBestEffort(db: AuditDb, event: AuditEventInput): Promise<void> {
  try {
    await audit(db, event);
  } catch {
    console.error(
      JSON.stringify({
        event: "audit.write_failed",
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
      }),
    );
  }
}
