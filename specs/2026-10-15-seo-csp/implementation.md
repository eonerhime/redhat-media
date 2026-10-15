# Implementation log — Phase 14 SEO + CSP enforced

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

- **2026-10-15** — Branch `feature/phase-14-seo-csp` created from `develop` at `a0b4a0d`. Spec, plan and validation drafted for approval.
  - Today every public route has a title and description, but no canonical, Open Graph, Twitter card, share image, sitemap, robots file or business JSON-LD. `Service` and `CreativeWork` JSON-LD exist (Phases 5 and 12).
  - The CSP enforces only `frame-ancestors`, `object-src` and `base-uri`; the full policy is report-only (`lib/security/headers.ts`).
  - Google's local business guidance (read 2026-10-15) requires only `name` and `address`, so a city-only address validates (D6).

- **2026-10-15** — The owner answered A–D: city-only address; a rendered copy of the "2 Lines" logo on white; Vercel Toolbar off for previews; keep the soft 404 if it remains. The owner approved the spec and the share card designs (E).

- **2026-10-15** — CSP assessment (plan 2.1). A production build with `experimental.sri` and an enforced `script-src 'self'` (no `'unsafe-inline'`) logged **560 violations across 17 templates**: Next's inline bootstrap and RSC payload scripts are blocked on every page. Per the D7 rule, `'unsafe-inline'` stays and the SRI flag is not adopted. The same run confirmed `/services/nope` and `/portfolio/nope` still answer 200 with `noindex` on Next 16.4; kept per owner answer D (plan 3.1).
  - Enforced policy (plan 2.2, 2.3): the probe (every template, lightbox, both video players, unknown slugs) logged **0 violations**. The report-only header is gone; `pnpm dev` alone adds `'unsafe-eval'`. `check-preview-headers.mts` also fails if a report-only header is served (2.4).
  - SEO (plan 1.1–1.6): `pageMetadata()` on every public route, `metadataBase`, canonicals (none on `/portfolio`), share cards, `sitemap.ts`, `robots.ts`, `Organization` on `/`, `LocalBusiness` on `/contact`, `@id` links from `Service` and `CreativeWork`. Logo on white rendered from the owner's artwork to `public/brand/logo-on-light.png` (600 × 367); Archivo Medium and ExtraBold TTF plus OFL in `assets/fonts/`.
  - **Deviations:** (1) a page's own `openGraph` replaces the inherited site card, so `/about`, `/services`, `/portfolio` and `/contact` each have an `opengraph-image.tsx` that re-exports the site card. (2) Cache Components stops a prerender at uncached I/O, so card PNGs are rendered inside `"use cache"` helpers (`lib/seo/og-images.ts`); every card route now prerenders. (3) The sitemap sends no `lastModified`: no stored date says when a page last changed (D4 said "from `publishedAt` when known").
  - Route table: every page route keeps its rendering mode; new routes are the share images (`○`/`●`), `/robots.txt` and `/sitemap.xml`.
  - Unit 939+ passed. E2E ready: 327 passed and 2 skipped, apart from 6 Service JSON-LD checks that expected the old `provider` shape; updated with the `@id`, and `service-pages.spec.ts` then passed 55/55. Unavailable-state run was in progress at the break.
  - Local builds intermittently failed to reach Neon (`[portfolio] read failed: [object ErrorEvent]`) while direct queries worked; a rebuild cleared it. Network, not code.
