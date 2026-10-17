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

  it.each([
    ["no opt-in", {}],
    ["an opt-in other than 1", { SEED_ALLOW_PRODUCTION: "true" }],
  ])("refuses production with %s", (_, env) => {
    expect(() => assertSeedTarget(neon(PRODUCTION_ENDPOINT_ID), env)).toThrow(
      "only migrate-production may",
    );
  });

  it("accepts production with SEED_ALLOW_PRODUCTION=1 (Phase 16 spec, D1)", () => {
    expect(assertSeedTarget(neon(PRODUCTION_ENDPOINT_ID), { SEED_ALLOW_PRODUCTION: "1" })).toBe(
      `${PRODUCTION_ENDPOINT_ID}.c-2.eu-west-2.aws.neon.tech`,
    );
  });

  it("refuses VERCEL_ENV=production even with the opt-in", () => {
    expect(() =>
      assertSeedTarget(neon(PRODUCTION_ENDPOINT_ID), {
        VERCEL_ENV: "production",
        SEED_ALLOW_PRODUCTION: "1",
      }),
    ).toThrow("VERCEL_ENV is production");
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
