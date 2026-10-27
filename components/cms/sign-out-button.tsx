"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { cmsCopy } from "./cms-copy";
import { forgetEditState } from "./edit-mode";
import { secondaryButtonClassName } from "./form-styles";
import { clearStaffHint } from "./staff-hint";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await authClient.signOut();
    clearStaffHint();
    // The next person in this tab doesn't inherit "Editing: On" (Phase 26 spec, D7).
    forgetEditState();
    router.replace("/admin");
    // Drop the client router cache, so no staff page survives the sign-out.
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} disabled={busy} className={secondaryButtonClassName}>
      {busy ? cmsCopy.panel.signingOut : cmsCopy.panel.signOut}
    </button>
  );
}
