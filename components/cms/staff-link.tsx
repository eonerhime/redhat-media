"use client";

import { useEffect, useState } from "react";
import { isStaffRole, staffPanelLabel, type StaffRole } from "@/lib/auth/roles";
import { clearStaffHint, hasStaffHint } from "./staff-hint";

// The header's admin icon (Phase 24 spec, D13, amended 2026-10-26): shown only to
// signed-in staff, and labelled with their role as in MRU. It opens /admin/panel,
// where the inquiry inbox (Phase 32) and staff management (Phase 33) live.
// Public pages stay static: the role is read from /api/cms/session in the browser
// after load (Phase 25 spec, D9), and only when the sign-in hint is set. It decides only whether the icon shows; every
// /admin page checks the session on the server again.
export function StaffLink() {
  const [role, setRole] = useState<StaffRole | null>(null);

  useEffect(() => {
    if (!hasStaffHint()) return;
    let cancelled = false;
    fetch("/api/cms/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { role?: unknown; authenticated?: unknown } | null) => {
        if (cancelled || !data) return;
        if (isStaffRole(data.role)) setRole(data.role);
        // Signed out: drop the hint. Signed in without 2FA yet (role null): keep it,
        // so the icon appears once set-up is finished (Phase 25 spec, D9).
        else if (data.authenticated === false) clearStaffHint();
      })
      .catch(() => {
        // a network blip: leave the icon hidden this time, keep the hint
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!role) return null;
  const label = staffPanelLabel(role);
  // A plain <a>, not <Link>: Next 16 keeps a visited route in a hidden <Activity>,
  // so a client navigation could bring back a staff page as this browser saw it
  // before signing in. A full load always renders the session it has now.
  return (
    <a
      href="/admin/panel"
      aria-label={label}
      title={label}
      className="inline-flex size-11 items-center justify-center rounded-md border border-line text-fg hover:border-fg"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </a>
  );
}
