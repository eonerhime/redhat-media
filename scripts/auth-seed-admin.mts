// Creates the first admin on a branch (Phase 24 spec, D12).
//
//   pnpm auth:seed-admin --branch dev --email you@example.com --name "Your Name"
//
// For dev, MIGRATOR_DATABASE_URL comes from .env.local. For preview it is kept
// only in the GitHub secret, so re-key rhm_migrator first (db-bootstrap.mts
// --branch preview --role rhm_migrator writes .env.neon-preview.local), update
// that secret from the file, set the variable in the shell from it, and delete
// the file afterwards.
// The random password is written to the git-ignored .env.admin-<branch>.local
// and never printed. Sign in at /admin, then set up 2FA. Refuses production
// and an email that already exists (use pnpm auth:reset-password).

import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { adminSecretsFile, assertAuthScriptTarget } from "../lib/auth/script-target.ts";
import { newStaffPassword, seedAdmin } from "../lib/auth/staff-admin.ts";
import { PrismaClient } from "../lib/generated/prisma/client.ts";

const fail = (message: string): never => {
  console.error(`auth-seed-admin: ${message}`);
  process.exit(1);
};

const { values } = parseArgs({
  options: {
    branch: { type: "string" },
    email: { type: "string" },
    name: { type: "string" },
  },
});

if (existsSync(".env.local") && !process.env.MIGRATOR_DATABASE_URL)
  process.loadEnvFile(".env.local");

const branch = values.branch ?? fail("--branch <name> is required");
const email = values.email ?? fail("--email <address> is required");
const name = values.name ?? fail("--name <full name> is required");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("--email is not an email address");

let host = "";
let outPath = "";
try {
  host = assertAuthScriptTarget(process.env.MIGRATOR_DATABASE_URL, {
    VERCEL_ENV: process.env.VERCEL_ENV,
  });
  outPath = path.resolve(adminSecretsFile(branch));
  execFileSync("git", ["check-ignore", "-q", outPath]);
} catch (error) {
  fail(error instanceof Error && error.message ? error.message : `${outPath} is not git-ignored`);
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.MIGRATOR_DATABASE_URL }),
});
try {
  if (await db.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } }))
    fail(`${email} already exists on ${host}; use pnpm auth:reset-password`);
  const password = newStaffPassword();
  const user = await seedAdmin(db, { email, name, password });
  writeFileSync(
    outPath,
    [
      `# Written by scripts/auth-seed-admin.mts for branch "${branch}" on ${new Date().toISOString()}.`,
      "# SECRET. Store it in your password manager, then delete this file.",
      `ADMIN_EMAIL=${user.email}`,
      `ADMIN_PASSWORD=${password}`,
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  console.log(
    `auth-seed-admin: admin ${user.email} created on ${host}.\n` +
      `Password written to ${outPath} (not printed). Sign in at /admin and set up 2FA.`,
  );
} finally {
  await db.$disconnect();
}
