import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("uses NEXT_PUBLIC_SITE_URL when set, without a trailing slash", () => {
    expect(
      parseEnv({ NEXT_PUBLIC_SITE_URL: "https://example.com/", VERCEL_ENV: "production" }),
    ).toEqual({ siteUrl: "https://example.com" });
  });

  it("falls back to the branch URL on previews", () => {
    expect(parseEnv({ VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "rhm-git-x.vercel.app" })).toEqual({
      siteUrl: "https://rhm-git-x.vercel.app",
    });
  });

  it("falls back to localhost when nothing is set", () => {
    expect(parseEnv({})).toEqual({ siteUrl: "http://localhost:3000" });
  });

  it("treats an empty string as unset", () => {
    expect(parseEnv({ NEXT_PUBLIC_SITE_URL: "" })).toEqual({ siteUrl: "http://localhost:3000" });
  });

  it("requires NEXT_PUBLIC_SITE_URL in production", () => {
    expect(() => parseEnv({ VERCEL_ENV: "production" })).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("rejects a value that is not a URL", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: "not-a-url" })).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("rejects non-http(s) protocols", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: "javascript:alert(1)" })).toThrow();
  });
});
