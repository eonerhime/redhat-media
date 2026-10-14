# Validation — Phase 12 Portfolio detail page

## Roadmap success check ("Done when", verbatim)

> Each item has its own page, metadata and JSON-LD (`CreativeWork`, plus `VideoObject` when it has videos; Phase 12 spec, D10).

- [ ] **Own page:** every seeded slug answers 200 at `/portfolio/{slug}` with its title, highlights, tech stack, live link, credit and CTA, and the build's route table lists them as prerendered (D1, D4, C2)
- [ ] **Metadata:** each page's `<title>` and description are the item's own (D9)
- [ ] **JSON-LD:** each page has one `CreativeWork` JSON-LD block (owner answer D), and the unit tests cover `VideoObject` for items with videos (D10)

## Page behaviour

- [ ] **Not found:** `/portfolio/nope` shows the not-found page with `noindex` (D1 as amended 2026-10-14: HTTP 200 under Partial Prefetching, as `/services/nope`; Phase 14 revisits)
- [ ] **Unavailable:** with the database unreachable, a detail URL shows the unavailable message, a link to `/portfolio` and `noindex` (D3)
- [ ] **New items need no deploy:** a build with no database still succeeds (placeholder param), and slugs not listed at build time render on request (D1)
- [ ] **Card link:** clicking a card on `/portfolio` opens its detail page; the card no longer shows "Visit live site" (D7, owner answer B)
- [ ] **Credit:** the credit line links to `https://emo-onerhime.vercel.app` on every seeded item (D8, owner answer C)
- [ ] **External links:** live and repo links are `https:`, open in a new tab with `rel="noopener noreferrer"`, and only HireFlow has a repo link (C6)

## Gallery and lightbox

- [ ] **Mixed gallery:** on the fixture page, images and videos render in order, and no iframe loads before a click (D5, D12, C7)
- [ ] **Lightbox:** opens at the chosen image, shows it whole, moves with Next, Previous and the arrow keys, updates its counter, closes on Escape and the backdrop, and returns focus to the opener (D6)
- [ ] **Real data:** on the preview, a seeded item's hero opens the lightbox (D6)

## Accessibility and layout

- [ ] **Contrast and layout:** the shell spec passes on `/portfolio/sportspred` at 360/768/1440px, and the fixture page does not scroll sideways at 360px (C5; D13 as amended)
- [ ] **Semantics:** one `h1`, section headings as `h2`, labelled lightbox controls, and the image buttons named "View larger: {alt}" (D4–D6)

## Gates

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass
- [ ] `pnpm test:e2e` passes locally (ready and unavailable) and in CI; `preview-e2e` passes on the Vercel preview
- [ ] `pnpm test:db` passes
- [ ] Owner check on the preview
