import { describe, expect, it } from "vitest";
import {
  ALLOWED_AUTH_PATHS,
  authEndpointPath,
  DISABLED_AUTH_PATHS,
  isAllowedAuthPath,
  isTrustedRequestOrigin,
} from "./paths";

describe("isTrustedRequestOrigin (Phase 24 spec, D9)", () => {
  const trusted = ["https://rhm.example", "https://rhm-git-x.vercel.app"];
  const request = (method: string, origin?: string) =>
    new Request("https://rhm.example/api/auth/sign-in/email", {
      method,
      headers: origin ? { origin } : {},
    });

  it("accepts a POST from a trusted origin", () => {
    expect(isTrustedRequestOrigin(request("POST", "https://rhm-git-x.vercel.app"), trusted)).toBe(
      true,
    );
  });

  it("refuses a POST from another origin, or with none", () => {
    expect(isTrustedRequestOrigin(request("POST", "https://evil.example"), trusted)).toBe(false);
    expect(isTrustedRequestOrigin(request("POST", "https://rhm.example.evil.io"), trusted)).toBe(
      false,
    );
    expect(isTrustedRequestOrigin(request("POST", "null"), trusted)).toBe(false);
    expect(isTrustedRequestOrigin(request("POST"), trusted)).toBe(false);
  });

  it("lets reads through (Better Auth checks the session itself)", () => {
    expect(isTrustedRequestOrigin(request("GET", "https://evil.example"), trusted)).toBe(true);
  });
});

describe("auth endpoint allowlist (Phase 24 spec, D10, D19)", () => {
  it.each([
    "/api/auth/sign-in/email",
    "/api/auth/sign-out",
    "/api/auth/get-session",
    "/api/auth/two-factor/verify-totp",
    "/api/auth/two-factor/verify-backup-code",
    "/api/auth/two-factor/enable",
    "/api/auth/two-factor/get-totp-uri",
    "/api/auth/change-password",
    "/api/auth/sign-in/email/",
  ])("allows %s", (pathname) => {
    expect(isAllowedAuthPath(pathname)).toBe(true);
  });

  it.each([
    "/api/auth/sign-up/email",
    "/api/auth/request-password-reset",
    "/api/auth/reset-password",
    "/api/auth/reset-password/abc",
    "/api/auth/admin/impersonate-user",
    "/api/auth/admin/list-users",
    "/api/auth/admin/create-user",
    "/api/auth/two-factor/disable",
    "/api/auth/two-factor/send-otp",
    "/api/auth/delete-user",
    "/api/auth/update-user",
    "/api/auth/sign-in/social",
    "/api/auth/SIGN-IN/email",
    "/api/auth",
    "/api/auth/",
    "/api/authx/sign-in/email",
    "/sign-in/email",
  ])("refuses %s", (pathname) => {
    expect(isAllowedAuthPath(pathname)).toBe(false);
  });

  it("never allows a path the spec disables", () => {
    for (const path of DISABLED_AUTH_PATHS) expect(ALLOWED_AUTH_PATHS.has(path), path).toBe(false);
  });

  it("strips the base path and trailing slashes", () => {
    expect(authEndpointPath("/api/auth/sign-out//")).toBe("/sign-out");
    expect(authEndpointPath("/api/other")).toBeNull();
  });
});
