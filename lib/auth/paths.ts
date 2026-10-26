// Which Better Auth endpoints exist over HTTP (Phase 24 spec, D10, D19).
//
// ALLOWED_AUTH_PATHS is the allowlist the /api/auth route checks before Better
// Auth sees a request: everything Phase 24's sign-in, 2FA and sign-out flow
// calls, and nothing else. An endpoint a Better Auth upgrade adds stays closed
// until a phase opens it here. DISABLED_AUTH_PATHS is the spec's explicit list,
// passed to Better Auth as `disabledPaths`, so they stay off even for a request
// that reaches the handler some other way.

export const ALLOWED_AUTH_PATHS: ReadonlySet<string> = new Set([
  "/ok",
  "/error",
  "/get-session",
  "/sign-in/email",
  "/sign-out",
  "/change-password",
  "/two-factor/get-totp-uri",
  "/two-factor/enable",
  "/two-factor/verify-totp",
  "/two-factor/verify-backup-code",
]);

export const DISABLED_AUTH_PATHS = [
  "/sign-up/email",
  // No reset email until the domain amendment (D10).
  "/request-password-reset",
  "/reset-password",
  "/reset-password/:token",
  // Impersonation is off for good (D19).
  "/admin/impersonate-user",
  "/admin/stop-impersonating",
  // Staff never turn 2FA off themselves; the owner's reset script does it (D7, D10).
  "/two-factor/disable",
  // Email OTP is not configured; TOTP and backup codes are the only factors.
  "/two-factor/send-otp",
  "/two-factor/verify-otp",
];

export const AUTH_BASE_PATH = "/api/auth";

/** The endpoint path of an /api/auth request, or null when it is outside it. */
export function authEndpointPath(pathname: string): string | null {
  if (!pathname.startsWith(`${AUTH_BASE_PATH}/`)) return null;
  const path = pathname.slice(AUTH_BASE_PATH.length).replace(/\/+$/, "");
  return path || null;
}

export function isAllowedAuthPath(pathname: string): boolean {
  const path = authEndpointPath(pathname);
  return path !== null && ALLOWED_AUTH_PATHS.has(path);
}

/**
 * Every state-changing request must come from a trusted origin (D9). Better Auth
 * checks the Origin only when the request carries cookies; browsers send it on
 * every POST, so this refuses a cookieless cross-site sign-in too.
 */
export function isTrustedRequestOrigin(request: Request, trustedOrigins: string[]): boolean {
  if (request.method === "GET" || request.method === "HEAD") return true;
  const origin = request.headers.get("origin");
  return origin !== null && trustedOrigins.includes(origin);
}
