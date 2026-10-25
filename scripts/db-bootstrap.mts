// Creates or re-keys the database roles on one branch (Phase 7 spec, D3).
//
//   $env:BOOTSTRAP_DATABASE_URL = "<branch owner URL, pooling off>"
//   node scripts/db-bootstrap.mts --branch preview          # add --dev for the dev branch
//   node scripts/db-bootstrap.mts --branch preview --role rhm_retention   # that role only
//   Remove-Item Env:BOOTSTRAP_DATABASE_URL
//
// Writes the role URLs (and, for a whole branch, a fresh RATE_LIMIT_SALT) to a
// git-ignored .env.neon-<branch>.local (or --out <path>) and prints no secret.
// Running it again rotates every password it covers; --role covers one role
// and leaves the others' passwords alone (Phase 23 spec, D7). CI runs it
// against its Postgres container.

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import pg from "pg";
import {
  ROLES,
  bootstrapStatements,
  roleUrls,
  type RoleName,
  type RolePasswords,
} from "../lib/db/bootstrap.mts";

const fail = (message: string): never => {
  console.error(`db-bootstrap: ${message}`);
  process.exit(1);
};

const { values } = parseArgs({
  options: {
    branch: { type: "string" },
    dev: { type: "boolean", default: false },
    out: { type: "string" },
    role: { type: "string" },
  },
});

const branch = values.branch ?? fail("--branch <name> is required");
if (!/^[a-z0-9-]+$/.test(branch)) fail("--branch must be lowercase letters, digits or dashes");
if (branch === "production" && values.dev) fail("--dev is never used on production");
if (values.role !== undefined && !(ROLES as readonly string[]).includes(values.role))
  fail(`--role must be one of ${ROLES.join(", ")}`);
const roles: readonly RoleName[] = values.role ? [values.role as RoleName] : ROLES;

const ownerUrl = process.env.BOOTSTRAP_DATABASE_URL ?? fail("BOOTSTRAP_DATABASE_URL is not set");
const owner = new URL(ownerUrl);
if ((ROLES as readonly string[]).includes(owner.username))
  fail(`BOOTSTRAP_DATABASE_URL must be the branch owner, not ${owner.username}`);

// The output holds secrets: inside the repo it must be git-ignored.
const outPath = path.resolve(values.out ?? `.env.neon-${branch}.local`);
if (!path.relative(process.cwd(), outPath).startsWith("..")) {
  try {
    execFileSync("git", ["check-ignore", "-q", outPath]);
  } catch {
    fail(`${outPath} is not git-ignored; refusing to write secrets there`);
  }
}

// 32 random bytes per secret: far above Neon's 60-bit password minimum.
const secret = () => randomBytes(32).toString("base64url");
const passwords: Partial<RolePasswords> = Object.fromEntries(roles.map((role) => [role, secret()]));

const client = new pg.Client({ connectionString: ownerUrl });
await client.connect();
let created: RoleName[] = [];
try {
  await client.query("BEGIN");
  const { rows } = await client.query<{ rolname: string }>(
    "SELECT rolname FROM pg_roles WHERE rolname = ANY($1)",
    [roles],
  );
  const existing = new Set(rows.map((row) => row.rolname));
  created = roles.filter((role) => !existing.has(role));
  for (const statement of bootstrapStatements(passwords, existing, { dev: values.dev }))
    await client.query(statement);
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  // Postgres errors here never echo the statement, so no password leaks.
  fail(`failed and rolled back: ${(error as Error).message}`);
} finally {
  await client.end();
}

const urls = roleUrls(ownerUrl, passwords);
const lines: Record<RoleName, string[]> = {
  rhm_app: [
    "# rhm_app, pooled: runtime (Vercel env for this branch, or .env.local for dev)",
    `DATABASE_URL=${urls.rhm_app}`,
  ],
  rhm_migrator: [
    "# rhm_migrator, direct: GitHub Environment secret (or .env.local for dev). Never Vercel.",
    `MIGRATOR_DATABASE_URL=${urls.rhm_migrator}`,
  ],
  rhm_readonly: [
    "# rhm_readonly, direct: support and reporting",
    `READONLY_DATABASE_URL=${urls.rhm_readonly}`,
  ],
  rhm_retention: [
    "# rhm_retention, direct: production only, GitHub Environment `retention`. Never Vercel.",
    `RETENTION_DATABASE_URL=${urls.rhm_retention}`,
  ],
};
writeFileSync(
  outPath,
  [
    `# Written by scripts/db-bootstrap.mts for branch "${branch}" on ${new Date().toISOString()}.`,
    "# SECRETS. Copy each value to its home (Phase 7 spec -> Owner setup 5), then delete this file.",
    ...roles.flatMap((role) => lines[role]),
    ...(values.role
      ? []
      : [
          "# Salt for rate-limit key hashes (Vercel env for this branch, or .env.local for dev)",
          `RATE_LIMIT_SALT=${secret()}`,
        ]),
    "",
  ].join("\n"),
  { mode: 0o600 },
);

const rekeyed = roles.filter((role) => !created.includes(role));
console.log(
  `db-bootstrap: branch "${branch}" on ${owner.hostname}: ` +
    `created [${created.join(", ")}], re-keyed [${rekeyed.join(", ")}]` +
    (values.dev && roles.includes("rhm_migrator") ? ", rhm_migrator has CREATEDB (dev)" : "") +
    `.\nCredentials written to ${outPath} (no secrets printed).`,
);
