// Staff roles (tech-stack.md → In-place CMS, Roles; Phase 24 spec, D1). The
// database restricts `user.role` to these three with a CHECK constraint, and the
// order is the hierarchy Phase 25's requireRole() uses: sales < editor < admin.

export const STAFF_ROLES = ["sales", "editor", "admin"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/** A new account's role: the least powerful one. */
export const DEFAULT_ROLE: StaffRole = "sales";

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value);
}
