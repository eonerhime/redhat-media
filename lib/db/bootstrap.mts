// Pure parts of scripts/db-bootstrap.mts (Phase 7 spec, D3), kept here so they
// can be unit-tested. No database access and no secrets at module level.

export const ROLES = ["rhm_migrator", "rhm_app", "rhm_readonly", "rhm_retention"] as const;
export type RoleName = (typeof ROLES)[number];

export type RolePasswords = Record<RoleName, string>;

const quoteLiteral = (value: string) => `'${value.replaceAll("'", "''")}'`;

/** The roles a run covers: every role, or the one named by `--role` (Phase 23 spec, D7). */
const rolesIn = (passwords: Partial<RolePasswords>) =>
  ROLES.filter((role) => passwords[role] !== undefined);

/**
 * Statements run in one transaction by the branch owner (`neondb_owner` on
 * Neon, `postgres` in CI). `existing` lists roles that already exist; they are
 * re-keyed instead of created, so re-running the script rotates every password
 * it was given. Given one role only, it touches that role and its schema grant
 * and leaves the others alone.
 */
export function bootstrapStatements(
  passwords: Partial<RolePasswords>,
  existing: ReadonlySet<string>,
  options: { dev: boolean },
): string[] {
  const roles = rolesIn(passwords);
  const statements = roles.map((role) => {
    // CREATEDB only for the dev branch's migrator, so `prisma migrate dev`
    // can create its shadow database. Every other role, everywhere, has none.
    const createdb = role === "rhm_migrator" && options.dev ? "CREATEDB" : "NOCREATEDB";
    const verb = existing.has(role) ? "ALTER" : "CREATE";
    return `${verb} ROLE ${role} WITH LOGIN NOCREATEROLE ${createdb} PASSWORD ${quoteLiteral(passwords[role]!)}`;
  });
  if (roles.length < ROLES.length)
    return [
      ...statements,
      ...roles.map((role) =>
        role === "rhm_migrator"
          ? "GRANT USAGE, CREATE ON SCHEMA public TO rhm_migrator"
          : `GRANT USAGE ON SCHEMA public TO ${role}`,
      ),
    ];
  return [
    ...statements,
    "REVOKE CREATE ON SCHEMA public FROM PUBLIC",
    "GRANT USAGE, CREATE ON SCHEMA public TO rhm_migrator",
    "GRANT USAGE ON SCHEMA public TO rhm_app, rhm_readonly, rhm_retention",
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
 * The connection strings for the roles a run covers, derived from the owner
 * URL the script was given. Only `rhm_app` (the runtime) is pooled. Neon URLs
 * always carry `sslmode=require`.
 */
export function roleUrls(
  ownerUrl: string,
  passwords: Partial<RolePasswords>,
): Partial<Record<RoleName, string>> {
  const base = new URL(ownerUrl);
  const { direct, pooled } = neonHosts(base.hostname);
  const isNeon = NEON_HOST.test(base.hostname);

  const build = (role: RoleName) => {
    const url = new URL(base.href);
    url.username = role;
    url.password = passwords[role]!;
    url.hostname = role === "rhm_app" ? pooled : direct;
    url.search = "";
    if (isNeon) url.searchParams.set("sslmode", "require");
    else
      for (const [key, value] of base.searchParams)
        if (key === "sslmode") url.searchParams.set(key, value);
    return url.href;
  };

  return Object.fromEntries(rolesIn(passwords).map((role) => [role, build(role)]));
}
