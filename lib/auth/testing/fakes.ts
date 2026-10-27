import { createRequireRole } from "../guard-core";
import type { StaffRole } from "../roles";
import type { SecurityLogFields } from "../security-log";
import type { StaffSession } from "../staff-session";

// Unit-test fakes for the guard (Phase 25 spec, D10). Tests only: lint keeps
// lib/auth/testing out of app code. Database tests use ./auth-kit.ts, which signs
// in through the real handler instead.

/** A signed-in staff member: an admin with 2FA, signed in just now, unless overridden. */
export function fakeSession(overrides: Partial<StaffSession> = {}): StaffSession {
  return {
    userId: "user-1",
    name: "Test Staff",
    email: "staff@example.test",
    role: "admin",
    twoFactorEnabled: true,
    sessionCreatedAt: new Date(),
    ...overrides,
  };
}

/**
 * requireRole() as `role` sees it (null: signed out), with the security log
 * lines it wrote. `session` overrides fakeSession()'s other fields.
 */
export function fakeStaff(
  role: StaffRole | null,
  options: { session?: Partial<StaffSession>; cmsEnabled?: boolean; now?: () => Date } = {},
) {
  const logged: { event: string; fields: SecurityLogFields }[] = [];
  const session = role === null ? null : fakeSession({ role, ...options.session });
  const requireRole = createRequireRole({
    cmsEnabled: options.cmsEnabled ?? true,
    readSession: async () => session,
    log: (event, fields = {}) => logged.push({ event, fields }),
    now: options.now,
  });
  return { requireRole, logged };
}
