# Validation — Phase 14 SEO + CSP enforced

## Roadmap success check ("Done when", verbatim)

> Rich-results and OG validators pass. The enforced CSP raises no console violations across every template, and securityheaders.com rates the site A or better.

- [x] **Rich results:** valid `Organization` (`/`), `LocalBusiness` (`/contact`), `Service` (a service page) and `CreativeWork` (a portfolio item) with no errors (D6, D11, amended 2026-10-16). The owner ran the checks on the PR #19 preview, 2026-10-16, pasting each page's HTML (Code tab):
  - Rich Results Test: `/` has 2 valid items, with non-critical issues only; `/contact` has 2 valid items (LocalBusiness, Organization).
  - Schema Markup Validator: `/services/photography` has `Service` with 0 errors and 0 warnings; `/portfolio/sportspred` has `CreativeWork` with 0 errors and 0 warnings.
- [x] **Open Graph:** the tags and images served on the preview were checked through the shareable link (`curl`, 2026-10-16). The external OG validator and the WhatsApp share move to Phase 16 on production, by owner decision (D11, amended):
  - `og:title`, `og:description`, `og:url`, `og:image` and `twitter:card` are present on `/`, `/about`, `/services/photography`, `/portfolio`, `/portfolio/sportspred` and `/contact`;
  - the site, Photography and SportsPred cards are `image/png` at 1200 × 630 and were viewed.
- [x] **No CSP violations:** `csp.spec.ts` passes on every template in CI and on the Vercel preview, including the lightbox and both video facades (D8, D11). `preview-e2e`: 48 passed, 2 skipped, on runs 38869642277 and 38874025708.
- [x] **securityheaders.com:** computed from the served headers, with the production re-run moved to Phase 16 (D11). All six headers are present and the CSP is enforced, which gives an expected grade of **A** (`'unsafe-inline'` keeps it below A+).

## SEO behaviour

- [x] Every public route sends a canonical URL for its path, except `/portfolio`; unknown and unavailable pages send `noindex` and no canonical (D2). Checked by `seo.spec.ts` and on the preview: `/services/nope` and `/portfolio/nope-item` send `noindex` and no canonical.
- [x] `og:image` URLs are absolute on the deployment's own origin and answer `image/png` at 1200 × 630 (D1, D3)
- [x] The service and portfolio cards fall back to the site card for a muted, unknown or coverless item, or a failed read (D3):
  - on the preview, the `/services/nope` and `/portfolio/nope-item` cards are byte-identical to the site card;
  - muted, coverless and failed-read items take the same branch in `lib/seo/og-images.ts`.
- [x] `sitemap.xml` lists visible services and published items only, never `/dev`, `/cms`, filtered views or muted services, and survives a failed portfolio read (D4). On the preview it lists 15 URLs; `sitemap.test.ts` covers muted services and a failed read.
- [x] `robots.txt` has the sitemap URL and no `Disallow` lines (D5)
- [x] Structured data matches `lib/site.ts` and claims nothing the site does not show (D6, C6): no rating, review, price, founding date or street address.

## CSP

- [x] The SRI result and the D7 decision are recorded in `implementation.md` and `tech-stack.md` (D7)
- [x] One enforced policy; no report-only header; no `'unsafe-eval'` or wildcard outside `pnpm dev` (D8); `preview-headers` confirms it on the deployment
- [x] Vercel Toolbar handled per owner answer C (D9): the owner turned it off ("Pre-Production Deployments: Off"), and `csp.spec.ts` on the preview logs no `vercel.live` violation.

## Soft 404

- [x] Unknown-slug status re-checked on Next 16.4 and handled per owner answer D (D10): they still answer 200 with `noindex`, which is kept.

## Gates

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass
- [x] Route table unchanged apart from the new metadata routes (C2)
- [x] `pnpm test:e2e` passes locally (ready: 333 passed, 2 skipped; unavailable: 316 passed, 19 skipped) and in CI; `preview-e2e` passes on the Vercel preview
- [x] `pnpm test:db` passes (no schema change; the CI `db` job, PR #19)
- [x] Owner check on the preview (share cards): the site, Photography and SportsPred cards look right (owner, 2026-10-16)
