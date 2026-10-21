import { z } from "zod";
import { TURNSTILE_TEST_KEY } from "./security/turnstile-core";

// The schema grows per phase: a variable becomes required in the phase that
// first uses it (specs/tech-stack.md → Environment variables).

// Treat empty strings (e.g. `NEXT_PUBLIC_SITE_URL=` in a .env file) as unset.
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

// Runtime database URL (Phase 7 spec, D7): the least-privilege rhm_app role,
// over TLS. Rejects the migrator or owner credential used by mistake.
const databaseUrl = z.string().superRefine((value, ctx) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    ctx.addIssue({ code: "custom", message: "Must be a postgres:// URL" });
    return;
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:")
    ctx.addIssue({ code: "custom", message: "Must be a postgres:// URL" });
  if (url.username !== "rhm_app")
    ctx.addIssue({ code: "custom", message: "Must use the rhm_app role" });
  const sslmode = url.searchParams.get("sslmode");
  if (sslmode !== "require" && sslmode !== "verify-full")
    ctx.addIssue({ code: "custom", message: "Must set sslmode=require (or verify-full)" });
});

// "Name <address>", the shape Resend takes for `from` (Phase 20 spec, D9).
const SENDER = /^[^<>"\r\n]{1,64} <([^\s<>]+)>$/;

// 1–5 comma-separated addresses (Phase 20 spec, D2).
const emailList = z
  .string()
  .transform((value) => value.split(",").map((part) => part.trim()))
  .pipe(z.array(z.email("Must be email addresses, comma-separated")).min(1).max(5));

// Credentials that must never reach a Vercel deployment (Phase 7 spec, D7).
const FORBIDDEN_ON_VERCEL = ["MIGRATOR_DATABASE_URL", "BOOTSTRAP_DATABASE_URL"] as const;

const envSchema = z
  .object({
    NEXT_PUBLIC_SITE_URL: optional(z.url({ protocol: /^https?$/ })),
    VERCEL: optional(z.string()),
    VERCEL_ENV: optional(z.enum(["production", "preview", "development"])),
    VERCEL_BRANCH_URL: optional(z.string()),
    DATABASE_URL: optional(databaseUrl),
    RATE_LIMIT_SALT: optional(z.string().min(32, "Must be at least 32 characters")),
    MIGRATOR_DATABASE_URL: optional(z.string()),
    BOOTSTRAP_DATABASE_URL: optional(z.string()),
    // Public: it appears in every image URL (Phase 8 spec, D4).
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: optional(
      z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/, "Must be a Cloudinary cloud name"),
    ),
    // The inquiry form's switch (Phase 18 spec, D10): on in production from the Phase 20 release.
    INQUIRY_FORM_ENABLED: optional(z.enum(["0", "1"], "Must be 1 (on) or 0 (off)")),
    // Public: the widget's site key is in the page (D5).
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: optional(
      z.string().regex(/^[0-9A-Za-z_-]{1,100}$/, "Must be a Turnstile site key"),
    ),
    TURNSTILE_SECRET_KEY: optional(z.string().min(1).max(200)),
    // Email (Phase 20 spec, D8, D9). All server-only.
    RESEND_API_KEY: optional(z.string().regex(/^re_[\w-]{8,200}$/, "Must be a Resend API key")),
    EMAIL_FROM: optional(
      z
        .string()
        .regex(SENDER, "Must be Name <address>")
        .refine((value) => z.email().safeParse(SENDER.exec(value)?.[1]).success, {
          message: "Must be Name <address>",
        }),
    ),
    INQUIRY_NOTIFICATION_EMAIL: optional(emailList),
    INQUIRY_ACK_ENABLED: optional(z.enum(["0", "1"], "Must be 1 (on) or 0 (off)")),
    EMAIL_REDIRECT_TO: optional(z.email("Must be one email address")),
  })
  .superRefine((env, ctx) => {
    if (env.INQUIRY_FORM_ENABLED === "1") {
      for (const key of ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"] as const) {
        if (!env[key]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: "Required when INQUIRY_FORM_ENABLED=1",
          });
        }
      }
    }
    if (env.VERCEL_ENV === "production") {
      for (const key of ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"] as const) {
        const value = env[key];
        if (value && TURNSTILE_TEST_KEY.test(value)) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: "Must not be a Cloudflare test key in production",
          });
        }
      }
    }
    // Email (Phase 20 spec, D9): a deployed form must notify the team; a preview setting
    // must not reach production; the acknowledgment needs a verified domain.
    if (
      (env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview") &&
      env.INQUIRY_FORM_ENABLED === "1"
    ) {
      for (const key of ["RESEND_API_KEY", "EMAIL_FROM", "INQUIRY_NOTIFICATION_EMAIL"] as const) {
        if (!env[key]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: `Required when INQUIRY_FORM_ENABLED=1 and VERCEL_ENV=${env.VERCEL_ENV}`,
          });
        }
      }
    }
    if (env.VERCEL_ENV === "production" && env.EMAIL_REDIRECT_TO) {
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_REDIRECT_TO"],
        message: "Must not be set in production",
      });
    }
    if (
      env.VERCEL_ENV === "production" &&
      env.INQUIRY_ACK_ENABLED === "1" &&
      env.EMAIL_FROM?.toLowerCase().endsWith("@resend.dev>")
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["INQUIRY_ACK_ENABLED"],
        message: "Needs EMAIL_FROM on a verified domain in production, not @resend.dev",
      });
    }
    if (env.VERCEL_ENV === "production" && !env.NEXT_PUBLIC_SITE_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SITE_URL"],
        message: "Required when VERCEL_ENV=production",
      });
    }
    if (env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview") {
      for (const key of [
        "DATABASE_URL",
        "RATE_LIMIT_SALT",
        "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
      ] as const) {
        if (!env[key]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: `Required when VERCEL_ENV=${env.VERCEL_ENV}`,
          });
        }
      }
    }
    if (env.VERCEL === "1") {
      for (const key of FORBIDDEN_ON_VERCEL) {
        if (env[key]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: "Must not be set on Vercel (migrations run from CI only)",
          });
        }
      }
    }
  });

export type Env = {
  /** Canonical origin without a trailing slash. */
  siteUrl: string;
  /** rhm_app connection string; read only through `getDb()` (lib/db.ts). */
  databaseUrl?: string;
  /** Salt for rate-limit key hashes (lib/security/rate-limit.ts). */
  rateLimitSalt?: string;
  /** Cloudinary cloud name; read by <MediaImage> (components/media/). */
  cloudinaryCloudName?: string;
  /** Vercel deployment target; unset locally and in CI. */
  vercelEnv?: "production" | "preview" | "development";
  /**
   * Set only while the inquiry form is switched on (`INQUIRY_FORM_ENABLED=1`), with its
   * Turnstile keys (Phase 18 spec, D5, D10). The secret is read only by lib/security/turnstile.ts.
   */
  inquiryForm?: { turnstileSiteKey: string; turnstileSecretKey: string };
  /**
   * Set only when Resend is configured (Phase 20 spec, D8, D9): CI and local runs have no key,
   * so every send is skipped. The key is read only by lib/email/send.ts.
   */
  email?: {
    resendApiKey: string;
    from: string;
    notificationTo: string[];
    /** `INQUIRY_ACK_ENABLED=1`: send the client acknowledgment. */
    ackEnabled: boolean;
    /** Replaces every recipient (Vercel Preview: delivered@resend.dev). */
    redirectTo?: string;
  };
};

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    // Messages name the variable and the rule, never the value.
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  const {
    NEXT_PUBLIC_SITE_URL,
    VERCEL_ENV,
    VERCEL_BRANCH_URL,
    DATABASE_URL,
    RATE_LIMIT_SALT,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    INQUIRY_FORM_ENABLED,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    TURNSTILE_SECRET_KEY,
    RESEND_API_KEY,
    EMAIL_FROM,
    INQUIRY_NOTIFICATION_EMAIL,
    INQUIRY_ACK_ENABLED,
    EMAIL_REDIRECT_TO,
  } = result.data;
  const siteUrl =
    NEXT_PUBLIC_SITE_URL ??
    (VERCEL_BRANCH_URL ? `https://${VERCEL_BRANCH_URL}` : "http://localhost:3000");
  return {
    siteUrl: siteUrl.replace(/\/+$/, ""),
    databaseUrl: DATABASE_URL,
    rateLimitSalt: RATE_LIMIT_SALT,
    cloudinaryCloudName: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    vercelEnv: VERCEL_ENV,
    inquiryForm:
      INQUIRY_FORM_ENABLED === "1" && NEXT_PUBLIC_TURNSTILE_SITE_KEY && TURNSTILE_SECRET_KEY
        ? {
            turnstileSiteKey: NEXT_PUBLIC_TURNSTILE_SITE_KEY,
            turnstileSecretKey: TURNSTILE_SECRET_KEY,
          }
        : undefined,
    email:
      RESEND_API_KEY && EMAIL_FROM && INQUIRY_NOTIFICATION_EMAIL
        ? {
            resendApiKey: RESEND_API_KEY,
            from: EMAIL_FROM,
            notificationTo: INQUIRY_NOTIFICATION_EMAIL,
            ackEnabled: INQUIRY_ACK_ENABLED === "1",
            redirectTo: EMAIL_REDIRECT_TO,
          }
        : undefined,
  };
}

export const env = parseEnv(process.env);
