import { describe, expect, it } from "vitest";
import { securityHeaders, serializeCsp } from "./headers";

function header(key: string): string {
  const found = securityHeaders.find((h) => h.key.toLowerCase() === key.toLowerCase());
  if (!found) throw new Error(`Missing header: ${key}`);
  return found.value;
}

function directives(policy: string): Map<string, string[]> {
  return new Map(
    policy
      .split(";")
      .map((d) => d.trim().split(/\s+/))
      .filter(([name]) => name)
      .map(([name, ...values]) => [name!, values]),
  );
}

describe("security headers", () => {
  it("sends HSTS for two years with subdomains and without preload", () => {
    const hsts = header("Strict-Transport-Security");
    expect(hsts).toContain("max-age=63072000");
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).not.toContain("preload");
  });

  it.each([
    ["X-Content-Type-Options", "nosniff"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
    ["X-Frame-Options", "DENY"],
  ])("sends %s: %s", (key, value) => {
    expect(header(key)).toBe(value);
  });

  it("enforces anti-framing, object and base-uri directives", () => {
    const csp = directives(header("Content-Security-Policy"));
    expect(csp.get("frame-ancestors")).toEqual(["'none'"]);
    expect(csp.get("object-src")).toEqual(["'none'"]);
    expect(csp.get("base-uri")).toEqual(["'self'"]);
  });

  it("does not enforce source restrictions before Phase 14", () => {
    const csp = directives(header("Content-Security-Policy"));
    expect(csp.has("default-src")).toBe(false);
    expect(csp.has("script-src")).toBe(false);
  });

  it("sends the full report-only policy", () => {
    const csp = directives(header("Content-Security-Policy-Report-Only"));
    expect(csp.get("default-src")).toEqual(["'self'"]);
    expect(csp.get("script-src")).toEqual(["'self'", "'unsafe-inline'"]);
    expect(csp.get("style-src")).toEqual(["'self'", "'unsafe-inline'"]);
    expect(csp.get("img-src")).toEqual([
      "'self'",
      "data:",
      "blob:",
      "https://res.cloudinary.com",
      "https://i.ytimg.com",
      "https://i.vimeocdn.com",
    ]);
    expect(csp.get("font-src")).toEqual(["'self'"]);
    expect(csp.get("connect-src")).toEqual(["'self'"]);
    expect(csp.get("frame-src")).toEqual([
      "https://www.youtube-nocookie.com",
      "https://player.vimeo.com",
    ]);
    expect(csp.get("object-src")).toEqual(["'none'"]);
    expect(csp.get("base-uri")).toEqual(["'self'"]);
    expect(csp.get("form-action")).toEqual(["'self'"]);
    expect(csp.get("frame-ancestors")).toEqual(["'none'"]);
    expect(csp.get("upgrade-insecure-requests")).toEqual([]);
  });

  it("never allows unsafe-eval or wildcard sources", () => {
    for (const key of ["Content-Security-Policy", "Content-Security-Policy-Report-Only"]) {
      const policy = header(key);
      expect(policy).not.toContain("'unsafe-eval'");
      expect(policy).not.toMatch(/(^|\s)\*(\s|;|$)/);
    }
  });
});

describe("serializeCsp", () => {
  it("joins directives and keeps value-less directives bare", () => {
    expect(serializeCsp({ "default-src": ["'self'"], "upgrade-insecure-requests": [] })).toBe(
      "default-src 'self'; upgrade-insecure-requests",
    );
  });
});
