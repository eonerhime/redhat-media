import { describe, expect, it } from "vitest";
import { securityHeaders, serializeCsp, STAFF_AREA_SOURCE, staffAreaHeaders } from "./headers";

function header(key: string, dev = false): string | undefined {
  return securityHeaders({ dev }).find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;
}

function required(key: string, dev = false): string {
  const value = header(key, dev);
  if (value === undefined) throw new Error(`Missing header: ${key}`);
  return value;
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
    const hsts = required("Strict-Transport-Security");
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
    expect(required(key)).toBe(value);
  });

  it("enforces the full policy from Phase 14 (spec D8)", () => {
    const csp = directives(required("Content-Security-Policy"));
    expect(csp.get("default-src")).toEqual(["'self'"]);
    // 'unsafe-inline' stays: the SRI experiment blocked Next's inline scripts on every page (D7).
    expect(csp.get("script-src")).toEqual([
      "'self'",
      "'unsafe-inline'",
      "https://challenges.cloudflare.com",
    ]);
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
    expect(csp.get("connect-src")).toEqual([
      "'self'",
      "https://challenges.cloudflare.com",
      "https://api.cloudinary.com",
    ]);
    expect(csp.get("frame-src")).toEqual([
      "https://www.youtube-nocookie.com",
      "https://player.vimeo.com",
      "https://challenges.cloudflare.com",
    ]);
    expect(csp.get("object-src")).toEqual(["'none'"]);
    expect(csp.get("base-uri")).toEqual(["'self'"]);
    expect(csp.get("form-action")).toEqual(["'self'"]);
    expect(csp.get("frame-ancestors")).toEqual(["'none'"]);
    expect(csp.get("upgrade-insecure-requests")).toEqual([]);
  });

  it("allows Turnstile's origin in script-src, frame-src and connect-src only (Phase 18 D5)", () => {
    const csp = directives(required("Content-Security-Policy"));
    const withTurnstile = [...csp]
      .filter(([, values]) => values.includes("https://challenges.cloudflare.com"))
      .map(([name]) => name)
      .sort();
    expect(withTurnstile).toEqual(["connect-src", "frame-src", "script-src"]);
  });

  it("allows Cloudinary's upload API in connect-src only (Phase 28 D11)", () => {
    const csp = directives(required("Content-Security-Policy"));
    const withUpload = [...csp]
      .filter(([, values]) => values.includes("https://api.cloudinary.com"))
      .map(([name]) => name);
    expect(withUpload).toEqual(["connect-src"]);
  });

  it("sends no report-only policy", () => {
    expect(header("Content-Security-Policy-Report-Only")).toBeUndefined();
    expect(header("Content-Security-Policy-Report-Only", true)).toBeUndefined();
  });

  it("never allows unsafe-eval or wildcard sources outside pnpm dev", () => {
    const policy = required("Content-Security-Policy");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).not.toMatch(/(^|\s)\*(\s|;|$)/);
  });

  it("adds unsafe-eval to script-src for pnpm dev only, and nothing else", () => {
    const dev = directives(required("Content-Security-Policy", true));
    const prod = directives(required("Content-Security-Policy"));
    expect(dev.get("script-src")).toEqual([
      "'self'",
      "'unsafe-inline'",
      "https://challenges.cloudflare.com",
      "'unsafe-eval'",
    ]);
    dev.delete("script-src");
    prod.delete("script-src");
    expect(dev).toEqual(prod);
  });
});

describe("serializeCsp", () => {
  it("joins directives and keeps value-less directives bare", () => {
    expect(serializeCsp({ "default-src": ["'self'"], "upgrade-insecure-requests": [] })).toBe(
      "default-src 'self'; upgrade-insecure-requests",
    );
  });
});

describe("staff area headers (Phase 24 spec, D13)", () => {
  it("marks every /admin response noindex, nofollow", () => {
    expect(STAFF_AREA_SOURCE).toBe("/admin/:path*");
    expect(staffAreaHeaders()).toEqual([{ key: "X-Robots-Tag", value: "noindex, nofollow" }]);
  });

  it("leaves the public routes indexable", () => {
    expect(securityHeaders().some((h) => h.key.toLowerCase() === "x-robots-tag")).toBe(false);
  });
});
