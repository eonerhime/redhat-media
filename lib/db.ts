import "server-only";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { env } from "@/lib/env";
import { PrismaClient } from "@/lib/generated/prisma/client";

// The one runtime database client (Phase 7 spec, D6). It connects as rhm_app
// through Neon's pooled WebSocket endpoint. Node 24 has a global WebSocket, so
// the `ws` package is not needed.
neonConfig.webSocketConstructor = WebSocket;

// One client per process. Kept on globalThis so dev hot reloads, which
// re-evaluate this module, reuse it instead of opening a new pool.
const globalForDb = globalThis as typeof globalThis & { rhmDb?: PrismaClient };

/**
 * Returns the shared Prisma client, creating it on first use. Nothing connects
 * at import or build time, so static pages stay static.
 */
export function getDb(): PrismaClient {
  if (!globalForDb.rhmDb) {
    if (!env.databaseUrl) throw new Error("DATABASE_URL is not set (see .env.example)");
    globalForDb.rhmDb = new PrismaClient({
      adapter: new PrismaNeon({ connectionString: env.databaseUrl }),
    });
  }
  return globalForDb.rhmDb;
}
