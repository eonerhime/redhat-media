// The mutations that may run without requireRole() (Phase 25 spec, D11). Each
// is public on purpose and carries its own protection, named in `reason`.
// lib/auth/guard-coverage.test.ts fails on any other unguarded server action or
// mutating route handler, and on an entry here that no longer exists. Adding an
// entry needs the spec and tech-stack.md updated in the same PR.

export type PublicMutation = {
  /** Repo-relative path, forward slashes. */
  file: string;
  /** The exported name: the server action, or the HTTP method of a route handler. */
  name: string;
  reason: string;
};

export const PUBLIC_MUTATIONS: readonly PublicMutation[] = [
  {
    file: "app/(public)/contact/actions.ts",
    name: "submitInquiry",
    reason:
      "The public inquiry form: Turnstile, honeypot, time-to-submit and per-IP limits (Phase 18 spec, D3).",
  },
  {
    file: "app/api/auth/[...all]/route.ts",
    name: "POST",
    reason:
      "Better Auth's sign-in, 2FA and sign-out: the path allowlist, origin check, rate limits and lockout (Phase 24 spec, D2–D4, D9, D21).",
  },
];
