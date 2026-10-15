# Validation — Phase 12 Portfolio detail page

## Roadmap success check ("Done when", verbatim)

> Each item has its own page, metadata and JSON-LD (`CreativeWork`, plus `VideoObject` when it has videos; Phase 12 spec, D10).

- [x] **Own page:** every seeded slug answers 200 at `/portfolio/{slug}` with its title, highlights, tech stack, live link, credit and CTA, and the build's route table lists them as prerendered (D1, D4, C2) — `portfolio-detail.spec.ts` › `/portfolio/{slug}` ×5 on the PR #17 preview, `preview-e2e` run 38728602246; route table in plan 3.3
- [x] **Metadata:** each page's `<title>` and description are the item's own (D9) — same tests, preview run 38728602246
- [x] **JSON-LD:** each page has one `CreativeWork` JSON-LD block (owner answer D), and the unit tests cover `VideoObject` for items with videos (D10) — same tests (exactly one block); `json-ld.test.ts`

## Page behaviour

- [x] **Not found:** `/portfolio/nope` shows the not-found page with `noindex` (D1 as amended 2026-10-14: HTTP 200 under Partial Prefetching, as `/services/nope`; Phase 14 revisits) — `portfolio-detail.spec.ts` › `/portfolio/no-such-item` and `/portfolio/Not_A_Slug`, preview run 38728602246
- [x] **Unavailable:** with the database unreachable, a detail URL shows the unavailable message, a link to `/portfolio` and `noindex` (D3) — `portfolio-detail.spec.ts` › unavailable, CI run 38728527358 (`ci`, `DATABASE_URL` blank: 249 passed, 19 skipped)
- [x] **New items need no deploy:** a build with no database still succeeds (placeholder param), and slugs not listed at build time render on request (D1) — CI run 38728527358 build: `/portfolio/[slug]` ◐ with only `/portfolio/__none__`, and the unavailable test renders a seeded slug on request
- [x] **Card link:** clicking a card on `/portfolio` opens its detail page; the card no longer shows "Visit live site" (D7, owner answer B) — `portfolio-detail.spec.ts` › a card on /portfolio opens its page (one link per card), preview run 38728602246
- [x] **Credit:** the credit line links to `https://emo-onerhime.vercel.app` on every seeded item (D8, owner answer C) — `/portfolio/{slug}` tests, preview run 38728602246; `schema.test.ts`
- [x] **External links:** live and repo links are `https:`, open in a new tab with `rel="noopener noreferrer"`, and only HireFlow has a repo link (C6) — `/portfolio/{slug}` tests, preview run 38728602246

## Gallery and lightbox

- [x] **Mixed gallery:** on the fixture page, images and videos render in order, and no iframe loads before a click (D5, D12, C7) — `portfolio-detail.spec.ts` › `/dev/portfolio-detail` shows images and videos in order, locally and in CI run 38728527358
- [x] **Lightbox:** opens at the chosen image, shows it whole, moves with Next, Previous and the arrow keys, updates its counter, closes on Escape and the backdrop, and returns focus to the opener (D6) — fixture lightbox and backdrop tests, locally and in CI run 38728527358
- [x] **Real data:** on the preview, a seeded item's hero opens the lightbox (D6) — `portfolio-detail.spec.ts` › the hero opens the lightbox, preview run 38728602246

## Accessibility and layout

- [x] **Contrast and layout:** the shell spec passes on `/portfolio/sportspred` at 360/768/1440px, and the fixture page does not scroll sideways at 360px (C5; D13 as amended) — `shell.spec.ts` › `/portfolio/sportspred`, locally (ready) and in CI run 38728527358; fixture 360px test

- [x] **Semantics:** one `h1`, section headings as `h2`, labelled lightbox controls, and the image buttons named "View larger: {alt}" (D4–D6) — `h1`, lightbox controls and "View larger" buttons found by role and name in `portfolio-detail.spec.ts`; section headings are `h2` in `components/portfolio/portfolio-detail.tsx`

## Gates

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass — locally (plan 4.1) and in CI run 38728527358 (unit 822)
- [x] `pnpm test:e2e` passes locally (ready and unavailable) and in CI; `preview-e2e` passes on the Vercel preview — local 266 + 2 skipped / 249 + 19 skipped; CI 249 + 19 skipped; preview 32 + 2 skipped
- [x] `pnpm test:db` passes — local `postgres:17` replica (27) and the `db` job in CI run 38728527358
- [x] Owner check on the preview — owner approved on 2026-10-15 ("go ahead"), on the PR #17 preview
