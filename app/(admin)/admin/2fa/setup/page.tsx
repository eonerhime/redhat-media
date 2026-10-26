import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { cmsCopy } from "@/components/cms/cms-copy";
import { TwoFactorSetup } from "@/components/cms/two-factor-setup";
import { getStaffSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: cmsCopy.setup.title };

// Set-up is the only /admin page a signed-in user without 2FA can use (D7).
export default function AdminTwoFactorSetup() {
  return (
    <>
      <h1 className="font-display text-display-2 font-extrabold">{cmsCopy.setup.title}</h1>
      <Suspense fallback={<p className="mt-6 text-lg text-muted">…</p>}>
        <NeedsSetup />
      </Suspense>
    </>
  );
}

async function NeedsSetup() {
  const session = await getStaffSession();
  if (!session) redirect("/admin");
  if (session.twoFactorEnabled) redirect("/admin/panel");
  return <TwoFactorSetup />;
}
