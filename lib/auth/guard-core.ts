import { NextResponse } from "next/server";
import { FRESH_SESSION_SECONDS } from "./options";
import { hasMinRole, type StaffRole } from "./roles";
import type { SecurityLogger } from "./security-log";
import type { StaffSession } from "./staff-session";

// The guard every mutation starts with (Phase 25 spec, D1–D3, D12;
// tech-stack.md → Architectural rules 5). This module takes the session reader
// as an argument, so the unit tests feed it fake sessions and the database tests
// feed it a real Better Auth instance. lib/auth/guards.ts wires it to the request.

export type GuardOptions = {
  /** Refuse with 403 "reauth" unless the user signed in within the last 15 minutes (D3). */
  fresh?: boolean;
  /** The action's name for the security log, e.g. "content.update" (D12). Never its input. */
  action?: string;
};

export type GuardedStaff = Pick<StaffSession, "userId" | "role" | "name">;

export type GuardRefusal =
  | { ok: false; status: 401; reason: "signed-out" }
  | { ok: false; status: 403; reason: "role" | "2fa" | "reauth" };

export type GuardResult = { ok: true; staff: GuardedStaff } | GuardRefusal;

export type GuardDeps = {
  /** False while CMS_ENABLED is off: every call is a 401 and nothing builds Better Auth. */
  cmsEnabled: boolean;
  /** Reads the session from the database on every call (no cookie cache). */
  readSession: () => Promise<StaffSession | null>;
  log: SecurityLogger;
  now?: () => Date;
};

/** The decision itself, with no I/O. */
export function decide(
  session: StaffSession | null,
  minRole: StaffRole,
  options: GuardOptions,
  now: Date,
): GuardResult {
  if (!session) return { ok: false, status: 401, reason: "signed-out" };
  if (!session.twoFactorEnabled) return { ok: false, status: 403, reason: "2fa" };
  if (!hasMinRole(session.role, minRole)) return { ok: false, status: 403, reason: "role" };
  if (
    options.fresh &&
    now.getTime() - session.sessionCreatedAt.getTime() > FRESH_SESSION_SECONDS * 1000
  )
    return { ok: false, status: 403, reason: "reauth" };
  return {
    ok: true,
    staff: { userId: session.userId, role: session.role, name: session.name },
  };
}

export function createRequireRole(deps: GuardDeps) {
  const now = deps.now ?? (() => new Date());
  return async function requireRole(
    minRole: StaffRole,
    options: GuardOptions = {},
  ): Promise<GuardResult> {
    if (!deps.cmsEnabled) return { ok: false, status: 401, reason: "signed-out" };
    const session = await deps.readSession();
    const result = decide(session, minRole, options, now());
    if (!result.ok && result.status === 403)
      deps.log("auth.forbidden", {
        userId: session?.userId,
        reason: result.reason,
        action: options.action,
      });
    return result;
  };
}

const REFUSAL_ERRORS: Record<GuardRefusal["reason"], string> = {
  "signed-out": "unauthorized",
  role: "forbidden",
  "2fa": "two_factor_required",
  reauth: "reauth_required",
};

/** A route handler's answer to a refusal: `{ error }` with the guard's status, never cached. */
export function guardResponse(refusal: GuardRefusal): NextResponse {
  return NextResponse.json(
    { error: REFUSAL_ERRORS[refusal.reason] },
    { status: refusal.status, headers: { "Cache-Control": "no-store" } },
  );
}
