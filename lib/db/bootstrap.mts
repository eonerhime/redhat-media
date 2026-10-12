// Pure parts of scripts/db-bootstrap.mts (Phase 7 spec, D3), kept here so they
// can be unit-tested. No database access and no secrets at module level.

export const ROLES = ["rhm_migrator", "rhm_app", "rhm_readonly"] as const;
export type RoleName = (typeof ROLES)[number];

export type RolePasswords = Record<RoleName, string>;

const quoteLiteral = (value: string) => `'${value.replaceAll("'", "''")}'`;

/**
 * Statements run in one transaction by the branch owner (`neondb_owner` on
 * Neon, `postgres` in CI). `existing` lists roles that already exist; they are
 * re-keyed instead of created, so re-running the script rotates every password.
 */
export function bootstrapStatements(
  passwords: RolePasswords,
  existing: ReadonlySet<string>,
  options: { dev: boolean },
): string[] {
  const statements = ROLES.map((role) => {
    // CREATEDB only for the dev branch's migrator, so `prisma migrate dev`
    // can create its shadow database. Every other role, everywhere, has none.
    const createdb = role === "rhm_migrator" && options.dev ? "CREATEDB" : "NOCREATEDB";
    const verb = existing.has(role) ? "ALTER" : "CREATE";
    return `${verb} ROLE ${role} WITH LOGIN NOCREATEROLE ${createdb} PASSWORD ${quoteLiteral(passwords[role])}`;
  });
  return [
    ...statements,
    "REVOKE CREATE ON SCHEMA public FROM PUBLIC",
    "GRANT USAGE, CREATE ON SCHEMA public TO rhm_migrator",
    "GRANT USAGE ON SCHEMA public TO rhm_app, rhm_readonly",
  ];
}

const NEON_HOST = /\.neon\.tech$/;
const POOLER = /^([^.]+?)-pooler\./;

/** Neon's pooled host inserts `-pooler` after the endpoint ID. */
export function neonHosts(hostname: string): { direct: string; pooled: string } {
  if (!NEON_HOST.test(hostname)) return { direct: hostname, pooled: hostname };
  const direct = hostname.replace(POOLER, "$1.");
  return { direct, pooled: direct.replace(/^([^.]+)\./, "$1-pooler.") };
}

/**
 * The three connection strings for one branch, derived from the owner URL
 * the script was given. Neon URLs always carry `sslmode=require`.
 */
export function roleUrls(ownerUrl: string, passwords: RolePasswords): Record<RoleName, string> {
  const base = new URL(ownerUrl);
  const { direct, pooled } = neonHosts(base.hostname);
  const isNeon = NEON_HOST.test(base.hostname);

  const build = (role: RoleName, host: string) => {
    const url = new URL(base.href);
    url.username = role;
    url.password = passwords[role];
    url.hostname = host;
    url.search = "";
    if (isNeon) url.searchParams.set("sslmode", "require");
    else
      for (const [key, value] of base.searchParams)
        if (key === "sslmode") url.searchParams.set(key, value);
    return url.href;
  };

  return {
    rhm_app: build("rhm_app", pooled),
    rhm_migrator: build("rhm_migrator", direct),
    rhm_readonly: build("rhm_readonly", direct),
  };
}
