import { describe, expect, it, vi } from "vitest";
import { cmsSessionResponse, sessionAnswer } from "./session-endpoint";
import { hasSessionCookie } from "./staff-session";
import { fakeSession } from "./testing/fakes";

// GET /api/cms/session (Phase 25 spec, D8). session-endpoint.db.test.ts runs it
// with real sign-ins.

const request = (cookie?: string) =>
  new Request("https://rhm.example/api/cms/session", {
    headers: cookie ? { cookie } : {},
  });

describe("sessionAnswer()", () => {
  it("answers a visitor with no role and not signed in", () => {
    expect(sessionAnswer(null)).toEqual({ role: null, authenticated: false });
  });

  it("gives no role before 2FA is set up", () => {
    expect(sessionAnswer(fakeSession({ twoFactorEnabled: false }))).toEqual({
      role: null,
      authenticated: true,
    });
  });

  it("gives the role once 2FA is on", () => {
    expect(sessionAnswer(fakeSession({ role: "editor" }))).toEqual({
      role: "editor",
      authenticated: true,
    });
  });
});

describe("cmsSessionResponse()", () => {
  it("is a 404 while the CMS is off", async () => {
    const readSession = vi.fn();
    const response = await cmsSessionResponse(request("better-auth.session_token=x"), {
      cmsEnabled: false,
      readSession,
    });
    expect(response.status).toBe(404);
    expect(readSession).not.toHaveBeenCalled();
  });

  it("answers a visitor without reading the session", async () => {
    const readSession = vi.fn();
    const response = await cmsSessionResponse(request("theme=dark"), {
      cmsEnabled: true,
      readSession,
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ role: null, authenticated: false });
    expect(readSession).not.toHaveBeenCalled();
  });

  it("reads the session when a session cookie is sent", async () => {
    const readSession = vi.fn(async () => fakeSession({ role: "sales" }));
    const response = await cmsSessionResponse(
      request("theme=dark; __Secure-better-auth.session_token=abc"),
      { cmsEnabled: true, readSession },
    );
    expect(await response.json()).toEqual({ role: "sales", authenticated: true });
    expect(readSession).toHaveBeenCalledOnce();
  });
});

describe("hasSessionCookie()", () => {
  it("finds either session cookie name, and nothing else", () => {
    expect(hasSessionCookie("better-auth.session_token=a")).toBe(true);
    expect(hasSessionCookie("x=1; __Secure-better-auth.session_token=a")).toBe(true);
    expect(hasSessionCookie("better-auth.two_factor=a")).toBe(false);
    expect(hasSessionCookie("my-better-auth.session_token=a")).toBe(false);
    expect(hasSessionCookie(null)).toBe(false);
  });
});
