import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testPrisma } from "@/lib/db/test-client";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { STAFF_ROLES, type StaffRole } from "./roles";
import type { SecurityLogFields } from "./security-log";
import { type AuthKit, createAuthKit, type Jar } from "./testing/auth-kit";

// requireRole() through real sign-ins on Postgres, as rhm_app (Phase 25 spec,
// D1–D3; validation.md → Database tests through the real auth).

let db: PrismaClient;
let kit: AuthKit;
const jars = new Map<StaffRole, Jar>();

beforeAll(async () => {
  db = testPrisma("app");
  kit = createAuthKit(db, { ipOffset: 300 });
  for (const role of STAFF_ROLES) jars.set(role, (await kit.staffUser({ role })).jar);
});

afterAll(async () => {
  await kit.cleanup();
  await db.$disconnect();
});

describe("each role against each minimum", () => {
  for (const role of STAFF_ROLES)
    for (const min of STAFF_ROLES) {
      const passes = STAFF_ROLES.indexOf(role) >= STAFF_ROLES.indexOf(min);
      it(`${role} against requireRole("${min}") ${passes ? "passes" : "gets 403 role"}`, async () => {
        const result = await kit.guardFor(jars.get(role)!)(min);
        if (passes) expect(result).toMatchObject({ ok: true, staff: { role } });
        else expect(result).toEqual({ ok: false, status: 403, reason: "role" });
      });
    }
});

describe("refusals", () => {
  it("gives a signed-out request 401", async () => {
    expect(await kit.guardFor(new Map())("sales")).toEqual({
      ok: false,
      status: 401,
      reason: "signed-out",
    });
  });

  it("gives a signed-in user without 2FA 403 2fa, and logs it", async () => {
    const logged: SecurityLogFields[] = [];
    const { user, jar } = await kit.staffUser({ role: "admin", twoFactor: false, label: "no2fa" });
    const guard = kit.guardFor(jar, { log: (_event, fields = {}) => logged.push(fields) });
    expect(await guard("sales", { action: "probe.check" })).toEqual({
      ok: false,
      status: 403,
      reason: "2fa",
    });
    expect(logged).toEqual([{ userId: user.id, reason: "2fa", action: "probe.check" }]);
  });

  it("gives a deactivated user 401", async () => {
    const { user, jar } = await kit.staffUser({ role: "admin", label: "deactivated" });
    expect(await kit.guardFor(jar)("admin")).toMatchObject({ ok: true });
    await db.user.update({ where: { id: user.id }, data: { deactivatedAt: new Date() } });
    expect(await kit.guardFor(jar)("sales")).toMatchObject({ ok: false, status: 401 });
  });

  it("gives a session older than 15 minutes 403 reauth with { fresh: true } only", async () => {
    const { user, jar } = await kit.staffUser({ role: "admin", label: "stale" });
    expect(await kit.guardFor(jar)("admin", { fresh: true })).toMatchObject({ ok: true });
    await db.session.updateMany({
      where: { userId: user.id },
      data: { createdAt: new Date(Date.now() - 16 * 60_000) },
    });
    expect(await kit.guardFor(jar)("admin", { fresh: true })).toEqual({
      ok: false,
      status: 403,
      reason: "reauth",
    });
    expect(await kit.guardFor(jar)("admin")).toMatchObject({ ok: true });
  });
});
