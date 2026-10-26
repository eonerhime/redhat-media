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

/** "Admin panel", "Editor panel" or "Sales panel": the header icon's label and the
 * panel's heading, named after the user's own role as in MRU (Phase 24 spec, D13). */
export function staffPanelLabel(role: StaffRole): string {
  return `${role.charAt(0).toUpperCase()}${role.slice(1)} panel`;
}
