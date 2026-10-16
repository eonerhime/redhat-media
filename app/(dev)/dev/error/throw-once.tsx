"use client";

import { useSyncExternalStore } from "react";

// Throws in the browser right after hydration, until sessionStorage holds RECOVER_KEY; the e2e
// test sets it before pressing retry (Phase 15 spec, D2, amended). The server snapshot is false,
// so the prerender never throws, which would fail the build.
export const RECOVER_KEY = "rhm-dev-error-recover";

const noSubscription = () => () => {};
const shouldThrow = () => sessionStorage.getItem(RECOVER_KEY) !== "1";

export function ThrowOnce() {
  const failing = useSyncExternalStore(noSubscription, shouldThrow, () => false);
  if (failing) throw new Error("Dev fixture: a deliberate error (Phase 15 spec, D2)");
  return <p data-testid="throw-once">Recovered</p>;
}
