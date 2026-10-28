import { hasMinRole, isStaffRole, type StaffRole } from "@/lib/auth/roles";

// The edit state kept in sessionStorage (Phase 26 spec, D4, D6, D7): the
// last-known role, so the pill doesn't vanish on a full page load, and the
// Editing toggle, so it survives navigation in this tab and a new tab starts Off.
// Both are UI only: every save re-checks the role on the server (rule 5).
// sessionStorage can throw (private browsing, blocked storage), and the provider
// is on every public page, so every call is guarded.

export const ROLE_KEY = "rhm:role";
export const EDIT_MODE_KEY = "rhm:editMode";

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function sessionStore(): Store | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Editors and admins get the toggle; sales staff, staff without 2FA and visitors don't. */
export function canEdit(role: StaffRole | null): boolean {
  return role !== null && hasMinRole(role, "editor");
}

export function readCachedRole(store: Store | null = sessionStore()): StaffRole | null {
  try {
    const role = store?.getItem(ROLE_KEY);
    return isStaffRole(role) ? role : null;
  } catch {
    return null;
  }
}

export function readEditToggle(store: Store | null = sessionStore()): boolean {
  try {
    return store?.getItem(EDIT_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeEditToggle(on: boolean, store: Store | null = sessionStore()): void {
  try {
    store?.setItem(EDIT_MODE_KEY, on ? "1" : "0");
  } catch {
    // storage blocked: the toggle lasts for this page only
  }
}

/**
 * Records the session endpoint's answer: the role, or no key when there is none.
 * Without an editor role the toggle is dropped too, so a later sign-in in this
 * tab, or the same person under a lower role, starts Off (D7).
 */
export function rememberRole(role: StaffRole | null, store: Store | null = sessionStore()): void {
  try {
    if (role) store?.setItem(ROLE_KEY, role);
    else store?.removeItem(ROLE_KEY);
    if (!canEdit(role)) store?.removeItem(EDIT_MODE_KEY);
  } catch {
    // storage blocked: nothing was cached either
  }
}

/** Sign-out: forget the role and the toggle (D7). */
export function clearEditState(store: Store | null = sessionStore()): void {
  rememberRole(null, store);
}
