import { describe, expect, it } from "vitest";
import { guardResponse } from "./guard-core";
import { FRESH_SESSION_SECONDS } from "./options";
import { STAFF_ROLES } from "./roles";
import { fakeStaff } from "./testing/fakes";

// requireRole() (Phase 25 spec, D1–D3, D12) with fake sessions through the
// injected reader. guards.db.test.ts runs the same rules through real sign-ins.

const NOW = new Date("2026-10-27T12:00:00Z");
const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

describe("401: no staff member", () => {
  it("refuses a signed-out request", async () => {
    const { requireRole, logged } = fakeStaff(null);
    expect(await requireRole("sales")).toEqual({ ok: false, status: 401, reason: "signed-out" });
    expect(logged).toEqual([]); // a 401 is the normal signed-out answer, not logged (D12)
  });

  it("refuses everyone while the CMS is off, without reading the session", async () => {
    const { requireRole } = fakeStaff("admin", { cmsEnabled: false });
    expect(await requireRole("sales")).toMatchObject({ ok: false, status: 401 });
  });
});

describe("the role hierarchy, sales < editor < admin", () => {
  for (const role of STAFF_ROLES)
    for (const min of STAFF_ROLES) {
      const passes = STAFF_ROLES.indexOf(role) >= STAFF_ROLES.indexOf(min);
      it(`${role} against requireRole("${min}") ${passes ? "passes" : "is refused"}`, async () => {
        const { requireRole } = fakeStaff(role);
        const result = await requireRole(min);
        if (passes)
          expect(result).toEqual({
            ok: true,
            staff: { userId: "user-1", role, name: "Test Staff" },
          });
        else expect(result).toEqual({ ok: false, status: 403, reason: "role" });
      });
    }
});

describe("2FA is required (D2)", () => {
  for (const role of STAFF_ROLES)
    it(`refuses ${role} without 2FA at every level`, async () => {
      const { requireRole } = fakeStaff(role, { session: { twoFactorEnabled: false } });
      for (const min of STAFF_ROLES)
        expect(await requireRole(min)).toEqual({ ok: false, status: 403, reason: "2fa" });
    });
});

describe("{ fresh: true } (D3)", () => {
  const signedIn = (minutes: number) =>
    fakeStaff("admin", { session: { sessionCreatedAt: minutesAgo(minutes) }, now: () => NOW });

  it("passes a sign-in from the last 15 minutes", async () => {
    expect(
      await signedIn(FRESH_SESSION_SECONDS / 60).requireRole("admin", { fresh: true }),
    ).toMatchObject({ ok: true });
  });

  it("refuses an older sign-in with 403 reauth", async () => {
    const { requireRole } = signedIn(16);
    expect(await requireRole("admin", { fresh: true })).toEqual({
      ok: false,
      status: 403,
      reason: "reauth",
    });
  });

  it("does not care about age without it", async () => {
    expect(await signedIn(7 * 60).requireRole("admin")).toMatchObject({ ok: true });
  });
});

describe("security log (D12)", () => {
  it("writes auth.forbidden with the user, reason and action on a 403, never the input", async () => {
    const { requireRole, logged } = fakeStaff("sales");
    await requireRole("editor", { action: "content.update" });
    expect(logged).toEqual([
      {
        event: "auth.forbidden",
        fields: { userId: "user-1", reason: "role", action: "content.update" },
      },
    ]);
  });

  it("writes nothing when the guard passes", async () => {
    const { requireRole, logged } = fakeStaff("admin");
    await requireRole("admin");
    expect(logged).toEqual([]);
  });
});

describe("guardResponse()", () => {
  it.each([
    [{ ok: false, status: 401, reason: "signed-out" }, 401, "unauthorized"],
    [{ ok: false, status: 403, reason: "role" }, 403, "forbidden"],
    [{ ok: false, status: 403, reason: "2fa" }, 403, "two_factor_required"],
    [{ ok: false, status: 403, reason: "reauth" }, 403, "reauth_required"],
  ] as const)("answers %o with %i { error: %s }, no-store", async (refusal, status, error) => {
    const response = guardResponse(refusal);
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ error });
  });
});
