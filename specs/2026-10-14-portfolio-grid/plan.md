# Plan — Phase 10 Portfolio grid

Scope, decisions (D1–D12) and constraints (C1–C6) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 0. Constitution first

- [x] 0.1 `specs/tech-stack.md`: rule 8 (one public error boundary, fixed copy), rule 13 (the `portfolio` cache tag) and *Supporting tools → E2E* (`preview-e2e`).
- [x] 0.2 Phase 8 spec D5 (`16/10` aspect) and Phase 5 spec D6 (filled by Phase 10): dated amendment notes.
- [x] 0.3 `CLAUDE.md`: `PW_BASE_URL` on the `pnpm test:e2e` row.

## 1. Read layer

- [x] 1.1 `lib/media/cloudinary.ts`: the `16/10` aspect, with its test (D4).
- [x] 1.2 `lib/content/services.ts`: `serviceByCategory()`, with its test (D4).
- [x] 1.3 `lib/portfolio/read-core.ts` (`fetchPublishedPortfolio`, `toCards`, `relatedTo`) and `read-core.test.ts` (D1, D10).
- [x] 1.4 `lib/portfolio/read-core.db.test.ts` (D10).
- [x] 1.5 `lib/portfolio/read.ts`: `getPublishedPortfolio()` with `"use cache"`, `cacheTag("portfolio")` and the two `cacheLife` profiles. Confirm through ctx7 that `cacheTag` and `cacheLife` can be called after the `await` inside a `try` (D2).

## 2. Page and components

- [x] 2.1 Copy keys from Appendix A in `content/defaults.ts`, and `errorCopy` in `lib/site.ts` (D6, D9).
- [x] 2.2 `components/portfolio/portfolio-card.tsx` and `portfolio-grid.tsx` (D4).
- [x] 2.3 `app/(public)/portfolio/page.tsx` with the three states and metadata (D3, D7).
- [x] 2.4 `app/(public)/portfolio/loading.tsx` (D5) and `app/(public)/error.tsx` (D6).
- [x] 2.5 `components/services/related-work.tsx` (D8).
- [x] 2.6 `app/(dev)/dev/portfolio-states/page.tsx` (D10).
- [x] 2.7 `lib/site.ts`: update the nav comment about pages that 404.

## 3. Tests and CI

- [x] 3.1 `e2e/portfolio.spec.ts` and `/portfolio` in `e2e/shell.spec.ts` (D10).
- [x] 3.2 `playwright.config.ts`: `PW_BASE_URL` and the bypass header (D11).
- [x] 3.3 `ci.yml`: `E2E_PORTFOLIO_STATE=unavailable` on the e2e step (D11).
- [x] 3.4 `preview-headers.yml`: the `preview-e2e` job (D11).
- [x] 3.5 Locally: `pnpm build` against the `dev` branch shows **ready**; then a build with `DATABASE_URL` unset shows **unavailable**. Record both route tables. — ready: `/portfolio` ○ 1h/1d; unavailable: ○ 1m/1h (implementation log).

## 4. Close

- [x] 4.1 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, `pnpm test:e2e --workers=1`. — unit 720/720; e2e 221 ready (220 + the fixed hover test) and 220 + 1 skipped unavailable.
- [x] 4.2 `pnpm test:db` against a local `postgres:17` container (the CI `db` job replica). — 24 passed (23 + `read-core.db.test.ts`).
- [ ] 4.3 PR into `develop`: CI green, `preview-e2e` green on the Vercel preview.
- [ ] 4.4 Owner check on the preview (cards, hover, related work), then every `validation.md` box ticked.
