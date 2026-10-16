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
  - Unit 939+ passed. E2E ready: 327 passed and 2 skipped, apart from 6 Service JSON-LD checks that expected the old `provider` shape; updated with the `@id`, and `service-pages.spec.ts` then passed 55/55. E2E with `DATABASE_URL` blank: 315 passed, 19 skipped, 1 failed — `seo.spec.ts` asked the unavailable `/portfolio/sportspred` (`noindex`, title only) for Open Graph tags; the test now stops after the canonical check on `noindex` pages. Not yet re-run.
  - Local builds intermittently failed to reach Neon (`[portfolio] read failed: [object ErrorEvent]`) while direct queries worked; a rebuild cleared it. Network, not code.

- **2026-10-16** — Re-ran after the `seo.spec.ts` fix. `DATABASE_URL= pnpm build` logged `[portfolio] read failed: DATABASE_URL is not set` and passed; `DATABASE_URL= E2E_PORTFOLIO_STATE=unavailable pnpm test:e2e --workers=1`: **316 passed, 19 skipped, 0 failed** (4.3 min). `/portfolio/sportspred` now passes the SEO check. The skips are the tests that need published items (9 in `portfolio-detail.spec.ts`, 8 in `portfolio.spec.ts`, 2 detail-page header checks in `shell.spec.ts`).
  - Constitution (plan 0.1, 0.2):
    - **`tech-stack.md`:** rule 9 names the metadata helper, the canonical rule, the share cards and the `Organization` / `LocalBusiness` split. Rule 12 records why `'unsafe-inline'` stays and the SRI measurement. The anti-framing and CSP rows say the policy is enforced and report-only is gone.
    - **`roadmap.md`:** Phases 5, 12 and 14 point to D10 (soft 404 kept). Phase 16 re-runs securityheaders.com on production.
  - Vercel Toolbar (plan 2.5): Vercel's docs (via ctx7, 2026-10-16) give a project setting, Settings → General → Vercel Toolbar → Preview: Off, or `VERCEL_PREVIEW_FEEDBACK_ENABLED=0` per branch. Per owner answer C, the owner turned it off on 2026-10-16. The dashboard now labels the setting **Pre-Production Deployments**: Off, and Production is unchanged. The PR preview's `csp.spec.ts` run confirms it (validation, D9).
  - Local checks (plan 4.1, 4.2):
    - `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm build` passed. `pnpm test`: 939 passed in 24 files.
    - `pnpm test:e2e --workers=1` against the dev database: **333 passed, 2 skipped** (the two tests that need the unavailable state), 6.7 min.
    - The `DATABASE_URL`-blank run is the entry above.
  - Route table (C2): this branch's `DATABASE_URL`-blank build was compared with `develop`'s, taken from the `ci` job log of develop run 38799968319. Every existing route keeps its symbol and its revalidate and expire times. The new routes are the share images (`○`, or `●` under `[slug]`, at 1h / 1d), `/robots.txt` (`○`) and `/sitemap.xml` (`○`, 1m / 1h).
  - Note: a `pnpm install` running in a second worktree at the same time stalled ESLint here for 19 minutes. Run one install or build at a time.
