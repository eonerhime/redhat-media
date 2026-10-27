import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testPrisma } from "@/lib/db/test-client";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { STAFF_ROLES } from "./roles";
import { cmsSessionResponse } from "./session-endpoint";
import { toStaffSession } from "./staff-session";
import { type AuthKit, createAuthKit, jarHeaders, type Jar } from "./testing/auth-kit";

// GET /api/cms/session with real sign-ins on Postgres, as rhm_app (Phase 25
// spec, D8; roadmap: "the endpoint returns null for anonymous visitors").

let db: PrismaClient;
let kit: AuthKit;

beforeAll(() => {
  db = testPrisma("app");
  kit = createAuthKit(db, { ipOffset: 450 });
});

afterAll(async () => {
  await kit.cleanup();
  await db.$disconnect();
});

async function ask(jar: Jar) {
  const request = new Request("http://localhost:3217/api/cms/session", {
    headers: jarHeaders(jar),
  });
  const response = await cmsSessionResponse(request, {
    cmsEnabled: true,
    readSession: async (headers) => toStaffSession(await kit.auth.api.getSession({ headers })),
  });
  return {
    status: response.status,
    cache: response.headers.get("cache-control"),
    json: await response.json(),
  };
}

describe("GET /api/cms/session", () => {
  it("answers an anonymous visitor with role null, no-store", async () => {
    expect(await ask(new Map())).toEqual({
      status: 200,
      cache: "no-store",
      json: { role: null, authenticated: false },
    });
  });

  it("gives a signed-in user without 2FA no role", async () => {
    const { jar } = await kit.staffUser({
      role: "admin",
      twoFactor: false,
      label: "endpoint-no2fa",
    });
    expect((await ask(jar)).json).toEqual({ role: null, authenticated: true });
  });

  for (const role of STAFF_ROLES)
    it(`gives ${role} their role`, async () => {
      const { jar } = await kit.staffUser({ role, label: `endpoint-${role}` });
      expect(await ask(jar)).toEqual({
        status: 200,
        cache: "no-store",
        json: { role, authenticated: true },
      });
    });

  it("forgets a user once they sign out", async () => {
    const { jar } = await kit.staffUser({ role: "editor", label: "endpoint-out" });
    expect((await kit.call("/sign-out", { body: {}, jar })).status).toBe(200);
    expect((await ask(jar)).json).toEqual({ role: null, authenticated: false });
  });
});
