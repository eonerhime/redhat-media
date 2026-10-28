import { createHash } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { testPrisma } from "@/lib/db/test-client";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { createRateLimiter } from "@/lib/security/rate-limit-core";
import { createAuth } from "./core";
import { resetStaffPassword } from "./staff-admin";
import {
  type AuthKit,
  createAuthKit,
  type Jar,
  TEST_PASSWORD as PASSWORD,
  TEST_SALT as SALT,
} from "./testing/auth-kit";
import { totpCode, totpSecretFromUri, wrongTotpCode } from "./test-totp";

// The roadmap's Phase 24 checks against a real Better Auth instance and Postgres,
// as rhm_app (Phase 24 spec, D2–D10, D14, D19; validation.md). Requests go through
// auth.handler exactly as /api/auth/[...all] passes them on, by way of the shared
// helpers in lib/auth/testing (Phase 25 spec, D10).

let db: PrismaClient;
let kit: AuthKit;

const call: AuthKit["call"] = (...args) => kit.call(...args);
const signIn: AuthKit["signIn"] = (...args) => kit.signIn(...args);
const enrol: AuthKit["enrol"] = (...args) => kit.enrol(...args);
const fullSignIn: AuthKit["fullSignIn"] = (...args) => kit.fullSignIn(...args);
const nextIp = () => kit.nextIp();
const staff = (label: string) => kit.newStaff(label);

beforeAll(() => {
  db = testPrisma("app");
  kit = createAuthKit(db);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await kit.cleanup();
  await db.$disconnect();
});

describe("sign-in, 2FA and sign-out (roadmap: a seeded admin logs in with 2FA and logs out)", () => {
  it("asks a user with 2FA for a code, then signs in and out", async () => {
    const user = await staff("flow");
    const secret = await enrol(user.email, new Map());
    const jar = await fullSignIn(user.email, secret);
    const session = await call("/get-session", { jar });
    expect(session.json).toMatchObject({ user: { email: user.email, role: "admin" } });
    expect((await call("/sign-out", { body: {}, jar })).status).toBe(200);
    expect((await call("/get-session", { jar })).json).toBeNull();
  });

  it("accepts a backup code instead of the TOTP code", async () => {
    const user = await staff("backup");
    const jar: Jar = new Map();
    await signIn(user.email, jar);
    const enable = await call("/two-factor/enable", { body: { password: PASSWORD }, jar });
    const secret = totpSecretFromUri(enable.json.totpURI);
    expect(enable.json.backupCodes).toHaveLength(10);
    await call("/two-factor/verify-totp", { body: { code: totpCode(secret) }, jar });
    const next: Jar = new Map();
    await signIn(user.email, next);
    const backup = await call("/two-factor/verify-backup-code", {
      body: { code: enable.json.backupCodes[0] },
      jar: next,
    });
    expect(backup.status).toBe(200);
    expect((await call("/get-session", { jar: next })).json).toMatchObject({
      user: { id: user.id },
    });
  });

  it("ends the user's other password-only sessions when 2FA is turned on", async () => {
    const user = await staff("enrol-other");
    const other: Jar = new Map();
    expect((await signIn(user.email, other)).status).toBe(200);
    expect((await call("/get-session", { jar: other })).json).not.toBeNull();
    const jar: Jar = new Map();
    await enrol(user.email, jar);
    expect((await call("/get-session", { jar: other })).json).toBeNull();
    expect((await call("/get-session", { jar })).json).toMatchObject({ user: { id: user.id } });
  });

  it("refuses 'trust this device' (D7)", async () => {
    const user = await staff("trust");
    const secret = await enrol(user.email, new Map());
    const jar: Jar = new Map();
    await signIn(user.email, jar);
    const verify = await call("/two-factor/verify-totp", {
      body: { code: totpCode(secret), trustDevice: true },
      jar,
    });
    expect(verify.status).toBe(400);
  });
});

describe("429 on repeated IP failures (D3)", () => {
  it("allows 5 sign-ins a minute from one IP, then answers 429", async () => {
    const ip = nextIp();
    const statuses = [];
    for (let i = 0; i < 6; i++)
      statuses.push(
        (await signIn(`nobody-${kit.run}-${i}@example.test`, new Map(), "wrong-password-1", ip))
          .status,
      );
    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(statuses[5]).toBe(429);
  });

  it("stores only salted hashes, and no rateLimit table exists (D2)", async () => {
    const rows = await db.rateLimitHit.findMany({
      where: { bucket: "auth" },
      select: { keyHash: true },
    });
    expect(rows.length).toBeGreaterThan(0);
    for (const { keyHash } of rows) expect(keyHash).toMatch(/^[0-9a-f]{64}$/);
    const tables = await db.$queryRaw<{ n: bigint }[]>`
      SELECT count(*) AS n FROM information_schema.tables WHERE table_name = 'rateLimit'`;
    expect(Number(tables[0]?.n)).toBe(0);
  });
});

describe("lockout after 5 account failures (D4, D14)", () => {
  it("locks after 5 wrong passwords from different IPs, then refuses the right one alike", async () => {
    const user = await staff("lock");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (let i = 0; i < 5; i++)
      expect((await signIn(user.email, new Map(), "wrong-password-1")).status).toBe(401);
    const refused = await signIn(user.email, new Map());
    expect(refused.status).toBe(401);
    expect(refused.json).toMatchObject({
      code: "INVALID_EMAIL_OR_PASSWORD",
      message: "Invalid email or password",
    });
    const logged = warn.mock.calls.map(([line]) => String(line));
    expect(logged.some((line) => line.includes('"auth.lockout"') && line.includes(user.id))).toBe(
      true,
    );
    expect(logged.join("\n")).not.toContain(user.email);
  });

  it("unlocks once the 15 minutes have passed", async () => {
    const user = await staff("unlock");
    for (let i = 0; i < 5; i++) await signIn(user.email, new Map(), "wrong-password-1");
    expect((await signIn(user.email, new Map())).status).toBe(401);
    await db.user.update({
      where: { id: user.id },
      data: { lockedUntil: new Date(Date.now() - 1000) },
    });
    expect((await signIn(user.email, new Map())).status).toBe(200);
  });

  it("starts counting again after a correct password", async () => {
    const user = await staff("count");
    for (let i = 0; i < 4; i++) await signIn(user.email, new Map(), "wrong-password-1");
    expect((await signIn(user.email, new Map())).status).toBe(200);
    for (let i = 0; i < 4; i++) await signIn(user.email, new Map(), "wrong-password-1");
    expect((await signIn(user.email, new Map())).status).toBe(200);
  });

  it("locks after 5 wrong 2FA codes, and then refuses the right password", async () => {
    const user = await staff("code");
    const secret = await enrol(user.email, new Map());
    const jar: Jar = new Map();
    await signIn(user.email, jar);
    for (let i = 0; i < 5; i++)
      await call("/two-factor/verify-totp", { body: { code: wrongTotpCode(secret) }, jar });
    expect((await signIn(user.email, new Map())).json).toMatchObject({
      code: "INVALID_EMAIL_OR_PASSWORD",
    });
  });

  it("refuses a deactivated user like a wrong password", async () => {
    const user = await staff("off");
    await db.user.update({ where: { id: user.id }, data: { deactivatedAt: new Date() } });
    const refused = await signIn(user.email, new Map());
    expect(refused.status).toBe(401);
    expect(refused.json).toMatchObject({ code: "INVALID_EMAIL_OR_PASSWORD" });
  });
});

describe("refusal of a breached password (D6)", () => {
  /** Answers the k-anonymity range query; `breached` passwords are in the corpus. */
  function stubPwned(breached: string[]) {
    const original = globalThis.fetch;
    return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input instanceof Request ? input.url : input);
      if (!url.startsWith("https://api.pwnedpasswords.com/range/")) return original(input, init);
      const prefix = url.slice(-5);
      const lines = breached
        .map((password) => createHash("sha1").update(password).digest("hex").toUpperCase())
        .filter((hash) => hash.startsWith(prefix))
        .map((hash) => `${hash.slice(5)}:12345`);
      return new Response([...lines, "0000000000000000000000000000000000A:0"].join("\r\n"));
    });
  }

  it("refuses a breached new password and accepts a clean one", async () => {
    const user = await staff("pwned");
    const secret = await enrol(user.email, new Map());
    const jar = await fullSignIn(user.email, secret);
    const breached = "password123456";
    const fetch = stubPwned([breached]);
    const refused = await call("/change-password", {
      body: { currentPassword: PASSWORD, newPassword: breached },
      jar,
    });
    expect(refused.status).toBe(400);
    expect(refused.json).toMatchObject({ code: "PASSWORD_COMPROMISED" });
    expect(fetch).toHaveBeenCalled();
    const accepted = await call("/change-password", {
      body: { currentPassword: PASSWORD, newPassword: "a-clean-new-passphrase-7" },
      jar,
    });
    expect(accepted.status).toBe(200);
  });

  it("refuses a password shorter than 12 characters", async () => {
    const user = await staff("short");
    const secret = await enrol(user.email, new Map());
    const jar = await fullSignIn(user.email, secret);
    stubPwned([]);
    const refused = await call("/change-password", {
      body: { currentPassword: PASSWORD, newPassword: "short-pw-1" },
      jar,
    });
    expect(refused.status).toBe(400);
  });
});

describe("refusal of an expired session (D8)", () => {
  it("returns no session once expiresAt has passed", async () => {
    const user = await staff("expired");
    const secret = await enrol(user.email, new Map());
    const jar = await fullSignIn(user.email, secret);
    expect((await call("/get-session", { jar })).json).not.toBeNull();
    await db.session.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect((await call("/get-session", { jar })).json).toBeNull();
  });

  it("issues 8-hour sessions", async () => {
    const user = await staff("eight");
    const secret = await enrol(user.email, new Map());
    const jar = await fullSignIn(user.email, secret);
    const { json } = await call("/get-session", { jar });
    const hours = (new Date(json.session.expiresAt).getTime() - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(7.9);
    expect(hours).toBeLessThanOrEqual(8);
  });

  it("sets an httpOnly, Secure, SameSite=Lax, __Secure- cookie over https", async () => {
    const base = "https://cms.example.test";
    const secureAuth = createAuth({
      db,
      secret: "auth-db-test-secret-".padEnd(48, "x"),
      baseURL: base,
      trustedOrigins: [base],
      limiter: createRateLimiter(db, SALT),
      logSalt: SALT,
    });
    const user = await staff("cookie");
    const response = await secureAuth.handler(
      new Request(`${base}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { origin: base, "x-real-ip": nextIp(), "content-type": "application/json" },
        body: JSON.stringify({ email: user.email, password: PASSWORD }),
      }),
    );
    expect(response.status).toBe(200);
    const cookie = response.headers
      .getSetCookie()
      .find((header) => header.startsWith("__Secure-better-auth.session_token="));
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/;\s*HttpOnly/i);
    expect(cookie).toMatch(/;\s*Secure/i);
    expect(cookie).toMatch(/;\s*SameSite=Lax/i);
  });

  it("ends every session when the owner resets the password (D10)", async () => {
    const user = await staff("reset");
    const secret = await enrol(user.email, new Map());
    const jar = await fullSignIn(user.email, secret);
    await resetStaffPassword(db, { email: user.email, password: "brand-new-password-42" });
    expect((await call("/get-session", { jar })).json).toBeNull();
  });
});

describe("closed doors (D10, D19, D9)", () => {
  it.each([
    "/sign-up/email",
    "/request-password-reset",
    "/reset-password",
    "/admin/impersonate-user",
    "/two-factor/disable",
  ])("%s is disabled", async (path) => {
    expect((await call(path, { body: {} })).status).toBe(404);
  });

  // Better Auth checks the Origin of requests that carry cookies (CSRF); the
  // /api/auth route refuses any other cross-origin POST (paths.test.ts).
  it("refuses a cookie-bearing request from an untrusted origin", async () => {
    const user = await staff("origin");
    const secret = await enrol(user.email, new Map());
    const jar = await fullSignIn(user.email, secret);
    const response = await call("/sign-out", { body: {}, jar, origin: "https://evil.example" });
    expect(response.status).toBe(403);
    expect((await call("/get-session", { jar })).json).not.toBeNull();
  });
});
