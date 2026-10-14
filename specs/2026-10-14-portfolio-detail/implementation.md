# Implementation log — Phase 12 Portfolio detail page

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

- **2026-10-14** — Branch `feature/phase-12-portfolio-detail` created from `develop` at `a1b4fc2`. Spec, plan and validation drafted for approval.
  - Docs read through ctx7 (`/vercel/next.js`): with Cache Components, `generateStaticParams` must return at least one param (an empty list fails the build with `empty-generate-static-params`), `dynamicParams` is not supported, and params not listed render on request and are then cached (spec D1).
  - Google Search Central, checked 2026-10-14: the Software App result requires `name`, `offers.price` and one of `aggregateRating` or `review`; `VideoObject` requires `name`, `thumbnailUrl` and `uploadDate` (spec D10).
  - The seed source folder (`../emo-onerhime/public/projects`) holds one screenshot per product, so the seeded items have no gallery yet (spec *What and why*, D12).

- **2026-10-14** — The owner approved the spec with every recommendation (A–D): Appendix A as drafted, cards drop "Visit live site", the credit links to `https://emo-onerhime.vercel.app` through a new `creditUrl` column, and `CreativeWork` for every item.
  - Constitution amendments (plan 0.1–0.3): `tech-stack.md` rules 1, 9 and 13 and *Schema decisions*; `README.md` §5 (`creditUrl`); `roadmap.md` Phase 12 row and a Phase 14 note; Phase 10 spec D4.
  - Data: migration `20261014000000_portfolio_credit_url` (one nullable column), applied to the Neon `dev` branch with `pnpm db:deploy` after checking the target was `ep-purple-mountain-zavlw8ji`, then `pnpm db:seed` (5 updated). `fetchPortfolioItem` re-checks every stored video ID through the Phase 8 parser. `getPortfolioItem` is tagged `portfolio`. The page rejects a value that is not a valid slug before any database read, so junk URLs add no cache entries.
  - `<MediaImage fit="contain">` uses next/image fill mode with CldImage's default `limit` crop: no crop, scaled to each srcset width.
  - The lightbox closes on Escape, Close or a backdrop click; `html:has(dialog:modal)` stops the page behind from scrolling.
  - **Deviations from the draft:**
    - **Unknown slugs (D1 amended, plan 2.6):** HTTP 200 with the not-found page and `noindex`, not 404. A ready build with both `loading.tsx` files removed gave the same 200, so the cause is Partial Prefetching's fallback shell, not the loading boundaries, and `/services/nope` behaves the same (Phase 5 spec, D1). The not-found render emits two `robots` metas, both `noindex`; the test checks every one. The roadmap's Phase 14 row now says to revisit both routes.
    - **Unavailable state (D3 amended):** the shared CTA follows the message, as on `/portfolio`.
    - **Lightbox text (D6):** the line under the image shows the caption, or the alt text when there is none, rather than both.
    - **Tests (D13 amended):** `/dev/portfolio-detail` is not in `shell.spec.ts` (the `/dev` layout has no header or footer) and has its own 360px check instead. The shell's sticky-header check skips a page that cannot scroll (the unavailable detail page at 768px and 1440px). Tab in the open lightbox may move focus to the browser's own controls, so the test checks that focus never reaches the page behind.
  - Screenshots checked at 1440px and 360px (detail page, card focus ring, fixture gallery and lightbox). The HireFlow cover's left edge is cut in the source screenshot itself (1200×750 on Cloudinary, the same on the Phase 10 card), not by the page.
  - Unit: 822 passed. E2E ready (`dev`): 266 passed, 2 skipped. E2E with `DATABASE_URL` blank: 249 passed, 19 skipped. `pnpm test:db` on a local `postgres:17` replica of the `db` job (host checked as `localhost:55432`; drift check clean; seed twice): 27 passed; container and credentials removed.
