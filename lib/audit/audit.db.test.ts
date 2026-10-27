import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createStaffUser, resetStaffPassword, seedAdmin } from "@/lib/auth/staff-admin";
import { type AuthKit, createAuthKit, TEST_PASSWORD } from "@/lib/auth/testing/auth-kit";
import { wrongTotpCode } from "@/lib/auth/test-totp";
import { testPrisma } from "@/lib/db/test-client";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { audit } from "./audit";

// AuditEvent writes on Postgres (Phase 25 spec, D5, D7): the transaction rule,
// the auth events through the real handler as rhm_app, and the owner scripts'
// events through their core functions as rhm_migrator, as the scripts run.
// rhm_app cannot delete audit rows (D6), so cleanup runs as rhm_migrator.

let app: PrismaClient;
let migrator: PrismaClient;
let kit: AuthKit;
const entityIds: string[] = [];

beforeAll(() => {
  app = testPrisma("app");
  migrator = testPrisma("migrator");
  kit = createAuthKit(app, { ipOffset: 600 });
});

afterAll(async () => {
  await kit.cleanup();
  await migrator.auditEvent.deleteMany({ where: { entityId: { in: entityIds } } });
  await migrator.user.deleteMany({ where: { id: { in: entityIds } } });
  await Promise.all([app.$disconnect(), migrator.$disconnect()]);
});

async function eventsFor(entityId: string) {
  entityIds.push(entityId);
  return app.auditEvent.findMany({
    where: { entityId },
    orderBy: { createdAt: "asc" },
    select: { actorId: true, action: true, entityType: true, diff: true },
  });
}

describe("the same transaction (D5)", () => {
  it("leaves neither the change nor its event when the transaction fails afterwards", async () => {
    const email = `rollback-${kit.run}@example.test`;
    let userId = "";
    await expect(
      app.$transaction(async (tx) => {
        const user = await createStaffUser(tx, {
          email,
          name: "rollback",
          role: "sales",
          password: TEST_PASSWORD,
        });
        userId = user.id;
        await audit(tx, {
          actorId: null,
          action: "probe.create",
          entityType: "user",
          entityId: user.id,
        });
        throw new Error("fails after both writes");
      }),
    ).rejects.toThrow("fails after both writes");
    expect(userId).not.toBe("");
    expect(await app.user.findUnique({ where: { email } })).toBeNull();
    expect(await eventsFor(userId)).toEqual([]);
  });
});

describe("auth events (D7)", () => {
  it("writes auth.2fa_enabled when TOTP set-up is finished", async () => {
    const { user } = await kit.staffUser({ role: "editor", label: "audit-setup" });
    expect(await eventsFor(user.id)).toEqual([
      { actorId: user.id, action: "auth.2fa_enabled", entityType: "user", diff: null },
    ]);
  });

  it("writes auth.lockout once when 5 wrong passwords lock the account", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const user = await kit.newStaff("audit-lock");
    for (let i = 0; i < 6; i++) await kit.signIn(user.email, new Map(), "wrong-password-1");
    expect(await eventsFor(user.id)).toEqual([
      { actorId: null, action: "auth.lockout", entityType: "user", diff: { via: "password" } },
    ]);
  });

  it("writes auth.lockout once when 5 wrong 2FA codes lock the account", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { user, secret } = await kit.staffUser({ role: "admin", label: "audit-2fa-lock" });
    const jar = new Map<string, string>();
    await kit.signIn(user.email, jar);
    for (let i = 0; i < 5; i++)
      await kit.call("/two-factor/verify-totp", { body: { code: wrongTotpCode(secret!) }, jar });
    const events = await eventsFor(user.id);
    expect(events.filter((event) => event.action === "auth.lockout")).toEqual([
      { actorId: null, action: "auth.lockout", entityType: "user", diff: { via: "2fa" } },
    ]);
  });
});

describe("the owner scripts' events (D7)", () => {
  it("seedAdmin writes the admin and auth.admin_seeded together", async () => {
    const user = await seedAdmin(migrator, {
      email: `audit-seed-${kit.run}@example.test`,
      name: "seed",
      password: TEST_PASSWORD,
    });
    expect(await eventsFor(user.id)).toEqual([
      { actorId: null, action: "auth.admin_seeded", entityType: "user", diff: { role: "admin" } },
    ]);
  });

  it("resetStaffPassword writes auth.password_reset with reset2fa", async () => {
    const user = await kit.newStaff("audit-reset");
    await resetStaffPassword(migrator, {
      email: user.email,
      password: "brand-new-password-42",
      reset2fa: true,
    });
    await resetStaffPassword(migrator, { email: user.email, password: "another-password-43" });
    const events = await eventsFor(user.id);
    expect(events).toHaveLength(2);
    expect(events).toEqual(
      expect.arrayContaining([
        {
          actorId: null,
          action: "auth.password_reset",
          entityType: "user",
          diff: { reset2fa: true },
        },
        {
          actorId: null,
          action: "auth.password_reset",
          entityType: "user",
          diff: { reset2fa: false },
        },
      ]),
    );
  });
});
