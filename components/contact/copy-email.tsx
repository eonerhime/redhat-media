"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

// Copies the address for visitors whose mailto: link opens nothing (Phase 13 spec, D6). It renders
// only after hydration and only where the Clipboard API exists (secure origins), so the address
// and its link stand alone without it.
export function CopyEmail({
  email,
  label,
  copiedLabel,
}: {
  email: string;
  label: string;
  copiedLabel: string;
}) {
  const supported = useSyncExternalStore(
    noSubscribe,
    () => typeof navigator !== "undefined" && Boolean(navigator.clipboard),
    () => false,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!supported) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3">
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(email).then(
            () => setCopied(true),
            () => setCopied(false),
          );
        }}
        className="min-h-11 font-semibold underline decoration-brand decoration-2 underline-offset-4"
      >
        {label}
      </button>
      <span role="status" className="text-base text-muted">
        {copied ? copiedLabel : ""}
      </span>
    </div>
  );
}
