import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

// Test-only values: no real host or password.
const APP_URL =
  "postgresql://rhm_app:pw@ep-x-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";
const SALT = "s".repeat(32);
const db = { DATABASE_URL: APP_URL, RATE_LIMIT_SALT: SALT };

describe("parseEnv", () => {
  it("uses NEXT_PUBLIC_SITE_URL when set, without a trailing slash", () => {
    expect(
      parseEnv({ NEXT_PUBLIC_SITE_URL: "https://example.com/", VERCEL_ENV: "production", ...db }),
    ).toMatchObject({ siteUrl: "https://example.com" });
  });

  it("falls back to the branch URL on previews", () => {
    expect(
      parseEnv({ VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "rhm-git-x.vercel.app", ...db }),
    ).toMatchObject({ siteUrl: "https://rhm-git-x.vercel.app" });
  });

  it("falls back to localhost when nothing is set", () => {
    expect(parseEnv({})).toEqual({ siteUrl: "http://localhost:3000" });
  });

  it("treats an empty string as unset", () => {
    expect(parseEnv({ NEXT_PUBLIC_SITE_URL: "" })).toEqual({ siteUrl: "http://localhost:3000" });
  });

  it("requires NEXT_PUBLIC_SITE_URL in production", () => {
    expect(() => parseEnv({ VERCEL_ENV: "production", ...db })).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("rejects a value that is not a URL", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: "not-a-url" })).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("rejects non-http(s) protocols", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: "javascript:alert(1)" })).toThrow();
  });
});

describe("parseEnv: database (Phase 7 spec, D7)", () => {
  it("returns the database URL and salt", () => {
    expect(parseEnv(db)).toEqual({
      siteUrl: "http://localhost:3000",
      databaseUrl: APP_URL,
      rateLimitSalt: SALT,
    });
  });

  it("leaves both optional locally and in the CI build", () => {
    expect(parseEnv({})).toEqual({ siteUrl: "http://localhost:3000" });
  });

  it.each(["preview", "production"])("requires both on Vercel %s", (VERCEL_ENV) => {
    const source = { VERCEL_ENV, NEXT_PUBLIC_SITE_URL: "https://example.com" };
    expect(() => parseEnv(source)).toThrow(/DATABASE_URL/);
    expect(() => parseEnv(source)).toThrow(/RATE_LIMIT_SALT/);
  });

  it.each([
    ["the migrator role", APP_URL.replace("rhm_app", "rhm_migrator"), /rhm_app role/],
    ["the owner role", APP_URL.replace("rhm_app", "neondb_owner"), /rhm_app role/],
    ["no sslmode", APP_URL.replace("?sslmode=require", ""), /sslmode=require/],
    ["sslmode=disable", APP_URL.replace("require", "disable"), /sslmode=require/],
    ["a non-postgres URL", "https://rhm_app@example.com/?sslmode=require", /postgres:\/\//],
    ["not a URL", "nope", /postgres:\/\//],
  ])("rejects a DATABASE_URL with %s", (_, DATABASE_URL, message) => {
    expect(() => parseEnv({ DATABASE_URL })).toThrow(message);
  });

  it("accepts sslmode=verify-full", () => {
    const DATABASE_URL = APP_URL.replace("require", "verify-full");
    expect(parseEnv({ DATABASE_URL }).databaseUrl).toBe(DATABASE_URL);
  });

  it("rejects a short salt", () => {
    expect(() => parseEnv({ RATE_LIMIT_SALT: "short" })).toThrow(/RATE_LIMIT_SALT/);
  });

  it.each(["MIGRATOR_DATABASE_URL", "BOOTSTRAP_DATABASE_URL"])(
    "fails the Vercel build when %s is set",
    (key) => {
      expect(() => parseEnv({ VERCEL: "1", ...db, [key]: "postgresql://x" })).toThrow(
        new RegExp(`Must not be set on Vercel[\\s\\S]*${key}`),
      );
    },
  );

  it("allows MIGRATOR_DATABASE_URL off Vercel (local .env.local, CI)", () => {
    expect(() => parseEnv({ ...db, MIGRATOR_DATABASE_URL: "postgresql://x" })).not.toThrow();
  });

  it("never echoes a secret in its error", () => {
    const secret = "do-not-print-me";
    const DATABASE_URL = `postgresql://rhm_migrator:${secret}@h/db`;
    expect(() => parseEnv({ DATABASE_URL })).toThrow();
    try {
      parseEnv({ DATABASE_URL });
    } catch (error) {
      expect((error as Error).message).not.toContain(secret);
    }
  });
});
