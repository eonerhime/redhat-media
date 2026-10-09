import { z } from "zod";

// The schema grows per phase: a variable becomes required in the phase that
// first uses it (specs/tech-stack.md → Environment variables).

// Treat empty strings (e.g. `NEXT_PUBLIC_SITE_URL=` in a .env file) as unset.
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

const envSchema = z
  .object({
    NEXT_PUBLIC_SITE_URL: optional(z.url({ protocol: /^https?$/ })),
    VERCEL_ENV: optional(z.enum(["production", "preview", "development"])),
    VERCEL_BRANCH_URL: optional(z.string()),
  })
  .superRefine((env, ctx) => {
    if (env.VERCEL_ENV === "production" && !env.NEXT_PUBLIC_SITE_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SITE_URL"],
        message: "Required when VERCEL_ENV=production",
      });
    }
  });

export type Env = {
  /** Canonical origin without a trailing slash. */
  siteUrl: string;
};

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  const { NEXT_PUBLIC_SITE_URL, VERCEL_BRANCH_URL } = result.data;
  const siteUrl =
    NEXT_PUBLIC_SITE_URL ??
    (VERCEL_BRANCH_URL ? `https://${VERCEL_BRANCH_URL}` : "http://localhost:3000");
  return { siteUrl: siteUrl.replace(/\/+$/, "") };
}

export const env = parseEnv(process.env);
