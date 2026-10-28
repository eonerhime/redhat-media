// Where the owner's staff scripts may run (Phase 24 spec, D10, D12). They write
// staff accounts with rhm_migrator. Production has no staff sign-in until the
// Milestone 3 release, so they refuse it outright; Phase 34 decides how its
// first admin is made. Relative imports only: it runs under plain Node.

import { PRODUCTION_ENDPOINT_ID } from "../db/seed-guard.ts";

/** Returns the target host to print, or throws when the script must not run. */
export function assertAuthScriptTarget(
  databaseUrl: string | undefined,
  env: { VERCEL_ENV?: string } = {},
): string {
  if (env.VERCEL_ENV === "production") throw new Error("Refusing: VERCEL_ENV is production.");
  if (!databaseUrl) throw new Error("MIGRATOR_DATABASE_URL is not set (see .env.example).");
  let host: string;
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    throw new Error("MIGRATOR_DATABASE_URL is not a valid connection URL.");
  }
  if (host.includes(PRODUCTION_ENDPOINT_ID))
    throw new Error("Refusing the production branch: staff sign-in is off there until Phase 34.");
  return host;
}

/** The git-ignored file the scripts write a password to, e.g. .env.admin-dev.local. */
export function adminSecretsFile(branch: string): string {
  if (!/^[a-z0-9-]+$/.test(branch))
    throw new Error("--branch must be lowercase letters, digits or dashes");
  return `.env.admin-${branch}.local`;
}
