import { describe, expect, it } from "vitest";
import { assertSeedTarget, PRODUCTION_ENDPOINT_ID } from "./seed-guard";

const neon = (endpoint: string) =>
  `postgresql://rhm_migrator:pw@${endpoint}.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require`;

describe("assertSeedTarget (Phase 9 spec, D7)", () => {
  it.each([
    [
      "the dev branch",
      neon("ep-purple-mountain-zavlw8ji"),
      "ep-purple-mountain-zavlw8ji.c-2.eu-west-2.aws.neon.tech",
    ],
    [
      "the preview branch",
      neon("ep-broad-haze-za0j8qbh"),
      "ep-broad-haze-za0j8qbh.c-2.eu-west-2.aws.neon.tech",
    ],
    ["the CI container", "postgresql://rhm_migrator:pw@localhost:5432/rhm", "localhost"],
  ])("accepts %s and returns its host", (_, url, host) => {
    expect(assertSeedTarget(url, {})).toBe(host);
  });

  it.each([
    ["the production endpoint", neon(PRODUCTION_ENDPOINT_ID)],
    ["the production pooler", neon(`${PRODUCTION_ENDPOINT_ID}-pooler`)],
  ])("refuses %s", (_, url) => {
    expect(() => assertSeedTarget(url, {})).toThrow("Refusing to seed the production branch");
  });

  it("refuses VERCEL_ENV=production, whatever the URL", () => {
    expect(() =>
      assertSeedTarget(neon("ep-purple-mountain-zavlw8ji"), { VERCEL_ENV: "production" }),
    ).toThrow("VERCEL_ENV is production");
  });

  it("refuses a missing or malformed URL without echoing it", () => {
    expect(() => assertSeedTarget(undefined, {})).toThrow("MIGRATOR_DATABASE_URL is not set");
    expect(() => assertSeedTarget("not a url with secret", {})).toThrow(
      /^MIGRATOR_DATABASE_URL is not a valid connection URL\.$/,
    );
  });
});
