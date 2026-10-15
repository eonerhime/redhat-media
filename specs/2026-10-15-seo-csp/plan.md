# Plan — Phase 14 SEO + CSP enforced

Scope, decisions (D1–D11) and constraints (C1–C7) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 0. Constitution first

- [ ] 0.1 `specs/tech-stack.md`: the CSP row, rules 9 and 12 (D2, D3, D6, D7, D8). The CSP wording is finalised after task 2.1.
- [ ] 0.2 `specs/roadmap.md`: soft-404 pointer to D10; Phase 16 re-runs securityheaders.com on production if needed (D11).

## 1. SEO

- [x] 1.1 `lib/seo/metadata.ts` → `pageMetadata()` with unit tests; `metadataBase` in the root layout (D1).
- [x] 1.2 Every public `generateMetadata` uses the helper; canonical rule incl. the `/portfolio` exception and `noindex` states (D2).
- [x] 1.3 Logo asset per owner answer B; Archivo Bold TTF + OFL licence in `assets/fonts/` (D3).
- [x] 1.4 Open Graph images: site card, service card, portfolio card with fallbacks (D3).
- [x] 1.5 `app/sitemap.ts` and `app/robots.ts` with unit tests (D4, D5).
- [x] 1.6 `lib/site.ts`: structured hours and address fields; `organizationJsonLd()` and `localBusinessJsonLd()` with unit tests; `@id` references from `Service` and `CreativeWork`; blocks on `/` and `/contact` (D6).

## 2. CSP

- [x] 2.1 SRI experiment: production build with `experimental.sri` and `script-src 'self'` (no `'unsafe-inline'`), every template checked for violations. Record the result and apply the D7 decision rule.
- [x] 2.2 Check the production build's requests on every template against the policy's sources (D8).
- [x] 2.3 `lib/security/headers.ts`: one enforced policy, report-only header removed, `securityHeaders({ dev })`; `next.config.ts` passes `dev`; `headers.test.ts` rewritten (D8, C4).
- [x] 2.4 `scripts/check-preview-headers.mts`: production values, and no report-only header (D8).
- [ ] 2.5 Vercel Toolbar per owner answer C (D9).

## 3. Soft 404

- [x] 3.1 Re-check `/services/nope` and `/portfolio/nope` on a production build; act per owner answer D (D10).

## 4. Tests and close

- [ ] 4.1 `e2e/seo.spec.ts` and `e2e/csp.spec.ts`; `csp.spec.ts` joins `preview-e2e` (D11). Route table compared with `develop`'s (C2).
- [ ] 4.2 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, `pnpm test:e2e --workers=1` (ready, then with `DATABASE_URL` blank).
- [ ] 4.3 PR into `develop`: CI, `preview-headers` and `preview-e2e` green; external validators run on the preview (D11).
- [ ] 4.4 Owner check on the preview (share cards, a shared link on a phone), then every `validation.md` box ticked.
