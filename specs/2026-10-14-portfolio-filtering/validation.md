# Validation — Phase 11 Portfolio filtering

## Roadmap success check ("Done when", verbatim)

> Filtered URLs are shareable and survive reload, and empty categories never show.

- [x] **Shareable:** opening `/portfolio?category=web-apps` in a fresh page shows the Web & Apps filter as current and its items, already in the server HTML (D2, D9) — `portfolio.spec.ts` › server HTML (JavaScript off) on the PR #15 preview, `preview-e2e` run 38617874084
- [x] **Survives reload:** after choosing Web & Apps, a reload keeps the URL, the current filter and the items (D9) — `portfolio.spec.ts` › a chosen filter … survives a reload, preview run 38617874084
- [x] **Empty categories never show:** on the preview the bar holds only All and Web & Apps. The unit tests cover every category with no items, and `?category=photography` shows All (D3, D9) — `filters.test.ts`; `portfolio.spec.ts` › filters and `?category=` cases, preview run 38617874084

## Page behaviour

- [x] **Stale and bad links:** unknown, repeated and wrongly cased `category` values show All, with no error (D3) — `filters.test.ts` › parseFilter; `portfolio.spec.ts` › four `?category=` cases
- [x] **Unavailable and empty states:** no filter bar, whatever the URL (D3); CI's e2e run checks `?category=web-apps` while unavailable — CI run 38617768204 (`ci`, pinned `unavailable`)
- [x] **Related work:** "See all work" on the Web & App Development page links to `/portfolio?category=web-apps` (D7) — `portfolio.spec.ts` › related work, locally and on the preview
- [x] **Static shell:** the build route table shows `/portfolio` as `◐` and the service pages as prerendered (C2) — `/portfolio` ◐ 1h/1d (ready), ◐ 1m/1h (unavailable); all six service pages fully prerendered (implementation log)

## Accessibility and layout

- [x] **Semantics:** the bar is a labelled `<nav>` of links, and the current one has `aria-current="page"` (D4) — `portfolio.spec.ts` › `expectFilter`
- [x] **Focus and scroll:** after a filter is chosen, focus is on its link and the page has not jumped to the top (D4) — `portfolio.spec.ts` › keyboard Enter keeps focus and `scrollY`, locally and on the preview
- [x] **Contrast and layout:** the shell spec passes on `/portfolio?category=web-apps` at 360/768/1440px, with no sideways page scroll (C5) — `shell.spec.ts` › `/portfolio?category=web-apps`, locally with the bar (ready) and in CI without it (unavailable)

## Gates

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass — locally and CI run 38617768204
- [x] `pnpm test:e2e` passes locally (ready and unavailable) and in CI; `preview-e2e` passes on the Vercel preview — local 240 + 1 skipped (ready) and 233 + 8 skipped (unavailable); CI run 38617768204; `preview-e2e` 18 passed + 1 skipped
- [x] `pnpm test:db` passes (no schema change, C3) — local replica 24 passed; CI `db` job run 38617768204
- [x] Owner check on the preview — owner confirmed 2026-10-14
