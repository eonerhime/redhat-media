# Implementation log — Phase 14 SEO + CSP enforced

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

- **2026-10-15** — Branch `feature/phase-14-seo-csp` created from `develop` at `a0b4a0d`. Spec, plan and validation drafted for approval.
  - Today every public route has a title and description, but no canonical, Open Graph, Twitter card, share image, sitemap, robots file or business JSON-LD. `Service` and `CreativeWork` JSON-LD exist (Phases 5 and 12).
  - The CSP enforces only `frame-ancestors`, `object-src` and `base-uri`; the full policy is report-only (`lib/security/headers.ts`).
  - Google's local business guidance (read 2026-10-15) requires only `name` and `address`, so a city-only address validates (D6).

- **2026-10-15** — The owner answered A–D: city-only address; a rendered copy of the "2 Lines" logo on white; Vercel Toolbar off for previews; keep the soft 404 if it remains. The owner approved the spec and the share card designs (E).
