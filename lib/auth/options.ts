// The Better Auth options that shape the database (Phase 24 spec, D1, D4, D7):
// email and password, the plugins, and the extra `user` columns. lib/auth/server.ts
// adds the database, secret, origins, rate limits and hooks. This module has no
// env or database access, so the Better Auth CLI can read it to generate the
// Prisma models (plan 1.2). Relative imports only: scripts run it under plain Node.

import type { BetterAuthOptions } from "better-auth";
import { admin, haveIBeenPwned, twoFactor } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";
import { DEFAULT_ROLE } from "./roles.ts";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

/** Failures before a lock, and its length (tech-stack.md → lockout row; D4). */
export const LOCKOUT_MAX_FAILURES = 5;
export const LOCKOUT_SECONDS = 15 * 60;

export const SESSION_SECONDS = 8 * 60 * 60;
export const FRESH_SESSION_SECONDS = 15 * 60;

// Admins get the plugin's user and session management (used from Phase 33),
// without impersonation (D19). Editors and sales staff get none of it.
const ac = createAccessControl(defaultStatements);
const accessRoles = {
  admin: ac.newRole({
    user: [
      "create",
      "list",
      "set-role",
      "ban",
      "delete",
      "set-password",
      "set-email",
      "get",
      "update",
    ],
    session: ["list", "revoke", "delete"],
  }),
  editor: ac.newRole({ user: [], session: [] }),
  sales: ac.newRole({ user: [], session: [] }),
};

export const authOptions = {
  appName: "RedHat Media",
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    revokeSessionsOnPasswordReset: true,
  },
  user: {
    additionalFields: {
      // Password failures in a row; wrong 2FA codes are counted by the
      // twoFactor plugin's own lockout below (D4).
      failedSignInCount: { type: "number", defaultValue: 0, required: false, input: false },
      lockedUntil: { type: "date", required: false, input: false },
      deactivatedAt: { type: "date", required: false, input: false },
    },
  },
  session: {
    expiresIn: SESSION_SECONDS,
    disableSessionRefresh: true, // absolute 8h (D8)
    freshAge: FRESH_SESSION_SECONDS,
    cookieCache: { enabled: false }, // a revoked session ends on its next request
  },
  plugins: [
    admin({
      ac,
      roles: accessRoles,
      defaultRole: DEFAULT_ROLE,
      adminRoles: ["admin"],
      // A banned account is refused like a wrong password (D14).
      bannedUserMessage: "Invalid email or password",
    }),
    twoFactor({
      issuer: "RedHat Media",
      backupCodeOptions: { amount: 10 },
      accountLockout: {
        enabled: true,
        maxFailedAttempts: LOCKOUT_MAX_FAILURES,
        durationSeconds: LOCKOUT_SECONDS,
      },
    }),
    haveIBeenPwned(),
  ],
} satisfies BetterAuthOptions;
