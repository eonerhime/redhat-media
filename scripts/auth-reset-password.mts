// Resets a staff member's password (Phase 24 spec, D10), until self-service
// reset arrives with the domain amendment and staff management with Phase 33.
//
//   pnpm auth:reset-password --branch dev --email someone@example.com [--reset-2fa]
//
// Sets a new random password (written to the git-ignored
// .env.admin-<branch>.local, never printed), ends every session and clears both
// lockouts. --reset-2fa also removes their 2FA, for a lost phone with no backup
// codes left: the next sign-in sets it up again. Refuses production.

import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { adminSecretsFile, assertAuthScriptTarget } from "../lib/auth/script-target.ts";
import { newStaffPassword, resetStaffPassword } from "../lib/auth/staff-admin.ts";
import { PrismaClient } from "../lib/generated/prisma/client.ts";

const fail = (message: string): never => {
  console.error(`auth-reset-password: ${message}`);
  process.exit(1);
};

const { values } = parseArgs({
  options: {
    branch: { type: "string" },
    email: { type: "string" },
    "reset-2fa": { type: "boolean", default: false },
  },
});

if (existsSync(".env.local") && !process.env.MIGRATOR_DATABASE_URL)
  process.loadEnvFile(".env.local");

const branch = values.branch ?? fail("--branch <name> is required");
const email = values.email ?? fail("--email <address> is required");

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
  const password = newStaffPassword();
  const reset2fa = values["reset-2fa"];
  if (!(await resetStaffPassword(db, { email, password, reset2fa })))
    fail(`no staff account ${email} on ${host}`);
  writeFileSync(
    outPath,
    [
      `# Written by scripts/auth-reset-password.mts for branch "${branch}" on ${new Date().toISOString()}.`,
      "# SECRET. Pass it on securely, then delete this file.",
      `RESET_EMAIL=${email.toLowerCase()}`,
      `RESET_PASSWORD=${password}`,
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  console.log(
    `auth-reset-password: ${email} on ${host}: new password, sessions ended, lockouts cleared` +
      (reset2fa ? ", 2FA removed (set up again at next sign-in)" : "") +
      `.\nPassword written to ${outPath} (not printed).`,
  );
} finally {
  await db.$disconnect();
}
