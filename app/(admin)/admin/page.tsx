import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { cmsCopy } from "@/components/cms/cms-copy";
import { LoginForm } from "@/components/cms/login-form";
import { getStaffSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: cmsCopy.login.title };

// The staff sign-in (D13, amended 2026-10-26). The form is the static shell and
// is never swapped out, so nothing typed into it is lost. The session check
// beside it renders nothing, and only sends signed-in staff on: to the panel, or
// to set-up when 2FA isn't on yet.
export default function AdminLogin() {
  return (
    <>
      <h1 className="font-display text-display-2 font-extrabold">{cmsCopy.login.title}</h1>
      <LoginForm />
      <Suspense fallback={null}>
        <SignedInRedirect />
      </Suspense>
    </>
  );
}

async function SignedInRedirect() {
  const session = await getStaffSession();
  if (!session) return null;
  redirect(session.twoFactorEnabled ? "/admin/panel" : "/admin/2fa/setup");
}
