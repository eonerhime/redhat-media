// Cloudflare Turnstile server-side verification (Phase 18 spec, D5). The server
// entry point is ./turnstile.ts; this module takes `fetch`, the secret and the
// expected hostname as arguments so tests need no network.

import { z } from "zod";
import type { FetchFn } from "@/lib/media/fetch-capped";

// Cloudflare's documented test keys (`1x…AA` always passes, `2x…` always fails,
// `3x…` forces a challenge or reports a spent token). Real keys start `0x`.
// lib/env.ts refuses them in production.
export const TURNSTILE_TEST_KEY = /^[1-3]x0+[A-F]{2}$/;

export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const SITEVERIFY_TIMEOUT_MS = 5000;

// Cloudflare documents tokens of up to 2,048 characters.
const MAX_TOKEN_LENGTH = 2048;

const responseSchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
});

/** Resolves true only for a token Cloudflare accepts for `action` on this site. Never throws. */
export type TurnstileVerifier = (
  token: string | undefined,
  remoteIp: string | undefined,
  action: string,
) => Promise<boolean>;

export type TurnstileOptions = {
  fetchFn: FetchFn;
  secret: string;
  /** The site's host, e.g. `redhat-media.vercel.app`, checked against a real secret's reply. */
  hostname: string;
  idempotencyKey?: () => string;
};

export function createTurnstileVerifier({
  fetchFn,
  secret,
  hostname,
  idempotencyKey = () => crypto.randomUUID(),
}: TurnstileOptions): TurnstileVerifier {
  // A test secret's reply names a placeholder host and no action, so only a real
  // secret's reply can be held to this site and form.
  const checkClaims = !TURNSTILE_TEST_KEY.test(secret);

  return async (token, remoteIp, action) => {
    if (!token || token.length > MAX_TOKEN_LENGTH) return false;

    const body = new URLSearchParams({
      secret,
      response: token,
      idempotency_key: idempotencyKey(),
    });
    if (remoteIp) body.set("remoteip", remoteIp);

    let json: unknown;
    try {
      const response = await fetchFn(SITEVERIFY_URL, {
        method: "POST",
        body,
        redirect: "error",
        signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
      });
      if (!response.ok) return false;
      json = await response.json();
    } catch {
      // Timeout, network error or a body that is not JSON: fail closed.
      return false;
    }

    const parsed = responseSchema.safeParse(json);
    if (!parsed.success || !parsed.data.success) return false;
    if (!checkClaims) return true;
    return parsed.data.action === action && parsed.data.hostname === hostname;
  };
}
