// The one rule for external links (Phase 9 spec, D2). Used on write by the
// portfolio seed (and the CMS from Phase 31) and on render by <ExternalLink>.
// Relative imports only: prisma/seed.mts runs this file under plain Node.

import { z } from "zod";

export const MAX_URL_LENGTH = 2048;

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
const DNS_LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

export type HttpsUrlCheck = { ok: true; url: string } | { ok: false; error: string };

/** Accepts `https://` links to a public domain name; returns the normalised href. */
export function checkHttpsUrl(input: string): HttpsUrlCheck {
  const value = input.trim();
  if (value === "") return { ok: false, error: "Enter a link." };
  if (value.length > MAX_URL_LENGTH) {
    return { ok: false, error: "Links must be at most 2,048 characters." };
  }
  if (/[\s\u0000-\u001f\u007f]/.test(value)) {
    return { ok: false, error: "Links cannot contain spaces or control characters." };
  }
  // Checked on the raw text, before parsing: the URL parser would turn
  // `https:\\host` or `https:host` into a valid https URL.
  if (!value.toLowerCase().startsWith("https://")) {
    return { ok: false, error: "Links must start with https://" };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: "This is not a valid link." };
  }

  if (url.username || url.password) {
    return { ok: false, error: "Links cannot contain a username or password." };
  }
  if (url.port) return { ok: false, error: "Links cannot include a port." };

  const host = url.hostname;
  if (
    host.startsWith("[") ||
    IPV4.test(host) ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    !host.includes(".")
  ) {
    return { ok: false, error: "Links must point to a public domain name." };
  }

  // The parser lets through hosts such as `a..b` or `a_b.com`. Internationalised
  // names arrive here as punycode (`xn--…`), so they pass.
  if (!host.split(".").every((label) => DNS_LABEL.test(label))) {
    return { ok: false, error: "This is not a valid link." };
  }

  return { ok: true, url: url.href };
}

export function isHttpsUrl(input: string): boolean {
  return checkHttpsUrl(input).ok;
}

/** Zod form of checkHttpsUrl: outputs the normalised href. */
export const httpsUrlSchema = z.string().transform((value, ctx) => {
  const result = checkHttpsUrl(value);
  if (!result.ok) {
    ctx.addIssue({ code: "custom", message: result.error });
    return z.NEVER;
  }
  return result.url;
});
