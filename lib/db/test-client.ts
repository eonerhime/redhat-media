// Clients for the database tests (`pnpm test:db`; Phase 7 spec, D9). Never
// imported by app code. They connect over TCP with @prisma/adapter-pg, which a
// plain Postgres container serves; the runtime uses @prisma/adapter-neon.
//
// Each variable is a URL for one role, as written by scripts/db-bootstrap.mts:
//   TEST_APP_DATABASE_URL       rhm_app
//   TEST_MIGRATOR_DATABASE_URL  rhm_migrator
//   TEST_READONLY_DATABASE_URL  rhm_readonly

import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const ROLE_VARS = {
  app: "TEST_APP_DATABASE_URL",
  migrator: "TEST_MIGRATOR_DATABASE_URL",
  readonly: "TEST_READONLY_DATABASE_URL",
} as const;

export type TestRole = keyof typeof ROLE_VARS;

export function testUrl(role: TestRole): string {
  const url = process.env[ROLE_VARS[role]];
  if (!url) throw new Error(`${ROLE_VARS[role]} is not set (see lib/db/test-client.ts)`);
  return url;
}

/** Prisma client as rhm_app, the runtime role. */
export function testPrisma(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: testUrl("app") }) });
}

/** A connected `pg` client for one role, for privilege probes. */
export async function testPg(role: TestRole): Promise<pg.Client> {
  const client = new pg.Client({ connectionString: testUrl(role) });
  await client.connect();
  return client;
}
