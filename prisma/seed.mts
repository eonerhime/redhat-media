// Seed script for preview and dev branches only (tech-stack.md → Database
// security: production holds no seed data). Run with `pnpm db:seed`; CI runs it
// on the preview branch after migrating (Phase 9 spec, D7, D8).
//
// It connects as rhm_migrator over TCP (@prisma/adapter-pg), which serves both
// Neon and the CI Postgres container. Covers are uploaded separately by
// `pnpm media:upload-seed`; this script only writes their public IDs.

import { existsSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertSeedTarget } from "../lib/db/seed-guard.ts";
import { runSeed } from "../lib/db/seed.ts";
import { PrismaClient } from "../lib/generated/prisma/client.ts";
import { portfolioSeed } from "./seed-data/portfolio.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.MIGRATOR_DATABASE_URL;
const host = assertSeedTarget(url, {
  VERCEL_ENV: process.env.VERCEL_ENV,
  SEED_ALLOW_PRODUCTION: process.env.SEED_ALLOW_PRODUCTION,
});
console.log(`Seed: target ${host}`);

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
try {
  const { created, updated, covers } = await runSeed(db, portfolioSeed);
  console.log(`Seed: portfolio items ${created} created, ${updated} updated; ${covers} covers.`);
} finally {
  await db.$disconnect();
}
