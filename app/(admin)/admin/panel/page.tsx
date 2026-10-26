import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { cmsCopy } from "@/components/cms/cms-copy";
import { buttonClassName } from "@/components/cms/form-styles";
import { SignOutButton } from "@/components/cms/sign-out-button";
import { getStaffSession } from "@/lib/auth/session";
import { staffPanelLabel } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Staff panel" };

// The admin panel (D13, amended 2026-10-26), opened from the header's admin icon.
// The inquiry inbox (Phase 32) and staff management (Phase 33) arrive here;
// editing happens on the website itself. The session check streams in, so
// signed-out visitors and staff without 2FA are sent on.
export default function AdminPanel() {
  return (
    <Suspense fallback={<p className="text-lg text-muted">…</p>}>
      <Panel />
    </Suspense>
  );
}

async function Panel() {
  const session = await getStaffSession();
  if (!session) redirect("/admin");
  if (!session.twoFactorEnabled) redirect("/admin/2fa/setup");
  const copy = cmsCopy.panel;
  return (
    <>
      <h1 className="font-display text-display-2 font-extrabold">
        {staffPanelLabel(session.role)}
      </h1>
      <div className="mt-6 flex flex-col gap-6">
        <p className="text-lg">
          {copy.signedInAs} <strong>{session.name}</strong> ({session.role})
        </p>
        <p className="text-lg text-muted">{copy.comingSoon}</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/" className={buttonClassName}>
            {copy.toSite}
          </Link>
          <SignOutButton />
        </div>
      </div>
    </>
  );
}
