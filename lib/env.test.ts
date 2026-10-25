import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

// Test-only values: no real host or password.
const APP_URL =
  "postgresql://rhm_app:pw@ep-x-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";
const SALT = "s".repeat(32);
const db = { DATABASE_URL: APP_URL, RATE_LIMIT_SALT: SALT };
const cloud = { NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "test-cloud" };
// Shaped like a real Resend key; not real.
const RESEND_KEY = "re_example_0000000000000000";
const mail = {
  RESEND_API_KEY: RESEND_KEY,
  EMAIL_FROM: "RedHat Media <onboarding@resend.dev>",
  INQUIRY_NOTIFICATION_EMAIL: "team@example.com",
};

describe("parseEnv", () => {
  it("uses NEXT_PUBLIC_SITE_URL when set, without a trailing slash", () => {
    expect(
      parseEnv({
        NEXT_PUBLIC_SITE_URL: "https://example.com/",
        VERCEL_ENV: "production",
        ...db,
        ...cloud,
      }),
    ).toMatchObject({ siteUrl: "https://example.com" });
  });

  it("falls back to the branch URL on previews", () => {
    expect(
      parseEnv({
        VERCEL_ENV: "preview",
        VERCEL_BRANCH_URL: "rhm-git-x.vercel.app",
        ...db,
        ...cloud,
      }),
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

  it.each(["MIGRATOR_DATABASE_URL", "BOOTSTRAP_DATABASE_URL", "RETENTION_DATABASE_URL"])(
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

describe("parseEnv: inquiry form and Turnstile (Phase 18 spec, D5, D10)", () => {
  const site = { NEXT_PUBLIC_SITE_URL: "https://example.com", ...db, ...cloud };
  const TEST_SITE = "1x00000000000000000000AA";
  const TEST_SECRET = "1x0000000000000000000000000000000AA";
  // Shaped like real keys; not real.
  const REAL_SITE = "0x4AAAAAAAexampleSiteKey";
  const REAL_SECRET = "0x4AAAAAAAexampleSecretKey000000000";
  const on = {
    INQUIRY_FORM_ENABLED: "1",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: TEST_SITE,
    TURNSTILE_SECRET_KEY: TEST_SECRET,
  };

  it("is off when the switch is unset, 0 or empty", () => {
    expect(parseEnv({}).inquiryForm).toBeUndefined();
    expect(parseEnv({ INQUIRY_FORM_ENABLED: "0" }).inquiryForm).toBeUndefined();
    expect(parseEnv({ INQUIRY_FORM_ENABLED: "" }).inquiryForm).toBeUndefined();
  });

  it("returns the keys when the switch is on", () => {
    expect(parseEnv(on).inquiryForm).toEqual({
      turnstileSiteKey: TEST_SITE,
      turnstileSecretKey: TEST_SECRET,
    });
  });

  it("stays off with keys set but the switch off", () => {
    expect(parseEnv({ ...on, INQUIRY_FORM_ENABLED: "0" }).inquiryForm).toBeUndefined();
  });

  it.each(["true", "yes", "on", "2"])("rejects INQUIRY_FORM_ENABLED=%j", (value) => {
    expect(() => parseEnv({ INQUIRY_FORM_ENABLED: value })).toThrow(/INQUIRY_FORM_ENABLED/);
  });

  it.each(["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"])(
    "requires %s when the switch is on",
    (key) => {
      expect(() => parseEnv({ ...on, [key]: undefined })).toThrow(
        new RegExp(`Required when INQUIRY_FORM_ENABLED=1[\\s\\S]*${key}`),
      );
    },
  );

  it("accepts the test keys on previews", () => {
    expect(parseEnv({ VERCEL_ENV: "preview", ...site, ...on, ...mail }).inquiryForm).toBeDefined();
  });

  it.each([
    ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", TEST_SITE],
    ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "2x00000000000000000000AB"],
    ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "3x00000000000000000000FF"],
    ["TURNSTILE_SECRET_KEY", TEST_SECRET],
    ["TURNSTILE_SECRET_KEY", "2x0000000000000000000000000000000AA"],
  ])("refuses %s=%s (a test key) in production", (key, value) => {
    const source = {
      VERCEL_ENV: "production",
      ...site,
      ...on,
      ...mail,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: REAL_SITE,
      TURNSTILE_SECRET_KEY: REAL_SECRET,
      [key]: value,
    };
    expect(() => parseEnv(source)).toThrow(
      new RegExp(`Must not be a Cloudflare test key in production[\\s\\S]*${key}`),
    );
  });

  it("refuses a test key in production even with the switch off", () => {
    const source = { VERCEL_ENV: "production", ...site, TURNSTILE_SECRET_KEY: TEST_SECRET };
    expect(() => parseEnv(source)).toThrow(/test key/);
  });

  it("accepts real keys in production", () => {
    const source = {
      VERCEL_ENV: "production",
      ...site,
      INQUIRY_FORM_ENABLED: "1",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: REAL_SITE,
      TURNSTILE_SECRET_KEY: REAL_SECRET,
      ...mail,
    };
    expect(parseEnv(source).inquiryForm?.turnstileSiteKey).toBe(REAL_SITE);
  });

  it("does not require the keys in production while the switch is off", () => {
    expect(parseEnv({ VERCEL_ENV: "production", ...site }).inquiryForm).toBeUndefined();
  });

  it("rejects a site key with characters a key never has", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_TURNSTILE_SITE_KEY: "a b" })).toThrow(
      /Must be a Turnstile site key/,
    );
  });

  it("never echoes the secret in its error", () => {
    const secret = "1x0000000000000000000000000000000AA";
    try {
      parseEnv({ VERCEL_ENV: "production", ...site, TURNSTILE_SECRET_KEY: secret });
    } catch (error) {
      expect((error as Error).message).not.toContain(secret);
      return;
    }
    throw new Error("expected parseEnv to throw");
  });
});

describe("parseEnv: email (Phase 20 spec, D8, D9)", () => {
  const site = { NEXT_PUBLIC_SITE_URL: "https://example.com", ...db, ...cloud };
  const form = {
    INQUIRY_FORM_ENABLED: "1",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAAAexampleSiteKey",
    TURNSTILE_SECRET_KEY: "0x4AAAAAAAexampleSecretKey000000000",
  };

  it("leaves email unset without a key, so sends are skipped (CI, local)", () => {
    expect(parseEnv({}).email).toBeUndefined();
    expect(parseEnv({ ...form }).email).toBeUndefined();
  });

  it("returns the settings, with the acknowledgment off by default", () => {
    expect(
      parseEnv({ ...mail, INQUIRY_NOTIFICATION_EMAIL: " a@example.com, b@example.com " }).email,
    ).toEqual({
      resendApiKey: RESEND_KEY,
      from: "RedHat Media <onboarding@resend.dev>",
      notificationTo: ["a@example.com", "b@example.com"],
      ackEnabled: false,
      redirectTo: undefined,
    });
  });

  it("turns the acknowledgment on and redirects on previews", () => {
    const source = {
      VERCEL_ENV: "preview",
      ...site,
      ...form,
      ...mail,
      INQUIRY_ACK_ENABLED: "1",
      EMAIL_REDIRECT_TO: "delivered@resend.dev",
    };
    expect(parseEnv(source).email).toMatchObject({
      ackEnabled: true,
      redirectTo: "delivered@resend.dev",
    });
  });

  it.each(["preview", "production"])(
    "requires the key, sender and inbox on Vercel %s when the form is on",
    (VERCEL_ENV) => {
      for (const key of ["RESEND_API_KEY", "EMAIL_FROM", "INQUIRY_NOTIFICATION_EMAIL"]) {
        expect(() => parseEnv({ VERCEL_ENV, ...site, ...form, ...mail, [key]: undefined })).toThrow(
          new RegExp(`Required when INQUIRY_FORM_ENABLED=1 and VERCEL_ENV[\\s\\S]*${key}`),
        );
      }
    },
  );

  it("does not require them in production while the form is off", () => {
    expect(parseEnv({ VERCEL_ENV: "production", ...site }).email).toBeUndefined();
  });

  it("refuses EMAIL_REDIRECT_TO in production", () => {
    const source = {
      VERCEL_ENV: "production",
      ...site,
      ...mail,
      EMAIL_REDIRECT_TO: "x@example.com",
    };
    expect(() => parseEnv(source)).toThrow(/Must not be set in production[\s\S]*EMAIL_REDIRECT_TO/);
  });

  it("refuses the acknowledgment in production while sending from resend.dev", () => {
    const source = { VERCEL_ENV: "production", ...site, ...mail, INQUIRY_ACK_ENABLED: "1" };
    expect(() => parseEnv(source)).toThrow(/verified domain[\s\S]*INQUIRY_ACK_ENABLED/);
  });

  it("allows the acknowledgment in production from a verified domain", () => {
    const source = {
      VERCEL_ENV: "production",
      ...site,
      ...mail,
      EMAIL_FROM: "RedHat Media <hello@example.com>",
      INQUIRY_ACK_ENABLED: "1",
    };
    expect(parseEnv(source).email?.ackEnabled).toBe(true);
  });

  it.each([
    "onboarding@resend.dev",
    "<onboarding@resend.dev>",
    "RedHat Media <not-an-address>",
    "Bad\nName <a@example.com>",
  ])("rejects EMAIL_FROM=%j", (value) => {
    expect(() => parseEnv({ EMAIL_FROM: value })).toThrow(/Must be Name <address>/);
  });

  it.each(["not-an-email", "a@example.com,", "a@x.com,b@x.com,c@x.com,d@x.com,e@x.com,f@x.com"])(
    "rejects INQUIRY_NOTIFICATION_EMAIL=%j",
    (value) => {
      expect(() => parseEnv({ INQUIRY_NOTIFICATION_EMAIL: value })).toThrow(
        /INQUIRY_NOTIFICATION_EMAIL/,
      );
    },
  );

  it("rejects a key that is not a Resend key, without echoing it", () => {
    const secret = "sk_live_not_resend_0000";
    try {
      parseEnv({ RESEND_API_KEY: secret });
    } catch (error) {
      expect((error as Error).message).toMatch(/Must be a Resend API key/);
      expect((error as Error).message).not.toContain(secret);
      return;
    }
    throw new Error("expected parseEnv to throw");
  });
});

describe("parseEnv: Cloudinary (Phase 8 spec, D4)", () => {
  const site = { NEXT_PUBLIC_SITE_URL: "https://example.com" };

  it("returns the cloud name and the Vercel environment", () => {
    expect(parseEnv({ VERCEL_ENV: "preview", ...db, ...cloud })).toMatchObject({
      cloudinaryCloudName: "test-cloud",
      vercelEnv: "preview",
    });
  });

  it("leaves it optional locally and in CI", () => {
    expect(parseEnv({}).cloudinaryCloudName).toBeUndefined();
  });

  it.each(["preview", "production"])("requires it on Vercel %s", (VERCEL_ENV) => {
    expect(() => parseEnv({ VERCEL_ENV, ...site, ...db })).toThrow(
      /Required when VERCEL_ENV[\s\S]*NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME/,
    );
  });

  it.each(["Lezxe6hz", "-abc", "has space", "a/b", "res.cloudinary.com", "a".repeat(65)])(
    "rejects %j",
    (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) => {
      expect(() => parseEnv({ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME })).toThrow(
        /Must be a Cloudinary cloud name/,
      );
    },
  );
});
