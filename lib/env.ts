import { z } from "zod";

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
  })
  .superRefine((env, ctx) => {
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
  };
}

export const env = parseEnv(process.env);
