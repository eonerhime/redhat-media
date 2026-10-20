// The client IP for rate limits and Turnstile (Phase 18 spec, D6). On Vercel
// both headers are set by the edge, which overwrites any value the client sent.

import { isIP } from "node:net";

/** The key shared by requests that carry no usable IP. */
export const UNKNOWN_IP = "unknown";

type HeaderSource = Pick<Headers, "get">;

/** `x-real-ip`, else the first `x-forwarded-for` entry, else `unknown`. */
export function clientIp(headers: HeaderSource): string {
  const candidates = [headers.get("x-real-ip"), headers.get("x-forwarded-for")?.split(",")[0]];
  for (const candidate of candidates) {
    const ip = candidate?.trim();
    if (ip && isIP(ip)) return ip;
  }
  return UNKNOWN_IP;
}
