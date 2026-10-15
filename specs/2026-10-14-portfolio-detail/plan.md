# Plan — Phase 12 Portfolio detail page

Scope, decisions (D1–D13) and constraints (C1–C7) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 0. Constitution first

- [x] 0.1 `specs/tech-stack.md`: rule 13 (per-item read tagged `portfolio`), rule 1 (`/portfolio/[slug]` prerendered per slug, later slugs on first request), rule 9 (`CreativeWork` and the `VideoObject` note), and *Schema decisions* (`creditUrl`).
- [x] 0.2 `specs/roadmap.md` Phase 12 row: `CreativeWork`, plus `VideoObject` for videos (owner answer D).
- [x] 0.3 Phase 10 spec D4: a dated note on the card link and the dropped live link (D7, owner answer B).

## 1. Data

- [x] 1.1 `creditUrl` in `prisma/schema.prisma` with a migration, `lib/portfolio/schema.ts` (`httpsUrlSchema`), the seed writer and `prisma/seed-data/portfolio.ts`, with schema tests (D8). — migration `20261014000000_portfolio_credit_url`; `https:` normalises to a trailing slash (`https://emo-onerhime.vercel.app/`).
- [x] 1.2 `fetchPortfolioItem` in `read-core.ts`, with unit and database tests (D2, D13).
- [x] 1.3 `getPortfolioItem(slug)` in `read.ts`, and the static-params helper with its tests (D1, D2). — `detailParams` in `read-core.ts`.

## 2. Page and components

- [x] 2.1 Copy keys from Appendix A in `content/defaults.ts` (D11).
- [x] 2.2 `<MediaImage fit="contain">` for the lightbox (D6).
- [x] 2.3 `components/portfolio/portfolio-detail.tsx`, the gallery and `lightbox.tsx` (D4–D6).
- [x] 2.4 `app/(public)/portfolio/[slug]/page.tsx` and `loading.tsx`: static params, metadata, states (D1, D3, D9).
- [x] 2.5 `portfolioItemJsonLd()` in `lib/seo/json-ld.ts` with tests, rendered on the page (D10).
- [x] 2.6 Confirm that `/portfolio/nope` answers HTTP 404 (in a ready build). If the `/portfolio` loading boundary makes it a streamed 200, move the listing's `loading.tsx` into a route group (D1). Log the result. — 200 with `noindex` even with both `loading.tsx` files removed (Partial Prefetching fallback shell), as `/services/nope`; D1 amended, roadmap Phase 14 revisits.
- [x] 2.7 Card link on `/portfolio` and in related work; the card drops "Visit live site" (D7).
- [x] 2.8 `/dev/portfolio-detail` fixture page (D12).

## 3. Tests

- [x] 3.1 `e2e/portfolio.spec.ts` (or a new `portfolio-detail.spec.ts` joined to `preview-e2e`): ready, fixture and unavailable cases (D13). — new `e2e/portfolio-detail.spec.ts`, added to `preview-e2e`.
- [x] 3.2 `e2e/shell.spec.ts`: `/portfolio/sportspred`; the fixture's 360px check in its own spec (D13 as amended).
- [x] 3.3 Locally: `pnpm build` against the `dev` branch lists every seeded slug under `/portfolio/[slug]`, and a build with `DATABASE_URL` blank still succeeds (placeholder param). Record both route tables. — ready: `/portfolio/[slug]` lists `sportspred`, `hireflow-track` and 3 more as prerendered (1h/1d); unavailable: one `__none__` placeholder.

## 4. Close

- [x] 4.1 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, `pnpm test:e2e --workers=1` (ready, then unavailable). — unit 822/822; e2e ready 266 + 2 skipped, unavailable 249 + 19 skipped.
- [x] 4.2 `pnpm test:db` against a local `postgres:17` container (with the `creditUrl` migration). — local `postgres:17`: drift check clean, seed twice, 27 passed.
- [x] 4.3 PR into `develop`: CI green, `preview-e2e` green on the Vercel preview. — PR #17 (after PR #16 merged and develop run 38728058579 migrated and seeded Neon `preview`); runs 38728527358 and 38728602246 (`preview-e2e` 32 passed, 2 skipped).
- [x] 4.4 Owner check on the preview (a detail page, the lightbox, the card link), then every `validation.md` box ticked. — owner approved on 2026-10-15.
