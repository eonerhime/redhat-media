"use client";

import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { AUTH_BASE_PATH } from "./paths";

// The browser's way into Better Auth: every sign-in goes through here to
// /api/auth, never through auth.api on the server (Phase 24 spec, D5).
export const authClient = createAuthClient({
  basePath: AUTH_BASE_PATH,
  // The login form handles twoFactorRedirect itself (components/cms/login-form.tsx).
  plugins: [twoFactorClient()],
});

/** The form messages for an auth error (D3, D14): 429 gets its own, the rest are generic. */
export function isRateLimited(error: { status?: number } | null | undefined): boolean {
  return error?.status === 429;
}
