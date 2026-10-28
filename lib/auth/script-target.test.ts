import { describe, expect, it } from "vitest";
import { PRODUCTION_ENDPOINT_ID } from "@/lib/db/seed-guard";
import { adminSecretsFile, assertAuthScriptTarget } from "./script-target";

const url = (host: string) => `postgresql://rhm_migrator:pw@${host}/neondb?sslmode=require`;

describe("assertAuthScriptTarget (Phase 24 spec, D12)", () => {
  it("returns the host for dev and preview branches", () => {
    expect(assertAuthScriptTarget(url("ep-dev-123.eu-west-2.aws.neon.tech"))).toBe(
      "ep-dev-123.eu-west-2.aws.neon.tech",
    );
  });

  it("always refuses production in Phase 24", () => {
    expect(() =>
      assertAuthScriptTarget(url(`${PRODUCTION_ENDPOINT_ID}.eu-west-2.aws.neon.tech`)),
    ).toThrow(/production/);
    expect(() =>
      assertAuthScriptTarget(url("ep-dev-123.neon.tech"), { VERCEL_ENV: "production" }),
    ).toThrow(/production/);
  });

  it("needs a valid URL", () => {
    expect(() => assertAuthScriptTarget(undefined)).toThrow(/not set/);
    expect(() => assertAuthScriptTarget("not a url")).toThrow(/not a valid/);
  });
});

describe("adminSecretsFile", () => {
  it("names a .env.*.local file, which .gitignore covers", () => {
    expect(adminSecretsFile("preview")).toBe(".env.admin-preview.local");
  });

  it("refuses odd branch names", () => {
    expect(() => adminSecretsFile("../x")).toThrow();
  });
});
