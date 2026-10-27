"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { isStaffRole, type StaffRole } from "@/lib/auth/roles";
import { cmsCopy } from "./cms-copy";
import {
  canEdit,
  readCachedRole,
  readEditToggle,
  rememberRole,
  writeEditToggle,
} from "./edit-storage";
import { clearStaffHint, hasStaffHint } from "./staff-hint";
import { useHydrated } from "./use-hydrated";

// The edit-mode shell (Phase 26 spec; tech-stack.md → In-place CMS 1–3), after
// MRU's edit-mode.tsx. Public pages stay static: the role is read in the browser
// after load, from /api/cms/session, and only when the sign-in hint is set, so
// visitors make no request. This is the page's one session read; the header's
// admin icon reads it too (D2). Nothing here authorises anything: every save
// re-checks the role on the server with requireRole() (rule 5).

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

// What a visitor gets, and what any page outside the provider gets (D1).
const visitor: EditModeValue = {
  role: null,
  authenticated: false,
  canEdit: false,
  editMode: false,
  openKey: null,
  setOpenKey: () => {},
};

const EditModeContext = createContext<EditModeValue>(visitor);

type SessionAnswer = { role: StaffRole | null; authenticated: boolean };

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  // The cached role and toggle are read only after hydration, so the server HTML
  // and the first client render agree (D4, MRU 074). The fetched answer and the
  // staff member's own toggling take over from them.
  const hydrated = useHydrated();
  const pathname = usePathname();
  const [answer, setAnswer] = useState<SessionAnswer | undefined>(undefined);
  const [toggled, setToggled] = useState<boolean | undefined>(undefined);
  const [openKey, setOpenKey] = useState<string | null>(null);

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
        if (!canEdit(role)) setToggled(false);
        setAnswer({ role, authenticated });
      })
      .catch(() => {
        // a network blip: keep the last known role
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const role = answer ? answer.role : hydrated ? readCachedRole() : null;
  const editable = canEdit(role);
  const toggleOn = toggled ?? (hydrated && readEditToggle());
  const editMode = editable && toggleOn;

  function toggle() {
    const next = !toggleOn;
    setToggled(next);
    writeEditToggle(next);
    setOpenKey(null);
  }

  const value: EditModeValue = {
    role,
    authenticated: answer ? answer.authenticated : role !== null,
    canEdit: editable,
    editMode,
    openKey: editMode ? openKey : null,
    setOpenKey,
  };

  return (
    <EditModeContext.Provider value={value}>
      {children}
      {editable && (
        // Last in the DOM, so last in tab order. Off is dark with an outline, On
        // is the button red; it holds only the toggle (D5, owner answer C). The
        // data attribute lets globals.css keep the page's last lines clear of it (C6).
        <button
          type="button"
          data-edit-pill
          aria-pressed={toggleOn}
          onClick={toggle}
          className={`fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 rounded-full border px-5 py-3 text-sm font-semibold shadow-lg print:hidden ${
            toggleOn
              ? "border-brand-deep bg-brand-deep text-fg"
              : "border-muted bg-ink text-fg hover:border-fg"
          }`}
        >
          {toggleOn ? cmsCopy.editMode.on : cmsCopy.editMode.off}
        </button>
      )}
    </EditModeContext.Provider>
  );
}

export function useEditMode(): EditModeValue {
  return useContext(EditModeContext);
}
