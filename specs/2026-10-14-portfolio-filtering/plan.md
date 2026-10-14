# Plan — Phase 11 Portfolio filtering

Scope, decisions (D1–D9) and constraints (C1–C6) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 0. Constitution first

- [x] 0.1 `specs/tech-stack.md`: rule 2 (filter slugs, Marketing grouping, links, stale links show All) and rule 1 (`/portfolio` partially prerendered).
- [x] 0.2 `specs/roadmap.md`: open question 4, the owner's answer of 2026-10-14.
- [x] 0.3 Phase 10 spec D8: a dated note that "See all work" links to the filtered URL.

## 1. Filter model

- [x] 1.1 `lib/portfolio/filters.ts` and `filters.test.ts` (D1, D3, D9).

## 2. Page and components

- [x] 2.1 Copy keys from Appendix A in `content/defaults.ts` (D8).
- [x] 2.2 `components/portfolio/portfolio-filters.tsx`: the bar, current state, `scroll={false}` and focus kept on the chosen filter (D4; no restore needed, see 2.5).
- [x] 2.3 `app/(public)/portfolio/page.tsx`: `PortfolioResults` inside `<Suspense>` with a fallback that keeps the layout steady; the listing gets `data-filter` (D2, D5).
- [x] 2.4 `components/services/related-work.tsx`: "See all work" goes to the filtered URL (D7).
- [x] 2.5 Confirm in the browser whether a filter change remounts the bar, and keep the focus restore only if it does (D4). Log the result. — it does not: focus and scroll hold, so there is no client component.

## 3. Tests

- [x] 3.1 `e2e/portfolio.spec.ts`: filter cases for ready and unavailable, plus the related-work `href` (D9).
- [x] 3.2 `e2e/shell.spec.ts`: `/portfolio?category=web-apps` (D9).
- [x] 3.3 Locally: `pnpm build` against the `dev` branch shows `/portfolio` as `◐`, and a build with `DATABASE_URL` blank still succeeds. Record both route tables. — ready: `/portfolio` ◐ 1h/1d; unavailable: ◐ 1m/1h.

## 4. Close

- [x] 4.1 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, `pnpm test:e2e --workers=1` (ready, then unavailable). — unit 758/758; e2e ready 240 + 1 skipped, unavailable 233 + 8 skipped.
- [x] 4.2 `pnpm test:db` against a local `postgres:17` container (unchanged suite; confirms C3). — 24 passed.
- [ ] 4.3 PR into `develop`: CI green, `preview-e2e` green on the Vercel preview.
- [ ] 4.4 Owner check on the preview (filter bar, shared link, reload), then every `validation.md` box ticked.
