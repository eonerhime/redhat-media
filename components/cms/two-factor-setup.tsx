"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { authClient, isRateLimited } from "@/lib/auth/client";
import { downloadBackupCodes } from "./backup-codes-file";
import { cmsCopy } from "./cms-copy";
import {
  buttonClassName,
  controlClassName,
  errorClassName,
  labelClassName,
  secondaryButtonClassName,
} from "./form-styles";
import { TotpQr } from "./totp-qr";

const copy = cmsCopy.setup;

type Step =
  | { name: "password" }
  | { name: "scan"; totpURI: string; backupCodes: string[] }
  | { name: "backup"; backupCodes: string[] };

/** The base32 key from an otpauth:// URI, for typing in by hand. */
function setupKey(totpURI: string): string {
  const secret = new URL(totpURI).searchParams.get("secret") ?? "";
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

// First sign-in without 2FA (D7): confirm the password, scan the QR code,
// confirm one code (which turns 2FA on), then see the backup codes once, with
// a download as a text file (D7 as amended 2026-10-26).
export function TwoFactorSetup() {
  const [step, setStep] = useState<Step>({ name: "password" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  function fail(message: string) {
    setBusy(false);
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setBusy(true);
    setError(null);
    const { data, error: failure } = await authClient.twoFactor.enable({ password });
    if (failure || !data || !("totpURI" in data)) {
      fail(isRateLimited(failure) ? cmsCopy.rateLimited : copy.wrongPassword);
      return;
    }
    setBusy(false);
    setStep({ name: "scan", totpURI: data.totpURI, backupCodes: data.backupCodes });
  }

  async function confirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step.name !== "scan") return;
    const code = String(new FormData(event.currentTarget).get("code") ?? "").trim();
    setBusy(true);
    setError(null);
    const { error: failure } = await authClient.twoFactor.verifyTotp({ code });
    if (failure) {
      fail(isRateLimited(failure) ? cmsCopy.rateLimited : copy.invalidCode);
      return;
    }
    setBusy(false);
    setStep({ name: "backup", backupCodes: step.backupCodes });
  }

  const errorLine = (
    <p
      id="cms-setup-error"
      ref={errorRef}
      tabIndex={-1}
      role="alert"
      className={error ? `${errorClassName} focus:outline-none` : "sr-only"}
    >
      {error}
    </p>
  );
  const describedBy = error ? "cms-setup-error" : undefined;

  if (step.name === "password")
    return (
      <form onSubmit={start} className="mt-8 flex flex-col gap-6">
        <p className="text-lg">{copy.intro}</p>
        <div>
          <label htmlFor="cms-setup-password" className={labelClassName}>
            {copy.passwordLabel}
          </label>
          <input
            id="cms-setup-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={controlClassName}
          />
        </div>
        {errorLine}
        <div>
          <button
            type="submit"
            disabled={busy}
            className={`${buttonClassName} disabled:cursor-wait`}
          >
            {copy.start}
          </button>
        </div>
      </form>
    );

  if (step.name === "scan")
    return (
      <form onSubmit={confirm} className="mt-8 flex flex-col gap-6">
        <p className="text-lg">{copy.scan}</p>
        <TotpQr uri={step.totpURI} label={copy.qrLabel} />
        <div>
          <p className="text-base text-muted">{copy.manual}</p>
          <p className="mt-1 font-mono text-lg break-all" data-testid="totp-key">
            {setupKey(step.totpURI)}
          </p>
        </div>
        <div>
          <label htmlFor="cms-setup-code" className={labelClassName}>
            {copy.codeLabel}
          </label>
          <input
            id="cms-setup-code"
            name="code"
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={controlClassName}
          />
        </div>
        {errorLine}
        <div>
          <button
            type="submit"
            disabled={busy}
            className={`${buttonClassName} disabled:cursor-wait`}
          >
            {copy.confirm}
          </button>
        </div>
      </form>
    );

  return (
    <section aria-labelledby="cms-backup-title" className="mt-8 flex flex-col gap-6">
      <h2 id="cms-backup-title" className="font-display text-2xl font-extrabold">
        {copy.backupTitle}
      </h2>
      <p className="text-lg">{copy.backupIntro}</p>
      <ul className="grid grid-cols-2 gap-2 font-mono text-lg" data-testid="backup-codes">
        {step.backupCodes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => downloadBackupCodes(step.backupCodes)}
          className={secondaryButtonClassName}
        >
          {copy.download}
        </button>
        <Link href="/cms" className={buttonClassName}>
          {copy.done}
        </Link>
      </div>
    </section>
  );
}
