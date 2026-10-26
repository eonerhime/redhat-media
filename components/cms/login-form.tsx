"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { authClient, isRateLimited } from "@/lib/auth/client";
import { cmsCopy } from "./cms-copy";
import { buttonClassName, controlClassName, errorClassName, labelClassName } from "./form-styles";
import { markStaffSignedIn } from "./staff-hint";
import { useHydrated } from "./use-hydrated";

const copy = cmsCopy.login;

// Signs in through the client API only (D5). A correct password for an account
// with 2FA goes on to /admin/2fa; without 2FA, to /admin/2fa/setup (D7). Every failure shows the same message (D14). A correct password also
// sets the header icon's hint (staff-hint.ts), which a failed code clears again.
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const hydrated = useHydrated();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    const { data, error: failure } = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (failure) {
      setBusy(false);
      setError(isRateLimited(failure) ? cmsCopy.rateLimited : copy.invalid);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    markStaffSignedIn();
    const needsCode = !!data && "twoFactorRedirect" in data && data.twoFactorRedirect;
    // Straight to the next step: a navigation to /admin, the page this form is on,
    // would keep showing the form.
    router.replace(needsCode ? "/admin/2fa" : "/admin/2fa/setup");
  }

  return (
    <form method="post" onSubmit={submit} className="mt-8 flex flex-col gap-6">
      <div>
        <label htmlFor="cms-email" className={labelClassName}>
          {copy.email}
        </label>
        <input
          id="cms-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "cms-login-error" : undefined}
          className={controlClassName}
        />
      </div>
      <div>
        <label htmlFor="cms-password" className={labelClassName}>
          {copy.password}
        </label>
        <input
          id="cms-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "cms-login-error" : undefined}
          className={controlClassName}
        />
      </div>
      <p
        id="cms-login-error"
        ref={errorRef}
        tabIndex={-1}
        role="alert"
        className={error ? `${errorClassName} focus:outline-none` : "sr-only"}
      >
        {error}
      </p>
      <div>
        <button
          type="submit"
          disabled={busy || !hydrated}
          className={`${buttonClassName} disabled:cursor-wait`}
        >
          {busy ? copy.submitting : copy.submit}
        </button>
      </div>
    </form>
  );
}
