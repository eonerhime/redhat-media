"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { cmsCopy } from "./cms-copy";
import { secondaryButtonClassName } from "./form-styles";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await authClient.signOut();
    router.replace("/cms/login");
    // Drop the client router cache, so no staff page survives the sign-out.
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} disabled={busy} className={secondaryButtonClassName}>
      {busy ? cmsCopy.dashboard.signingOut : cmsCopy.dashboard.signOut}
    </button>
  );
}
