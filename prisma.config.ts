import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma CLI config (Phase 7 spec, D5). The CLI connects as rhm_migrator:
// locally through .env.local (Neon dev branch), in CI through the job's env.
// The runtime client never reads this file; it uses DATABASE_URL (lib/db.ts).
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON prisma/seed.mts",
  },
  datasource: {
    // Read directly rather than through env(), which throws when unset:
    // `prisma generate` runs on every install, with no database configured.
    url: process.env.MIGRATOR_DATABASE_URL ?? "",
  },
});
