import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { cmsCopy } from "@/components/cms/cms-copy";
import { SignOutButton } from "@/components/cms/sign-out-button";
import { getStaffSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: cmsCopy.dashboard.title };

// The Phase 24 placeholder dashboard (D13). The heading is the static shell; the
// session check streams in, so signed-out visitors and staff without 2FA are sent on.
export default function CmsHome() {
  return (
    <>
      <h1 className="font-display text-display-2 font-extrabold">{cmsCopy.dashboard.title}</h1>
      <Suspense fallback={<p className="mt-6 text-lg text-muted">…</p>}>
        <SignedIn />
      </Suspense>
    </>
  );
}

async function SignedIn() {
  const session = await getStaffSession();
  if (!session) redirect("/cms/login");
  if (!session.twoFactorEnabled) redirect("/cms/2fa/setup");
  return (
    <div className="mt-6 flex flex-col gap-6">
      <p className="text-lg">
        {cmsCopy.dashboard.signedInAs} <strong>{session.name}</strong> ({session.role})
      </p>
      <p className="text-lg text-muted">{cmsCopy.dashboard.comingSoon}</p>
      <div>
        <SignOutButton />
      </div>
    </div>
  );
}
