import "server-only";

import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { type Auth, createAuth } from "./core";

export type { Auth } from "./core";

const globalForAuth = globalThis as typeof globalThis & { rhmAuth?: Auth };

/**
 * The runtime Better Auth instance, created on first use. Throws while the CMS is
 * switched off (`CMS_ENABLED`, D11); callers check `env.cms` first.
 */
export function getAuth(): Auth {
  if (!globalForAuth.rhmAuth) {
    if (!env.cms) throw new Error("CMS_ENABLED is off (see .env.example)");
    if (!env.rateLimitSalt) throw new Error("RATE_LIMIT_SALT is not set (see .env.example)");
    globalForAuth.rhmAuth = createAuth({
      db: getDb(),
      secret: env.cms.authSecret,
      baseURL: env.siteUrl,
      trustedOrigins: env.cms.trustedOrigins,
      limiter: rateLimit,
      logSalt: env.rateLimitSalt,
    });
  }
  return globalForAuth.rhmAuth;
}
