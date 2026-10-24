// The daily retention job (Phase 23 spec, D5-D10): anonymise inquiries closed more than 24 months
// ago, and delete rate-limit rows whose window ended more than 30 days ago, as the privacy notice
// promises (`privacy.retention.body`). Exits 1 on any failure; GitHub then emails the owner. Runs
// on Node 24, which strips TypeScript types natively.
//
// Usage: node scripts/retention.mts
// Env:   RETENTION_DATABASE_URL (rhm_retention, direct connection, sslmode=require)
//        RETENTION_TEST_ALERT=1 (fail on purpose after the real run)
//
// Prints counts only, never row data or connection details: the Actions logs of this repository
// are public (C4).

import pg from "pg";
import { anonymiseClosedInquiries, purgeRateLimitHits } from "../lib/retention/core.ts";

const databaseUrl =
  process.env.RETENTION_DATABASE_URL ||
  (console.error("retention: RETENTION_DATABASE_URL is not set"), process.exit(1));

const now = new Date();
const client = new pg.Client({ connectionString: databaseUrl, connectionTimeoutMillis: 30_000 });
let ok = true;
try {
  await client.connect();
  const anonymised = await anonymiseClosedInquiries(client, now);
  const purged = await purgeRateLimitHits(client, now);
  console.log(
    `Retention run at ${now.toISOString()}: anonymised: ${anonymised}, purged: ${purged}`,
  );
} catch (error) {
  // A connection error's message can name the host; print only its class and code.
  const code = (error as { code?: string }).code ?? "";
  console.error(`FAIL retention: ${(error as Error).name} ${code}`);
  ok = false;
} finally {
  await client.end().catch(() => {});
}

if (process.env.RETENTION_TEST_ALERT === "1") {
  console.error("FAIL test alert: TEST ALERT — not an incident");
  ok = false;
}
if (!ok) process.exit(1);
