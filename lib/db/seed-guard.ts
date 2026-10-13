// Production holds no seed data (tech-stack.md → Database security; Phase 9
// spec, D7). The endpoint ID is not a secret: it is part of every connection
// host name for the branch.

export const PRODUCTION_ENDPOINT_ID = "ep-muddy-star-za4k6uom";

/** Returns the target host to print, or throws when the seed must not run. */
export function assertSeedTarget(
  databaseUrl: string | undefined,
  env: { VERCEL_ENV?: string } = {},
): string {
  if (env.VERCEL_ENV === "production") {
    throw new Error("Refusing to seed: VERCEL_ENV is production.");
  }
  if (!databaseUrl) throw new Error("MIGRATOR_DATABASE_URL is not set (see .env.example).");

  let host: string;
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    throw new Error("MIGRATOR_DATABASE_URL is not a valid connection URL.");
  }
  if (host.includes(PRODUCTION_ENDPOINT_ID)) {
    throw new Error(`Refusing to seed the production branch (${PRODUCTION_ENDPOINT_ID}).`);
  }
  return host;
}
