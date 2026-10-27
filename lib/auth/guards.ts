import "server-only";

import { headers } from "next/headers";
import { env } from "@/lib/env";
import { createRequireRole, type GuardOptions, type GuardResult } from "./guard-core";
import type { StaffRole } from "./roles";
import { securityLog } from "./security-log";
import { readStaffSession } from "./session";

export type { GuardOptions, GuardRefusal, GuardResult, GuardedStaff } from "./guard-core";
export { guardResponse } from "./guard-core";

/**
 * The first statement of every server action and mutating route handler
 * (tech-stack.md → Architectural rules 5; Phase 25 spec, D1). It re-reads the
 * session and user from the database, and refuses with 401 when no staff member
 * is signed in (or the CMS is off), or 403 for a role below `minRole`, no 2FA,
 * or, with `{ fresh: true }`, a sign-in older than 15 minutes. A route handler
 * returns `guardResponse(result)` on a refusal; a server action returns a
 * generic error. lib/auth/guard-coverage.test.ts fails CI when one skips it.
 *
 *   const guard = await requireRole("editor", { action: "content.update" });
 *   if (!guard.ok) return guardResponse(guard);
 */
export async function requireRole(
  minRole: StaffRole,
  options?: GuardOptions,
): Promise<GuardResult> {
  return createRequireRole({
    cmsEnabled: env.cms !== undefined,
    readSession: async () => readStaffSession(await headers()),
    log: securityLog,
  })(minRole, options);
}
