import type { PrismaClient } from "@/lib/generated/prisma/client";
import { createRateLimiter } from "@/lib/security/rate-limit-core";
import { type Auth, createAuth } from "../core";
import { createRequireRole } from "../guard-core";
import type { StaffRole } from "../roles";
import type { SecurityLogger } from "../security-log";
import { createStaffUser } from "../staff-admin";
import { type StaffSession, toStaffSession } from "../staff-session";
import { totpCode, totpSecretFromUri } from "../test-totp";

// Database-test helpers (Phase 25 spec, D10): a real Better Auth instance on the
// test database, a cookie jar, and staff users signed in through auth.handler
// exactly as /api/auth/[...all] passes requests on. No forged cookies. Tests
// only: lint keeps lib/auth/testing out of app code.

export const TEST_BASE = "http://localhost:3217";
export const TEST_SECRET = "auth-db-test-secret-".padEnd(48, "x");
export const TEST_SALT = "auth-db-test-salt-".padEnd(40, "s");
export const TEST_PASSWORD = "correct-horse-battery-9";

export type Jar = Map<string, string>;

/** Keeps the cookies a response sets, and drops the ones it expires. */
export function remember(response: Response, jar: Jar): Jar {
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

/** Request headers carrying the jar's cookies. */
export function jarHeaders(jar: Jar, init?: HeadersInit): Headers {
  const headers = new Headers(init);
  if (jar.size)
    headers.set("cookie", [...jar].map(([name, value]) => `${name}=${value}`).join("; "));
  return headers;
}

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`auth-kit: ${message}`);
}

// The three documentation ranges, 762 addresses in all.
const IP_RANGES = ["203.0.113", "198.51.100", "192.0.2"];

/**
 * `ipOffset` starts this kit's addresses elsewhere in the documentation ranges,
 * so database test files that run within a minute of each other don't share
 * per-IP rate-limit counts.
 */
export function createAuthKit(
  db: PrismaClient,
  kitOptions: { log?: SecurityLogger; ipOffset?: number } = {},
) {
  const defaultLog: SecurityLogger = kitOptions.log ?? (() => {});
  const auth: Auth = createAuth({
    db,
    secret: TEST_SECRET,
    baseURL: TEST_BASE,
    trustedOrigins: [TEST_BASE],
    limiter: createRateLimiter(db, TEST_SALT),
    logSalt: TEST_SALT,
  });
  const run = Date.now().toString(36); // unique emails, so reruns on a shared branch don't collide
  const created: string[] = [];
  let ipCounter = kitOptions.ipOffset ?? 0;

  /** A fresh documentation-range IP, so per-IP limits don't leak between tests. */
  const nextIp = () => {
    const n = ipCounter++ % (IP_RANGES.length * 254);
    return `${IP_RANGES[Math.floor(n / 254)]}.${(n % 254) + 1}`;
  };

  async function call(
    path: string,
    options: { body?: unknown; jar?: Jar; ip?: string; origin?: string; method?: string } = {},
  ) {
    const headers = jarHeaders(options.jar ?? new Map(), {
      origin: options.origin ?? TEST_BASE,
      "x-real-ip": options.ip ?? nextIp(),
    });
    if (options.body !== undefined) headers.set("content-type", "application/json");
    const response = await auth.handler(
      new Request(`${TEST_BASE}/api/auth${path}`, {
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

  /** A new staff account (password only, no 2FA), deleted again by cleanup(). */
  async function newStaff(label: string, role: StaffRole = "admin") {
    const email = `${label}-${run}@example.test`;
    const user = await createStaffUser(db, { email, name: label, role, password: TEST_PASSWORD });
    created.push(user.id);
    return user;
  }

  const signIn = (email: string, jar: Jar, password = TEST_PASSWORD, ip?: string) =>
    call("/sign-in/email", { body: { email, password }, jar, ip });

  /** Signs in, sets up TOTP and returns its secret, leaving a full session in `jar`. */
  async function enrol(email: string, jar: Jar): Promise<string> {
    check((await signIn(email, jar)).status === 200, "sign-in failed");
    const enable = await call("/two-factor/enable", { body: { password: TEST_PASSWORD }, jar });
    check(enable.status === 200, "two-factor/enable failed");
    const secret = totpSecretFromUri(enable.json.totpURI);
    const verify = await call("/two-factor/verify-totp", { body: { code: totpCode(secret) }, jar });
    check(verify.status === 200, "two-factor set-up failed");
    return secret;
  }

  /** Signs in with password and code from scratch; returns the session jar. */
  async function fullSignIn(email: string, secret: string): Promise<Jar> {
    const jar: Jar = new Map();
    const first = await signIn(email, jar);
    check(first.json?.twoFactorRedirect === true, "no 2FA challenge");
    const second = await call("/two-factor/verify-totp", { body: { code: totpCode(secret) }, jar });
    check(second.status === 200, "2FA code refused");
    return jar;
  }

  /**
   * A staff member with `role`, signed in through the real handler. With
   * `twoFactor` (the default) they have set up TOTP and signed in with a code;
   * without it they hold a password-only session, as midway through set-up.
   */
  async function staffUser(options: { role: StaffRole; twoFactor?: boolean; label?: string }) {
    const user = await newStaff(options.label ?? options.role, options.role);
    if (options.twoFactor === false) {
      const jar: Jar = new Map();
      check((await signIn(user.email, jar)).status === 200, "sign-in failed");
      return { user, jar, secret: null };
    }
    const secret = await enrol(user.email, new Map());
    return { user, jar: await fullSignIn(user.email, secret), secret };
  }

  /** The staff session the jar's cookie belongs to, as the guard reads it. */
  async function sessionOf(jar: Jar): Promise<StaffSession | null> {
    return toStaffSession(await auth.api.getSession({ headers: jarHeaders(jar) }));
  }

  /** requireRole() for the request that carries this jar's cookies. */
  function guardFor(jar: Jar, options: { log?: SecurityLogger; now?: () => Date } = {}) {
    return createRequireRole({
      cmsEnabled: true,
      readSession: () => sessionOf(jar),
      log: options.log ?? defaultLog,
      now: options.now,
    });
  }

  /** Deletes every user this kit created; sessions, accounts and 2FA cascade. */
  async function cleanup() {
    await db.user.deleteMany({ where: { id: { in: created } } });
  }

  return {
    auth,
    run,
    created,
    nextIp,
    call,
    newStaff,
    signIn,
    enrol,
    fullSignIn,
    staffUser,
    sessionOf,
    guardFor,
    cleanup,
  };
}

export type AuthKit = ReturnType<typeof createAuthKit>;
