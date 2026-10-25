// The daily retention job (Phase 23 spec, D5, D6, D9): what scripts/retention.mts runs, as
// fixed, parameterised SQL. The client is a parameter, so retention.db.test.ts runs these against
// the CI Postgres as rhm_retention, whose column grants (D7) allow exactly these statements.
//
// Columns are TIMESTAMP(3) holding UTC (Prisma's default), so `now` is turned into UTC wall time
// in SQL: the cut-offs do not depend on the session's TimeZone. Postgres month arithmetic clamps
// to the month's end (29 Feb minus 24 months is 28 Feb).

/** What the job needs of a `pg` client. */
export type Queryable = {
  query(sql: string, values: unknown[]): Promise<{ rowCount: number | null }>;
};

/** Closed inquiries are anonymised this long after `closedAt` (`privacy.retention.body`). */
export const anonymiseAfterMonths = 24;

/** Rate-limit rows are deleted this long after their window ends (`privacy.retention.body`). */
export const purgeAfterDays = 30;

/** The value that overwrites each required personal column (Phase 17 spec: overwrite, don't null). */
export const REDACTED = "redacted";

export const anonymiseSql = `
  UPDATE "Inquiry"
     SET "clientName" = $3, "companyName" = NULL, "email" = $3, "phone" = $3,
         "projectNotes" = $3, "anonymisedAt" = ($1::timestamptz AT TIME ZONE 'UTC')
   WHERE "status" = 'CLOSED'
     AND "anonymisedAt" IS NULL
     AND "closedAt" < ($1::timestamptz AT TIME ZONE 'UTC') - make_interval(months => $2)`;

export const purgeSql = `
  DELETE FROM "RateLimitHit"
   WHERE "windowEnd" < ($1::timestamptz AT TIME ZONE 'UTC') - make_interval(days => $2)`;

/**
 * Overwrites the personal fields of every inquiry closed more than 24 months before `now`, keeping
 * its scope, status, consent and dates, and stamps `anonymisedAt`. A row already anonymised is never
 * touched again, so a second run changes nothing. Returns the number of rows anonymised.
 */
export async function anonymiseClosedInquiries(client: Queryable, now: Date): Promise<number> {
  const { rowCount } = await client.query(anonymiseSql, [
    now.toISOString(),
    anonymiseAfterMonths,
    REDACTED,
  ]);
  return rowCount ?? 0;
}

/** Deletes the rate-limit rows whose window ended more than 30 days before `now`. */
export async function purgeRateLimitHits(client: Queryable, now: Date): Promise<number> {
  const { rowCount } = await client.query(purgeSql, [now.toISOString(), purgeAfterDays]);
  return rowCount ?? 0;
}
