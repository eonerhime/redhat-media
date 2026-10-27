import { afterEach, describe, expect, it, vi } from "vitest";
import { securityLog, type SecurityLogFields } from "./security-log";

afterEach(() => vi.restoreAllMocks());

describe("securityLog (Phase 24 spec, D20)", () => {
  it("writes one JSON line with the event and the known fields", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    securityLog("auth.lockout", { userId: "u1", keyHash: "abc123", path: "/sign-in/email" });
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '{"event":"auth.lockout","userId":"u1","keyHash":"abc123","path":"/sign-in/email"}',
    );
  });

  it("writes the guard's reason and action (Phase 25 spec, D12)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    securityLog("auth.forbidden", { userId: "u1", reason: "role", action: "content.update" });
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '{"event":"auth.forbidden","userId":"u1","reason":"role","action":"content.update"}',
    );
  });

  it("drops anything outside the fixed fields, such as an email or a password", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const smuggled = {
      userId: "u1",
      email: "admin@example.com",
      password: "hunter2hunter2",
    } as SecurityLogFields;
    securityLog("auth.sign_in_failed", smuggled);
    const line = String(warn.mock.calls[0]?.[0]);
    expect(line).not.toContain("admin@example.com");
    expect(line).not.toContain("hunter2");
    expect(JSON.parse(line)).toEqual({ event: "auth.sign_in_failed", userId: "u1" });
  });
});
