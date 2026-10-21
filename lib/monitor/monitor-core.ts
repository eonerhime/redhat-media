// The pure part of scripts/monitor.mts (Phase 15 spec, D7): what the hourly monitor checks and
// when each check fails. Every detail is a plain number or state, because Actions logs are public.

export type Check = { name: string; ok: boolean; detail: string };

/** Pages that must answer 200: one per template, plus the sitemap. */
export const sitePaths = [
  "/",
  "/services",
  "/services/photography",
  "/about",
  "/portfolio",
  "/portfolio/sportspred",
  "/contact",
  "/sitemap.xml",
] as const;

/** A URL no route matches, which must answer 404. */
export const missingPath = "/rhm-monitor-missing";

/** Connection saturation fails at this share of the usable connections. */
export const saturationLimit = 0.8;

/**
 * Query volume fails above this many transactions a minute, over a sample taken inside the run.
 * Pages are cached, so visitors barely reach the database: a busy e2e run against the dev branch
 * gave 6 a minute, and this is 10× that (plan task 4.2). Phase 16 confirmed it on production: a
 * sample on 2026-10-19 (monitor run 39262581542) gave 3 a minute, so the busier baseline is still
 * the preview's 6 and the limit stays 60, the floor.
 */
export const transactionsPerMinuteLimit = 60;

/** How long the monitor samples the transaction counter. */
export const sampleSeconds = 60;

/**
 * A compute younger than this is not sampled. Neon runs about a thousand transactions of its own
 * in a compute's first minute, and a compute under sustained load never suspends, so a young
 * compute means no sustained load.
 */
export const minUptimeSeconds = 300;

export function statusCheck(path: string, status: number, expected: number): Check {
  return { name: `GET ${path}`, ok: status === expected, detail: `${status} (want ${expected})` };
}

/** The /portfolio listing's data-state: "unavailable" means the database read failed. */
export function portfolioStateCheck(html: string): Check {
  const tag = /<[a-z]+\b[^>]*\bdata-testid="portfolio-listing"[^>]*>/.exec(html)?.[0] ?? "";
  const value = /\bdata-state="(\w+)"/.exec(tag)?.[1] ?? "missing";
  return { name: "portfolio listing", ok: value === "ready", detail: `state ${value}` };
}

export function saturationCheck(active: number, maxConnections: number, reserved: number): Check {
  const usable = maxConnections - reserved;
  const share = usable > 0 ? active / usable : 1;
  return {
    name: "connection saturation",
    ok: share < saturationLimit,
    detail: `${active} of ${usable} usable (${Math.round(share * 100)}%, limit ${saturationLimit * 100}%)`,
  };
}

/** `transactions` counted over `seconds`, on a compute that started `uptimeSeconds` before. */
export function volumeCheck(transactions: number, seconds: number, uptimeSeconds: number): Check {
  if (uptimeSeconds < minUptimeSeconds) {
    return {
      name: "query volume",
      ok: true,
      detail: `not sampled: compute started ${Math.round(uptimeSeconds)} s ago`,
    };
  }
  const rate = Math.round(transactions / (seconds / 60));
  return {
    name: "query volume",
    ok: rate <= transactionsPerMinuteLimit,
    detail: `${rate} transactions/min over ${seconds} s (limit ${transactionsPerMinuteLimit})`,
  };
}

/**
 * Phase 20 spec, D10: an inquiry is reported when its team notification is still unsent this many
 * minutes after it was saved, which leaves the send after the response time to finish or fail.
 */
export const unsentGraceMinutes = 15;

/** …and for this many hours, so an unhandled failure alerts for a day rather than forever. */
export const unsentWindowHours = 24;

/**
 * Counts unsent team notifications. rhm_readonly may read only "createdAt" and "emailSentAt"
 * (Phase 20 spec, D10). "createdAt" is a UTC timestamp without a zone, so now() is taken in UTC.
 */
export const unsentNotificationsSql = `
  SELECT count(*)::int AS unsent FROM "Inquiry"
  WHERE "emailSentAt" IS NULL
    AND "createdAt" < (now() AT TIME ZONE 'UTC') - make_interval(mins => $1)
    AND "createdAt" >= (now() AT TIME ZONE 'UTC') - make_interval(hours => $2)`;

export function unsentNotificationsCheck(unsent: number): Check {
  return {
    name: "inquiry notifications",
    ok: unsent === 0,
    detail:
      unsent === 0
        ? `none unsent (${unsentGraceMinutes} min to ${unsentWindowHours} h old)`
        : `${unsent} unsent ${unsentGraceMinutes} min to ${unsentWindowHours} h after saving (see docs/runbooks/monitoring.md)`,
  };
}

/** The deliberate failure behind a test alert. */
export const testAlertCheck: Check = {
  name: "test alert",
  ok: false,
  detail: "TEST ALERT — not an incident",
};

export function report(checks: readonly Check[]): { ok: boolean; lines: string[] } {
  return {
    ok: checks.every((check) => check.ok),
    lines: checks.map((check) => `${check.ok ? "ok  " : "FAIL"} ${check.name}: ${check.detail}`),
  };
}
