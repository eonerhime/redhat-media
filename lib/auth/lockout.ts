// Per-account lockout (Phase 24 spec, D4, D14; tech-stack.md → lockout row).
// Five wrong passwords in a row lock the account for 15 minutes, whatever the
// IP. Wrong 2FA codes are counted by the twoFactor plugin's own accountLockout
// (lib/auth/options.ts). While either lock is active, or once the account is
// deactivated, sign-in fails exactly like a wrong password: same work, same error.

import { APIError, createAuthMiddleware, isAPIError } from "better-auth/api";
import { LOCKOUT_MAX_FAILURES, LOCKOUT_SECONDS, PASSWORD_MAX_LENGTH } from "./options";
import type { SecurityLogger } from "./security-log";

export const SIGN_IN_PATH = "/sign-in/email";
const VERIFY_PATHS = new Set(["/two-factor/verify-totp", "/two-factor/verify-backup-code"]);

export type AccountLockState = {
  userId: string;
  lockedUntil: Date | null;
  twoFactorLockedUntil: Date | null;
  deactivatedAt: Date | null;
};

export type LockoutStore = {
  find(email: string): Promise<AccountLockState | null>;
  /**
   * Counts one wrong password. At LOCKOUT_MAX_FAILURES it sets `lockedUntil` to
   * `until` and starts the count again. Returns null for an unknown email.
   */
  recordFailure(email: string, until: Date): Promise<{ userId: string; locked: boolean } | null>;
  /** A correct password: the count starts again. */
  reset(email: string): Promise<void>;
};

/** Why sign-in is refused before the password is checked, if it is. */
export function refusal(
  state: AccountLockState,
  now: Date,
): "deactivated" | "locked" | "2fa-locked" | null {
  if (state.deactivatedAt) return "deactivated";
  if (state.lockedUntil && state.lockedUntil > now) return "locked";
  if (state.twoFactorLockedUntil && state.twoFactorLockedUntil > now) return "2fa-locked";
  return null;
}

export function lockUntil(now: Date): Date {
  return new Date(now.getTime() + LOCKOUT_SECONDS * 1000);
}

/** The sign-in result, as the after hook sees it: a wrong password, a pass, or neither. */
export function signInOutcome(returned: unknown): "wrong-password" | "passed" | "other" {
  if (isAPIError(returned))
    return returned.statusCode === 401 && returned.body?.code === "INVALID_EMAIL_OR_PASSWORD"
      ? "wrong-password"
      : "other";
  return returned && typeof returned === "object" ? "passed" : "other";
}

/** The email from a sign-in body, lower-cased as Better Auth stores it. */
export function signInEmail(body: unknown): string | null {
  const email = (body as { email?: unknown } | undefined)?.email;
  return typeof email === "string" && email.length <= 254 ? email.toLowerCase() : null;
}

/** Better Auth's own wrong-password error, byte for byte. */
export function invalidCredentials(): APIError {
  return new APIError("UNAUTHORIZED", {
    message: "Invalid email or password",
    code: "INVALID_EMAIL_OR_PASSWORD",
  });
}

export function createLockoutHooks(deps: {
  store: LockoutStore;
  log: SecurityLogger;
  now?: () => Date;
}) {
  const now = deps.now ?? (() => new Date());

  const before = createAuthMiddleware(async (ctx) => {
    // No trusted devices: every sign-in asks for a code (D7).
    if (VERIFY_PATHS.has(ctx.path) && (ctx.body as { trustDevice?: unknown })?.trustDevice)
      throw new APIError("BAD_REQUEST", { message: "Trusted devices are not allowed" });
    if (ctx.path !== SIGN_IN_PATH) return;
    const email = signInEmail(ctx.body);
    if (!email) return;
    const state = await deps.store.find(email);
    if (!state || !refusal(state, now())) return;
    // Hash as a real check would, so the refusal takes as long as a wrong password.
    const password = (ctx.body as { password?: unknown }).password;
    if (typeof password === "string" && password.length <= PASSWORD_MAX_LENGTH)
      await ctx.context.password.hash(password);
    deps.log("auth.refused_locked", { userId: state.userId, path: SIGN_IN_PATH });
    throw invalidCredentials();
  });

  const after = createAuthMiddleware(async (ctx) => {
    if (ctx.path === SIGN_IN_PATH) {
      const email = signInEmail(ctx.body);
      if (!email) return;
      const outcome = signInOutcome(ctx.context.returned);
      if (outcome === "passed") {
        await deps.store.reset(email);
      } else if (outcome === "wrong-password") {
        const result = await deps.store.recordFailure(email, lockUntil(now()));
        deps.log("auth.sign_in_failed", { userId: result?.userId, path: SIGN_IN_PATH });
        if (result?.locked) deps.log("auth.lockout", { userId: result.userId, path: SIGN_IN_PATH });
      }
    } else if (VERIFY_PATHS.has(ctx.path) && isAPIError(ctx.context.returned)) {
      deps.log("auth.2fa_failed", { path: ctx.path });
    }
  });

  return { before, after };
}

export { LOCKOUT_MAX_FAILURES };
