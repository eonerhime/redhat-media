// Security headers for every route (specs/tech-stack.md → Security baseline,
// specs/2026-10-09-foundation/spec.md scope 4, D8).

export type Header = { key: string; value: string };

export type CspDirectives = Readonly<Record<string, readonly string[]>>;

/** Full policy, report-only until Phase 14 enforces it. */
export const reportOnlyCsp: CspDirectives = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https://res.cloudinary.com",
    "https://i.ytimg.com",
    "https://i.vimeocdn.com",
  ],
  "font-src": ["'self'"],
  "connect-src": ["'self'"],
  "frame-src": ["https://www.youtube-nocookie.com", "https://player.vimeo.com"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": [],
};

/**
 * Enforced from day one. Browsers ignore frame-ancestors in a report-only
 * policy, and these directives cannot break a Next.js page.
 */
export const enforcedCsp: CspDirectives = {
  "frame-ancestors": ["'none'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
};

export function serializeCsp(directives: CspDirectives): string {
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(" "))
    .join("; ");
}

export const securityHeaders: readonly Header[] = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: serializeCsp(enforcedCsp) },
  { key: "Content-Security-Policy-Report-Only", value: serializeCsp(reportOnlyCsp) },
];
