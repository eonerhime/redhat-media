import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testPg } from "./test-client";

// The Better Auth tables (Phase 24 spec, D1, D15): rhm_app runs them, rhm_readonly cannot see
// them, and the database itself restricts the role. Every statement here is fixed text.

const DENIED = "42501"; // insufficient_privilege
const CHECK_VIOLATION = "23514";
const AUTH_TABLES = ["user", "session", "account", "verification", "twoFactor"];

let app: pg.Client;
let readonly: pg.Client;

beforeAll(async () => {
  [app, readonly] = await Promise.all([testPg("app"), testPg("readonly")]);
});

afterAll(async () => {
  await Promise.all([app?.end(), readonly?.end()]);
});

describe("rhm_readonly", () => {
  it("cannot read any auth table", async () => {
    for (const table of AUTH_TABLES)
      await expect(readonly.query(`SELECT 1 FROM "${table}" LIMIT 1`), table).rejects.toMatchObject(
        { code: DENIED },
      );
  });
});

describe("rhm_app on the auth tables", () => {
  it("can insert, read, update and delete a user, its session and its 2FA row", async () => {
    await app.query("BEGIN");
    try {
      await app.query(
        `INSERT INTO "user" ("id", "name", "email", "updatedAt")
         VALUES ('rhm-probe-user', 'Probe', 'probe@example.test', now())`,
      );
      await app.query(
        `INSERT INTO "session" ("id", "expiresAt", "token", "updatedAt", "userId")
         VALUES ('rhm-probe-session', now(), 'rhm-probe-token', now(), 'rhm-probe-user')`,
      );
      await app.query(
        `INSERT INTO "twoFactor" ("id", "secret", "backupCodes", "userId")
         VALUES ('rhm-probe-2fa', 'x', 'x', 'rhm-probe-user')`,
      );
      const { rows } = await app.query(
        `SELECT "role", "failedSignInCount" FROM "user" WHERE "id" = 'rhm-probe-user'`,
      );
      expect(rows[0]).toEqual({ role: "sales", failedSignInCount: 0 });
      await app.query(`UPDATE "user" SET "role" = 'editor' WHERE "id" = 'rhm-probe-user'`);
      const deleted = await app.query(`DELETE FROM "user" WHERE "id" = 'rhm-probe-user'`);
      expect(deleted.rowCount).toBe(1);
      // The session and 2FA rows go with the user (ON DELETE CASCADE).
      const left = await app.query(`SELECT 1 FROM "session" WHERE "id" = 'rhm-probe-session'`);
      expect(left.rowCount).toBe(0);
    } finally {
      await app.query("ROLLBACK");
    }
  });

  it("cannot store a role outside admin, editor and sales", async () => {
    await expect(
      app.query(
        `INSERT INTO "user" ("id", "name", "email", "updatedAt", "role")
         VALUES ('rhm-probe-owner', 'Probe', 'owner@example.test', now(), 'owner')`,
      ),
    ).rejects.toMatchObject({ code: CHECK_VIOLATION });
  });

  it("cannot store a negative failure count", async () => {
    await expect(
      app.query(
        `INSERT INTO "user" ("id", "name", "email", "updatedAt", "failedSignInCount")
         VALUES ('rhm-probe-negative', 'Probe', 'negative@example.test', now(), -1)`,
      ),
    ).rejects.toMatchObject({ code: CHECK_VIOLATION });
  });

  it("cannot change the auth tables' structure", async () => {
    await expect(app.query(`ALTER TABLE "user" ADD COLUMN "rhm_probe" TEXT`)).rejects.toMatchObject(
      { code: DENIED },
    );
  });
});
