import "server-only";

import { env } from "@/lib/env";
import { createTurnstileVerifier, type TurnstileVerifier } from "./turnstile-core";

export type { TurnstileVerifier } from "./turnstile-core";

let verifier: TurnstileVerifier | undefined;

/**
 * Checks a Turnstile token with Cloudflare (Phase 18 spec, D5). Resolves false
 * on any failure, including a timeout, so callers fail closed.
 *
 * @example const human = await verifyTurnstile(token, ip, "inquiry");
 */
export const verifyTurnstile: TurnstileVerifier = (token, remoteIp, action) => {
  if (!verifier) {
    if (!env.inquiryForm) throw new Error("TURNSTILE_SECRET_KEY is not set (see .env.example)");
    verifier = createTurnstileVerifier({
      fetchFn: fetch,
      secret: env.inquiryForm.turnstileSecretKey,
      hostname: new URL(env.siteUrl).hostname,
    });
  }
  return verifier(token, remoteIp, action);
};
