import { createHash } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { testPrisma } from "@/lib/db/test-client";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { createRateLimiter } from "@/lib/security/rate-limit-core";
import { type Auth, createAuth } from "./core";
import { createStaffUser, resetStaffPassword } from "./staff-admin";
import { totpCode, totpSecretFromUri, wrongTotpCode } from "./test-totp";

// The roadmap's Phase 24 checks against a real Better Auth instance and Postgres,
// as rhm_app (Phase 24 spec, D2–D10, D14, D19; validation.md). Requests go through
// auth.handler exactly as /api/auth/[...all] passes them on.

const BASE = "http://localhost:3217";
const SALT = "auth-db-test-salt-".padEnd(40, "s");
const PASSWORD = "correct-horse-battery-9";
const RUN = Date.now().toString(36); // unique emails, so reruns on a shared branch don't collide

let db: PrismaClient;
let auth: Auth;
let ipCounter = 0;
const created: string[] = [];

/** A fresh documentation-range IP, so per-IP limits don't leak between tests. */
const nextIp = () => `203.0.113.${(ipCounter++ % 250) + 1}`;

type Jar = Map<string, string>;

function remember(response: Response, jar: Jar): Jar {
  for (const cookie of response.headers.getSetCookie()) {
    const [pair = ""] = cookie.split(";");
    const at = pair.indexOf("=");
    const name = pair.slice(0, at);
    const value = pair.slice(at + 1);
    if (!value || /max-age=0/i.test(cookie)) jar.delete(name);
    else jar.set(name, value);
  }
  return jar;
}

async function call(
  path: string,
  options: { body?: unknown; jar?: Jar; ip?: string; origin?: string; method?: string } = {},
) {
  const headers = new Headers({
    origin: options.origin ?? BASE,
    "x-real-ip": options.ip ?? nextIp(),
  });
  if (options.body !== undefined) headers.set("content-type", "application/json");
  if (options.jar?.size)
    headers.set("cookie", [...options.jar].map(([name, value]) => `${name}=${value}`).join("; "));
  const response = await auth.handler(
    new Request(`${BASE}/api/auth${path}`, {
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    }),
  );
  if (options.jar) remember(response, options.jar);
  const text = await response.text();
  const json =
    response.headers.get("content-type")?.includes("json") && text ? JSON.parse(text) : null;
  return { status: response.status, json };
}

async function staff(label: string) {
  const email = `${label}-${RUN}@example.test`;
  const user = await createStaffUser(db, { email, name: label, role: "admin", password: PASSWORD });
  created.push(user.id);
  return user;
}

const signIn = (email: string, jar: Jar, password = PASSWORD, ip?: string) =>
  call("/sign-in/email", { body: { email, password }, jar, ip });

/** Signs in, sets up TOTP and returns its secret, leaving a full session in `jar`. */
async function enrol(email: string, jar: Jar): Promise<string> {
  expect((await signIn(email, jar)).status).toBe(200);
  const enable = await call("/two-factor/enable", { body: { password: PASSWORD }, jar });
  expect(enable.status).toBe(200);
  const secret = totpSecretFromUri(enable.json.totpURI);
  expect(
    (await call("/two-factor/verify-totp", { body: { code: totpCode(secret) }, jar })).status,
  ).toBe(200);
  return secret;
}

/** Signs in with password and code from scratch; returns the session jar. */
async function fullSignIn(email: string, secret: string): Promise<Jar> {
  const jar: Jar = new Map();
  const first = await signIn(email, jar);
  expect(first.json).toMatchObject({ twoFactorRedirect: true });
  const second = await call("/two-factor/verify-totp", { body: { code: totpCode(secret) }, jar });
  expect(second.status).toBe(200);
  return jar;
}

beforeAll(() => {
  db = testPrisma("app");
  auth = createAuth({
    db,
    secret: "auth-db-test-secret-".padEnd(48, "x"),
    baseURL: BASE,
    trustedOrigins: [BASE],
    limiter: createRateLimiter(db, SALT),
    logSalt: SALT,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: created } } }); // sessions, accounts, 2FA cascade
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
        (await signIn(`nobody-${RUN}-${i}@example.test`, new Map(), "wrong-password-1", ip)).status,
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
