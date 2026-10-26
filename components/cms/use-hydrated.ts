"use client";

import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * False in the server HTML and while hydrating, true after. The staff forms keep
 * their submit button disabled until then: a submit before React has loaded
 * would be the browser's own, and a GET would put the password in the URL
 * (found in the Phase 24 e2e run, 2026-10-26). Each form is also method="post",
 * so even that can't happen.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}
