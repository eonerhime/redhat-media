// Security headers for every route (specs/tech-stack.md → Security baseline,
// specs/2026-10-09-foundation/spec.md scope 4, D8; specs/2026-10-15-seo-csp/spec.md D7, D8).

export type Header = { key: string; value: string };

export type CspDirectives = Readonly<Record<string, readonly string[]>>;

// Cloudflare Turnstile's script, challenge frame and calls (Phase 18 spec, D5).
const TURNSTILE = "https://challenges.cloudflare.com";

/**
 * The enforced policy (Phase 14). script-src keeps 'unsafe-inline': Next.js renders inline
 * bootstrap and RSC payload scripts on every page, which differ per page and per build, so a
 * static header can list no hash for them, and nonces would make every page dynamic (D7).
 */
export const csp: CspDirectives = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", TURNSTILE],
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
  "connect-src": ["'self'", TURNSTILE],
  "frame-src": ["https://www.youtube-nocookie.com", "https://player.vimeo.com", TURNSTILE],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": [],
};

/** `pnpm dev` only: React needs eval in development. Never in a build (D8). */
export const devCsp: CspDirectives = {
  ...csp,
  "script-src": [...(csp["script-src"] ?? []), "'unsafe-eval'"],
};

export function serializeCsp(directives: CspDirectives): string {
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(" "))
    .join("; ");
}

/** The hidden staff area (tech-stack.md → Architectural rules 6; Phase 24 spec, D13). */
export const STAFF_AREA_SOURCE = "/admin/:path*";

/** Added to every /admin response, beside securityHeaders(). Not in robots.txt, which would advertise it. */
export function staffAreaHeaders(): readonly Header[] {
  return [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
}

export function securityHeaders({ dev = false }: { dev?: boolean } = {}): readonly Header[] {
  return [
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Content-Security-Policy", value: serializeCsp(dev ? devCsp : csp) },
  ];
}
