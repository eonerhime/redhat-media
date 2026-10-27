"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { isStaffRole, type StaffRole } from "@/lib/auth/roles";
import { cmsCopy } from "./cms-copy";
import {
  canEdit,
  clearEditState,
  readCachedRole,
  readEditToggle,
  rememberRole,
  writeEditToggle,
} from "./edit-storage";
import { clearStaffHint, hasStaffHint } from "./staff-hint";

// The edit-mode shell (Phase 26 spec; tech-stack.md → In-place CMS 1–3), after
// MRU's edit-mode.tsx. Public pages stay static: the role is read in the browser
// after load, from /api/cms/session, and only when the sign-in hint is set, so
// visitors make no request. This is the page's one session read; the header's
// admin icon reads it too (D2). Nothing here authorises anything: every save
// re-checks the role on the server with requireRole() (rule 5).
//
// The state lives in a small store read with useSyncExternalStore, not in React
// context. A context change above a Suspense boundary that is still streaming
// makes React drop the server HTML and client-render it, which left the streamed
// copy behind as a hidden duplicate (found in preview-e2e). A store update only
// re-renders the components that read it.

type EditModeValue = {
  role: StaffRole | null;
  /** Signed in as active staff, even before 2FA is set up (when `role` is still null). */
  authenticated: boolean;
  /** May use the toggle (editor or admin). Controls gate on `editMode`, not this. */
  canEdit: boolean;
  /** `canEdit` and the toggle is on: every ✎ control gates on this (D8). */
  editMode: boolean;
  /** The one open editor popover on the page, or null; opening one closes any other (D8). */
  openKey: string | null;
  setOpenKey: (key: string | null) => void;
};

type EditState = {
  role: StaffRole | null;
  authenticated: boolean;
  toggleOn: boolean;
  openKey: string | null;
};

// What a visitor gets, the server HTML, and any page without the provider (D1).
const visitorState: EditState = {
  role: null,
  authenticated: false,
  toggleOn: false,
  openKey: null,
};

let state = visitorState;
const listeners = new Set<() => void>();

function update(patch: Partial<EditState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setOpenKey(key: string | null) {
  update({ openKey: key });
}

/** Sign-out: forget the role and the toggle, in storage and on this page (D7). */
export function forgetEditState() {
  clearEditState();
  update(visitorState);
}

function toggleEditing() {
  const next = !state.toggleOn;
  writeEditToggle(next);
  update({ toggleOn: next, openKey: null });
}

export function useEditMode(): EditModeValue {
  const current = useSyncExternalStore(
    subscribe,
    () => state,
    () => visitorState,
  );
  const editable = canEdit(current.role);
  const editMode = editable && current.toggleOn;
  return {
    role: current.role,
    authenticated: current.authenticated,
    canEdit: editable,
    editMode,
    openKey: editMode ? current.openKey : null,
    setOpenKey,
  };
}

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // After hydration, the cached role and toggle, so the pill doesn't vanish on a
  // full page load (D4, D6; MRU 032, 074). The fetched answer takes over below.
  useEffect(() => {
    if (!hasStaffHint()) {
      if (state !== visitorState) update(visitorState);
      return;
    }
    if (state.role) return; // already known: a client navigation back to the site
    const role = readCachedRole();
    if (role) update({ role, authenticated: true, toggleOn: readEditToggle() });
  }, []);

  // Re-read on every navigation: the layout doesn't remount on a client
  // navigation, so a pill could otherwise outlive the session (D3).
  useEffect(() => {
    if (!hasStaffHint()) return;
    let cancelled = false;
    fetch("/api/cms/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { role?: unknown; authenticated?: unknown } | null) => {
        // A newer navigation's read wins; a failed one keeps the role we know.
        if (cancelled || !data) return;
        const role = isStaffRole(data.role) ? data.role : null;
        const authenticated = data.authenticated === true;
        // Signed out: drop the hint. Signed in without 2FA yet: keep it, so the
        // staff UI appears once set-up is finished (Phase 25 spec, D9).
        if (!authenticated) clearStaffHint();
        rememberRole(role);
        // Below editor, the toggle goes too (D7); an editor keeps the one they set.
        update(
          canEdit(role)
            ? { role, authenticated }
            : { role, authenticated, toggleOn: false, openKey: null },
        );
      })
      .catch(() => {
        // a network blip: keep the last known role
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <>
      {children}
      <EditingPill />
    </>
  );
}

// Last in the DOM, so last in tab order. Off is dark with an outline, On is the
// button red; it holds only the toggle (D5, owner answer C). The data attribute
// lets globals.css keep the page's last lines clear of it (C6).
function EditingPill() {
  const { canEdit: editable, editMode } = useEditMode();
  if (!editable) return null;
  return (
    <button
      type="button"
      data-edit-pill
      aria-pressed={editMode}
      onClick={toggleEditing}
      className={`fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 rounded-full border px-5 py-3 text-sm font-semibold shadow-lg print:hidden ${
        editMode
          ? "border-brand-deep bg-brand-deep text-fg"
          : "border-muted bg-ink text-fg hover:border-fg"
      }`}
    >
      {editMode ? cmsCopy.editMode.on : cmsCopy.editMode.off}
    </button>
  );
}
