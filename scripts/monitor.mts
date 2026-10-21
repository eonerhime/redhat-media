// The hourly monitor (Phase 15 spec, D7): the site's templates answer, an unknown URL 404s, the
// portfolio reads from the database, Neon's connections and query volume are within limits, and,
// from Phase 20 (spec, D10), no recent inquiry is missing its team notification.
// Exits 1 on any failure; GitHub then emails the owner. Runs on Node 24, which strips TypeScript
// types natively.
//
// Usage: node scripts/monitor.mts
// Env:   MONITOR_BASE_URL (the origin to check)
//        MONITOR_DATABASE_URL (rhm_readonly, direct connection, sslmode=require)
//        VERCEL_AUTOMATION_BYPASS_SECRET (for a protected preview; sent to that origin only)
//        MONITOR_TEST_ALERT=1 (fail on purpose after the real checks)
//
// Prints check names, states and numbers only: the Actions logs of this repository are public.

import pg from "pg";
import {
  type Check,
  minUptimeSeconds,
  missingPath,
  portfolioStateCheck,
  report,
  sampleSeconds,
  saturationCheck,
  sitePaths,
  statusCheck,
  testAlertCheck,
  unsentGraceMinutes,
  unsentNotificationsCheck,
  unsentNotificationsSql,
  unsentWindowHours,
  volumeCheck,
} from "../lib/monitor/monitor-core.ts";

const fail = (message: string): never => {
  console.error(`monitor: ${message}`);
  process.exit(1);
};

const origin = new URL(process.env.MONITOR_BASE_URL || fail("MONITOR_BASE_URL is not set")).origin;
const databaseUrl = process.env.MONITOR_DATABASE_URL || fail("MONITOR_DATABASE_URL is not set");
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

/** GET on the monitored origin only; redirects are not followed, so nothing else is contacted. */
async function get(path: string) {
  const res = await fetch(`${origin}${path}`, {
    redirect: "manual",
    headers: bypass ? { "x-vercel-protection-bypass": bypass } : {},
    signal: AbortSignal.timeout(30_000),
  });
  return { status: res.status, body: await res.text() };
}

async function siteChecks(): Promise<Check[]> {
  const checks: Check[] = [];
  for (const path of sitePaths) {
    try {
      const { status, body } = await get(path);
      checks.push(statusCheck(path, status, 200));
      if (path === "/portfolio" && status === 200) checks.push(portfolioStateCheck(body));
    } catch (error) {
      checks.push({ name: `GET ${path}`, ok: false, detail: (error as Error).name });
    }
  }
  try {
    checks.push(statusCheck(missingPath, (await get(missingPath)).status, 404));
  } catch (error) {
    checks.push({ name: `GET ${missingPath}`, ok: false, detail: (error as Error).name });
  }
  return checks;
}

/** Its own check, so a missing grant reports here rather than as an unreachable database. */
async function unsentCheck(client: pg.Client): Promise<Check> {
  try {
    const { rows } = await client.query<{ unsent: number }>(unsentNotificationsSql, [
      unsentGraceMinutes,
      unsentWindowHours,
    ]);
    return unsentNotificationsCheck(rows[0]!.unsent);
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    return { name: "inquiry notifications", ok: false, detail: `${(error as Error).name} ${code}` };
  }
}

async function databaseChecks(): Promise<Check[]> {
  const client = new pg.Client({ connectionString: databaseUrl, connectionTimeoutMillis: 30_000 });
  try {
    await client.connect();
    const sample = async () => {
      const { rows } = await client.query<{
        active: string;
        max_connections: string;
        reserved: string;
        transactions: string;
        uptime: string;
      }>(`
        SELECT
          (SELECT count(*) FROM pg_stat_activity WHERE backend_type = 'client backend') AS active,
          current_setting('max_connections') AS max_connections,
          current_setting('superuser_reserved_connections') AS reserved,
          (SELECT xact_commit + xact_rollback FROM pg_stat_database
            WHERE datname = current_database()) AS transactions,
          extract(epoch FROM now() - pg_postmaster_start_time()) AS uptime
      `);
      return rows[0]!;
    };
    const first = await sample();
    const uptime = Number(first.uptime);
    // A young compute is not sampled (monitor-core), so the wait is skipped too.
    let transactions = 0;
    if (uptime >= minUptimeSeconds) {
      await new Promise((resolve) => setTimeout(resolve, sampleSeconds * 1000));
      transactions = Number((await sample()).transactions) - Number(first.transactions);
    }
    return [
      { name: "database reachable", ok: true, detail: "SELECT ok" },
      saturationCheck(Number(first.active), Number(first.max_connections), Number(first.reserved)),
      volumeCheck(transactions, sampleSeconds, uptime),
      await unsentCheck(client),
    ];
  } catch (error) {
    // The message of a connection error can name the host; print only its class and code.
    const code = (error as { code?: string }).code ?? "";
    return [{ name: "database reachable", ok: false, detail: `${(error as Error).name} ${code}` }];
  } finally {
    await client.end().catch(() => {});
  }
}

const checks = [...(await siteChecks()), ...(await databaseChecks())];
if (process.env.MONITOR_TEST_ALERT === "1") checks.push(testAlertCheck);

const result = report(checks);
console.log(`Monitor of ${origin}:`);
for (const line of result.lines) console.log(line);
if (!result.ok) process.exit(1);
