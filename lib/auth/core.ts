import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { auditBestEffort } from "@/lib/audit/audit";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { hashKey, type RateLimiter } from "@/lib/security/rate-limit-core";
import { createLockoutHooks } from "./lockout";
import { createLockoutStore } from "./lockout-store";
import { authOptions } from "./options";
import { AUTH_BASE_PATH, DISABLED_AUTH_PATHS } from "./paths";
import { AUTH_RATE_RULES, createRateLimitStorage, DEFAULT_AUTH_RULE } from "./rate-limit-storage";
import { securityLog } from "./security-log";

// Staff sign-in (Phase 24 spec). lib/auth/options.ts holds what shapes the
// database; this adds the runtime: the database, the secret, exact origins,
// rate limits on our own limiter, the lockout hooks and the disabled paths.
// The server entry point is ./server.ts; this module takes its dependencies as
// arguments, so the database tests build a real instance on a throwaway Postgres.

export type AuthDeps = {
  db: PrismaClient;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  limiter: RateLimiter;
  /** Salts the short key hashes in security log lines (RATE_LIMIT_SALT). */
  logSalt: string;
  now?: () => Date;
};

export function createAuth(deps: AuthDeps) {
  const lockout = createLockoutHooks({
    store: createLockoutStore(deps.db),
    log: securityLog,
    audit: (event) => auditBestEffort(deps.db, event),
    now: deps.now,
  });
  return betterAuth({
    ...authOptions,
    database: prismaAdapter(deps.db, { provider: "postgresql" }),
    secret: deps.secret,
    baseURL: deps.baseURL,
    basePath: AUTH_BASE_PATH,
    trustedOrigins: deps.trustedOrigins,
    rateLimit: {
      enabled: true, // also in dev and CI, so the tests exercise it (D2)
      ...DEFAULT_AUTH_RULE,
      customRules: AUTH_RATE_RULES,
      customStorage: createRateLimitStorage(deps.limiter, securityLog, (key) =>
        hashKey(deps.logSalt, key).slice(0, 12),
      ),
    },
    advanced: {
      // Vercel's edge sets both and overwrites client values (lib/security/client-ip.ts).
      ipAddress: { ipAddressHeaders: ["x-real-ip", "x-forwarded-for"] },
      // Secure, __Secure- prefixed cookies wherever the site is https (D8).
      useSecureCookies: deps.baseURL.startsWith("https:"),
      // Explicit, because Better Auth skips its origin check by default when it
      // detects a test run; the tests must exercise what production runs.
      disableOriginCheck: false,
      disableCSRFCheck: false,
    },
    disabledPaths: DISABLED_AUTH_PATHS,
    hooks: { before: lockout.before, after: lockout.after },
    telemetry: { enabled: false },
  });
}

export type Auth = ReturnType<typeof createAuth>;
