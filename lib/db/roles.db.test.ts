import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testPg } from "./test-client";

// Least-privilege roles (Phase 7 spec, D3, D4, D9). Roadmap "Done when": a
// test proves rhm_app cannot run DDL. Every statement here is fixed text.

const TABLES = ['"PortfolioItem"', '"MediaItem"', '"RateLimitHit"'];
const DENIED = "42501"; // insufficient_privilege

let app: pg.Client;
let readonly: pg.Client;
let migrator: pg.Client;

beforeAll(async () => {
  [app, readonly, migrator] = await Promise.all([
    testPg("app"),
    testPg("readonly"),
    testPg("migrator"),
  ]);
});

afterAll(async () => {
  await Promise.all([app, readonly, migrator].map((client) => client?.end()));
});

const scalar = async (client: pg.Client, sql: string) =>
  Object.values((await client.query(sql)).rows[0])[0];

describe("rhm_app (runtime)", () => {
  it.each([
    ["CREATE TABLE", "CREATE TABLE rhm_probe (id int)"],
    ["ALTER TABLE", 'ALTER TABLE "RateLimitHit" ADD COLUMN probe int'],
    ["DROP TABLE", 'DROP TABLE "RateLimitHit"'],
    ["TRUNCATE", 'TRUNCATE "RateLimitHit"'],
    ["CREATE TYPE", "CREATE TYPE rhm_probe AS ENUM ('x')"],
    ["read the migration history", "SELECT * FROM _prisma_migrations"],
  ])("is refused %s", async (_, sql) => {
    await expect(app.query(sql)).rejects.toMatchObject({ code: DENIED });
  });

  it("has no CREATE on schema public", async () => {
    expect(await scalar(app, "SELECT has_schema_privilege('public', 'CREATE')")).toBe(false);
  });

  it("has SELECT, INSERT, UPDATE and DELETE on every app table, through default privileges", async () => {
    for (const table of TABLES)
      for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"])
        expect(
          await scalar(app, `SELECT has_table_privilege('${table}', '${privilege}')`),
          `${privilege} on ${table}`,
        ).toBe(true);
  });

  it("has no TRUNCATE, REFERENCES or TRIGGER", async () => {
    for (const table of TABLES)
      for (const privilege of ["TRUNCATE", "REFERENCES", "TRIGGER"])
        expect(
          await scalar(app, `SELECT has_table_privilege('${table}', '${privilege}')`),
          `${privilege} on ${table}`,
        ).toBe(false);
  });

  it("is not a superuser, cannot create roles or databases, and belongs to no role", async () => {
    const { rows } = await app.query(
      "SELECT rolsuper, rolcreaterole, rolcreatedb, rolbypassrls FROM pg_roles WHERE rolname = current_user",
    );
    expect(rows[0]).toEqual({
      rolsuper: false,
      rolcreaterole: false,
      rolcreatedb: false,
      rolbypassrls: false,
    });
    // On Neon this also proves it is not in neon_superuser.
    expect(
      await scalar(
        app,
        "SELECT count(*)::int FROM pg_auth_members WHERE member = (SELECT oid FROM pg_roles WHERE rolname = current_user)",
      ),
    ).toBe(0);
  });
});

describe("rhm_readonly", () => {
  it("can read app tables", async () => {
    await expect(readonly.query('SELECT count(*) FROM "PortfolioItem"')).resolves.toBeDefined();
  });

  it("is refused writes and DDL", async () => {
    await expect(
      readonly.query(
        `INSERT INTO "RateLimitHit" (id, bucket, "keyHash", "windowEnd") VALUES ('x', 'x', 'x', now())`,
      ),
    ).rejects.toMatchObject({ code: DENIED });
    await expect(readonly.query("CREATE TABLE rhm_probe (id int)")).rejects.toMatchObject({
      code: DENIED,
    });
  });
});

describe("rhm_migrator", () => {
  it("owns every app table", async () => {
    const { rows } = await migrator.query(
      "SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('PortfolioItem', 'MediaItem', 'RateLimitHit') ORDER BY tablename",
    );
    expect(rows).toEqual([
      { tablename: "MediaItem", tableowner: "rhm_migrator" },
      { tablename: "PortfolioItem", tableowner: "rhm_migrator" },
      { tablename: "RateLimitHit", tableowner: "rhm_migrator" },
    ]);
  });
});
