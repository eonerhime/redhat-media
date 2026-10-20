# Implementation log — Phase 18 Basic inquiry form + abuse protection

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

- **2026-10-20** — Branch `feature/phase-18-inquiry-form` created from `develop` at `0abd037`. Spec, plan and validation drafted for approval.
  - Owner answers A–D given before drafting (Turnstile keys, data-protection contact, retention, Neon plan).
  - Docs checked on context7: Cloudflare Turnstile (`/websites/developers_cloudflare_turnstile`: test keys `1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`; CSP needs `challenges.cloudflare.com` in `script-src`, `connect-src`, `frame-src`; `siteverify` takes an `idempotency_key`) and `@marsidev/react-turnstile` (`/marsidev/react-turnstile`: the token is posted as `cf-turnstile-response`; `options.action`). npm: 1.6.2 is the latest (published 2026-10-11), peer `react ^19.0`.
  - Found while drafting: with no team notification until Phase 20 and no inbox until Phase 32, production inquiries would go unseen. Hence D10's `INQUIRY_FORM_ENABLED` switch, off in production until Phase 20.
- **2026-10-20** — Owner approved the spec as written, including Appendices A and B. Asked about the notice saying rate-limit records go after 30 days while the purge only arrives in Phase 23: keep the wording (no such rows exist in production until Phase 20 turns the form on).
