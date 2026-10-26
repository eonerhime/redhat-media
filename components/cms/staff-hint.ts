// A "staff may be signed in here" hint in localStorage (Phase 24 spec, D13, amended
// 2026-10-26). The session cookie is httpOnly, so the public pages can't see it.
// Without the hint, the header's admin icon never asks the server, so visitors
// make no auth request. The hint is UI only: it grants nothing, and the icon still
// asks the server who is signed in. localStorage can throw (private browsing,
// blocked storage), so every call is guarded.

const HINT_KEY = "rhm:staff";

export function markStaffSignedIn(): void {
  try {
    window.localStorage.setItem(HINT_KEY, "1");
  } catch {
    // storage blocked: the icon just won't show
  }
}

export function clearStaffHint(): void {
  try {
    window.localStorage.removeItem(HINT_KEY);
  } catch {
    // nothing to clear
  }
}

export function hasStaffHint(): boolean {
  try {
    return window.localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
}
