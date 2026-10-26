"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { authClient, isRateLimited } from "@/lib/auth/client";
import { cmsCopy } from "./cms-copy";
import {
  buttonClassName,
  controlClassName,
  errorClassName,
  labelClassName,
  textLinkClassName,
} from "./form-styles";

const copy = cmsCopy.twoFactor;

// The second sign-in step (D7): a TOTP code, or one of the backup codes. Better
// Auth reads the short-lived 2FA cookie the password step set. No device is
// ever trusted, so there is no "remember me".
export function TwoFactorForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "").trim();
    setBusy(true);
    setError(null);
    const { error: failure } =
      mode === "totp"
        ? await authClient.twoFactor.verifyTotp({ code })
        : await authClient.twoFactor.verifyBackupCode({ code });
    if (!failure) {
      router.replace("/cms");
      return;
    }
    setBusy(false);
    // A missing or timed-out 2FA cookie: the password step must start again.
    const timedOut = failure.status === 401;
    setExpired(timedOut);
    setError(isRateLimited(failure) ? cmsCopy.rateLimited : timedOut ? copy.expired : copy.invalid);
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  const totp = mode === "totp";
  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-6">
      <div>
        <label htmlFor="cms-code" className={labelClassName}>
          {totp ? copy.totpLabel : copy.backupLabel}
        </label>
        <input
          key={mode}
          id="cms-code"
          name="code"
          required
          autoComplete="one-time-code"
          inputMode={totp ? "numeric" : "text"}
          pattern={totp ? "[0-9]{6}" : undefined}
          maxLength={totp ? 6 : 32}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "cms-2fa-error" : undefined}
          className={controlClassName}
        />
      </div>
      <p
        id="cms-2fa-error"
        ref={errorRef}
        tabIndex={-1}
        role="alert"
        className={error ? `${errorClassName} focus:outline-none` : "sr-only"}
      >
        {error}{" "}
        {expired && (
          <Link href="/cms/login" className={textLinkClassName}>
            {copy.signInAgain}
          </Link>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-6">
        <button type="submit" disabled={busy} className={`${buttonClassName} disabled:cursor-wait`}>
          {busy ? copy.submitting : copy.submit}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(totp ? "backup" : "totp");
            setError(null);
          }}
          className={textLinkClassName}
        >
          {totp ? copy.useBackup : copy.useTotp}
        </button>
      </div>
    </form>
  );
}
