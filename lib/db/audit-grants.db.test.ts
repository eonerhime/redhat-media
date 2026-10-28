import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testPg } from "./test-client";

// The audit log (Phase 25 spec, D6): rhm_app may add to it and read it, never rewrite it, and
// neither rhm_readonly nor rhm_retention can see it. Every statement here is fixed text.

const DENIED = "42501"; // insufficient_privilege

let app: pg.Client;
let readonly: pg.Client;
let retention: pg.Client;

beforeAll(async () => {
  [app, readonly, retention] = await Promise.all([
    testPg("app"),
    testPg("readonly"),
    testPg("retention"),
  ]);
});

afterAll(async () => {
  await Promise.all([app?.end(), readonly?.end(), retention?.end()]);
});

describe("rhm_app on AuditEvent", () => {
  it("can insert and read an event", async () => {
    await app.query("BEGIN");
    try {
      await app.query(
        `INSERT INTO "AuditEvent" ("id", "action", "entityType", "entityId", "diff")
         VALUES ('rhm-probe-audit', 'probe.insert', 'probe', 'p1', '{"a":1}')`,
      );
      const { rows } = await app.query(
        `SELECT "actorId", "action", "diff" FROM "AuditEvent" WHERE "id" = 'rhm-probe-audit'`,
      );
      expect(rows[0]).toEqual({ actorId: null, action: "probe.insert", diff: { a: 1 } });
    } finally {
      await app.query("ROLLBACK");
    }
  });

  it("cannot update or delete an event", async () => {
    await expect(
      app.query(`UPDATE "AuditEvent" SET "action" = 'x' WHERE "id" = 'none'`),
    ).rejects.toMatchObject({ code: DENIED });
    await expect(app.query(`DELETE FROM "AuditEvent" WHERE "id" = 'none'`)).rejects.toMatchObject({
      code: DENIED,
    });
    await expect(app.query(`TRUNCATE "AuditEvent"`)).rejects.toMatchObject({ code: DENIED });
  });
});

describe("other roles on AuditEvent", () => {
  it("rhm_readonly cannot read it", async () => {
    await expect(readonly.query(`SELECT 1 FROM "AuditEvent" LIMIT 1`)).rejects.toMatchObject({
      code: DENIED,
    });
  });

  it("rhm_retention cannot read it", async () => {
    await expect(retention.query(`SELECT 1 FROM "AuditEvent" LIMIT 1`)).rejects.toMatchObject({
      code: DENIED,
    });
  });
});
