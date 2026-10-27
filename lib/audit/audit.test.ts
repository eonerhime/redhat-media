import { afterEach, describe, expect, it, vi } from "vitest";
import { audit, type AuditDb, auditBestEffort, type AuditEventInput } from "./audit";

// audit() and auditBestEffort() (Phase 25 spec, D4, D5). audit.db.test.ts covers
// the transaction against Postgres.

afterEach(() => vi.restoreAllMocks());

function fakeDb(fail = false) {
  const create = vi.fn(async (args: unknown) => {
    if (fail) throw new Error("connection refused");
    return args;
  });
  return { db: { auditEvent: { create } } as unknown as AuditDb, create };
}

const event: AuditEventInput = {
  actorId: "user-1",
  action: "content.update",
  entityType: "contentBlock",
  entityId: "home.hero.title",
  diff: { before: "Old", after: "New" },
};

describe("audit()", () => {
  it("writes the event as given", async () => {
    const { db, create } = fakeDb();
    await audit(db, event);
    expect(create).toHaveBeenCalledExactlyOnceWith({
      data: {
        actorId: "user-1",
        action: "content.update",
        entityType: "contentBlock",
        entityId: "home.hero.title",
        diff: { before: "Old", after: "New" },
      },
    });
  });

  it("leaves diff out when there is none, and keeps a null actor", async () => {
    const { db, create } = fakeDb();
    await audit(db, { actorId: null, action: "auth.lockout", entityType: "user", entityId: "u1" });
    expect(create.mock.calls[0]?.[0]).toEqual({
      data: { actorId: null, action: "auth.lockout", entityType: "user", entityId: "u1" },
    });
  });

  it.each(["contentUpdate", "Content.update", "content.", ".update", "content update"])(
    "refuses the action name %j (area.verb only)",
    async (action) => {
      const { db, create } = fakeDb();
      await expect(audit(db, { ...event, action })).rejects.toThrow(/area\.verb/);
      expect(create).not.toHaveBeenCalled();
    },
  );

  it.each([
    "password",
    "newPassword",
    "passwordHash",
    "secret",
    "totpSecret",
    "token",
    "sessionToken",
    "backupCodes",
    "backup_codes",
    "otpCode",
    "cookie",
    "apiKey",
  ])("never records a %s key, at any depth", async (key) => {
    const { db, create } = fakeDb();
    await expect(audit(db, { ...event, diff: { [key]: "x" } })).rejects.toThrow(/credential/);
    await expect(audit(db, { ...event, diff: { user: [{ [key]: "x" }] } })).rejects.toThrow(
      /credential/,
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("lets ordinary keys through", async () => {
    const { db, create } = fakeDb();
    await audit(db, {
      ...event,
      diff: { reset2fa: true, via: "2fa", role: "admin", muted: false },
    });
    expect(create).toHaveBeenCalledOnce();
  });
});

describe("auditBestEffort()", () => {
  it("logs one audit.write_failed line with the action and entity only, and does not throw", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db } = fakeDb(true);
    await expect(auditBestEffort(db, event)).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledExactlyOnceWith(
      JSON.stringify({
        event: "audit.write_failed",
        action: "content.update",
        entityType: "contentBlock",
        entityId: "home.hero.title",
      }),
    );
    expect(String(error.mock.calls[0]?.[0])).not.toContain("New");
  });
});
