import { APIError } from "better-auth/api";
import { describe, expect, it } from "vitest";
import {
  type AccountLockState,
  invalidCredentials,
  lockUntil,
  refusal,
  signInEmail,
  signInOutcome,
} from "./lockout";

const NOW = new Date("2026-10-26T12:00:00Z");
const later = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000);
const open: AccountLockState = {
  userId: "u1",
  lockedUntil: null,
  twoFactorLockedUntil: null,
  deactivatedAt: null,
};

describe("lockout decisions (Phase 24 spec, D4)", () => {
  it("lets an open account through", () => {
    expect(refusal(open, NOW)).toBeNull();
  });

  it("refuses while the password lock or the 2FA lock is active", () => {
    expect(refusal({ ...open, lockedUntil: later(1) }, NOW)).toBe("locked");
    expect(refusal({ ...open, twoFactorLockedUntil: later(1) }, NOW)).toBe("2fa-locked");
  });

  it("lets the account through once a lock has passed", () => {
    expect(refusal({ ...open, lockedUntil: later(-1), twoFactorLockedUntil: NOW }, NOW)).toBeNull();
  });

  it("always refuses a deactivated account", () => {
    expect(refusal({ ...open, deactivatedAt: later(-60 * 24) }, NOW)).toBe("deactivated");
  });

  it("locks for 15 minutes", () => {
    expect(lockUntil(NOW)).toEqual(later(15));
  });
});

describe("sign-in outcome", () => {
  it("recognises Better Auth's wrong-password error", () => {
    expect(signInOutcome(invalidCredentials())).toBe("wrong-password");
  });

  it("treats a session or a 2FA challenge as a pass", () => {
    expect(signInOutcome({ token: "t", user: {} })).toBe("passed");
    expect(signInOutcome({ twoFactorRedirect: true, twoFactorMethods: ["totp"] })).toBe("passed");
  });

  it("ignores other errors and empty results", () => {
    expect(signInOutcome(new APIError("BAD_REQUEST", { code: "INVALID_EMAIL" }))).toBe("other");
    expect(signInOutcome(new APIError("TOO_MANY_REQUESTS"))).toBe("other");
    expect(signInOutcome(null)).toBe("other");
  });
});

describe("the locked refusal looks like a wrong password (D14)", () => {
  it("has the same status, code and message", () => {
    const error = invalidCredentials();
    expect(error.statusCode).toBe(401);
    expect(error.body).toMatchObject({
      code: "INVALID_EMAIL_OR_PASSWORD",
      message: "Invalid email or password",
    });
  });
});

describe("signInEmail", () => {
  it("lower-cases the email, as Better Auth stores it", () => {
    expect(signInEmail({ email: "Admin@Example.COM" })).toBe("admin@example.com");
  });

  it("ignores a missing, non-string or oversized email", () => {
    expect(signInEmail(undefined)).toBeNull();
    expect(signInEmail({ email: 42 })).toBeNull();
    expect(signInEmail({ email: `${"a".repeat(250)}@x.io` })).toBeNull();
  });
});
