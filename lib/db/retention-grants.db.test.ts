import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testPg } from "./test-client";

// The retention job's role (Phase 23 spec, D7, C4): it may overwrite client details and delete
// old rate-limit rows, and nothing else. Every statement here is fixed text.

const DENIED = "42501"; // insufficient_privilege
const PERSONAL = ["clientName", "companyName", "email", "phone", "projectNotes"];

let retention: pg.Client;

beforeAll(async () => {
  retention = await testPg("retention");
});

afterAll(async () => {
  await retention?.end();
});

const scalar = async (sql: string) => Object.values((await retention.query(sql)).rows[0])[0];

describe("rhm_retention", () => {
  // A WHERE that matches nothing still needs every privilege the statement uses.
  it("can overwrite the personal columns and set anonymisedAt", async () => {
    const { rowCount } = await retention.query(
      `UPDATE "Inquiry"
          SET "clientName" = 'redacted', "companyName" = NULL, "email" = 'redacted',
              "phone" = 'redacted', "projectNotes" = 'redacted', "anonymisedAt" = now()
        WHERE "status" = 'CLOSED' AND "closedAt" IS NULL AND "anonymisedAt" IS NULL
          AND "id" = 'rhm-probe-none'`,
    );
    expect(rowCount).toBe(0);
  });

  it("can delete rate-limit rows by windowEnd", async () => {
    const { rowCount } = await retention.query(
      `DELETE FROM "RateLimitHit" WHERE "windowEnd" < '1970-01-02'`,
    );
    expect(rowCount).toBe(0);
  });

  it("cannot read any personal column, or the whole row", async () => {
    for (const column of [...PERSONAL, "services", "createdAt", "emailSentAt"])
      await expect(
        retention.query(`SELECT "${column}" FROM "Inquiry" LIMIT 1`),
        column,
      ).rejects.toMatchObject({ code: DENIED });
    await expect(retention.query('SELECT * FROM "Inquiry" LIMIT 1')).rejects.toMatchObject({
      code: DENIED,
    });
  });

  it("cannot read a personal column back through RETURNING", async () => {
    await expect(
      retention.query(
        `UPDATE "Inquiry" SET "anonymisedAt" = now() WHERE "id" = 'rhm-probe-none' RETURNING "email"`,
      ),
    ).rejects.toMatchObject({ code: DENIED });
  });

  it.each([
    ["delete inquiries", `DELETE FROM "Inquiry" WHERE "id" = 'rhm-probe-none'`],
    ["insert inquiries", `INSERT INTO "Inquiry" ("id") VALUES ('rhm-probe-none')`],
    ["change an inquiry's status", `UPDATE "Inquiry" SET "status" = 'NEW' WHERE false`],
    ["read rate-limit keys", `SELECT "keyHash" FROM "RateLimitHit" LIMIT 1`],
    ["read PortfolioItem", `SELECT "id" FROM "PortfolioItem" LIMIT 1`],
    ["read MediaItem", `SELECT "id" FROM "MediaItem" LIMIT 1`],
    ["read the migration history", "SELECT * FROM _prisma_migrations"],
    ["CREATE TABLE", "CREATE TABLE rhm_probe (id int)"],
    ["ALTER TABLE", 'ALTER TABLE "Inquiry" ADD COLUMN probe int'],
    ["DROP TABLE", 'DROP TABLE "RateLimitHit"'],
    ["TRUNCATE", 'TRUNCATE "RateLimitHit"'],
  ])("is refused: %s", async (_, sql) => {
    await expect(retention.query(sql)).rejects.toMatchObject({ code: DENIED });
  });

  it("has no CREATE on schema public", async () => {
    expect(await scalar("SELECT has_schema_privilege('public', 'CREATE')")).toBe(false);
  });

  it("is not a superuser, cannot create roles or databases, and belongs to no role", async () => {
    const { rows } = await retention.query(
      "SELECT rolsuper, rolcreaterole, rolcreatedb, rolbypassrls FROM pg_roles WHERE rolname = current_user",
    );
    expect(rows[0]).toEqual({
      rolsuper: false,
      rolcreaterole: false,
      rolcreatedb: false,
      rolbypassrls: false,
    });
    expect(
      await scalar(
        "SELECT count(*)::int FROM pg_auth_members WHERE member = (SELECT oid FROM pg_roles WHERE rolname = current_user)",
      ),
    ).toBe(0);
  });
});
