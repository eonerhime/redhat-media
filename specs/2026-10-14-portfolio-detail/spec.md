# Phase 12 — Portfolio detail page

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 1, Phase 12
- **Branch:** `feature/phase-12-portfolio-detail` (from `develop` at `a1b4fc2`)
- **Started:** 2026-10-14
- **Status:** approved by the owner, 2026-10-14

## What and why

`/portfolio` shows each published item as a card, but nothing deeper: no description, no highlights, no gallery and no credit. This phase gives every published item its own page at **`/portfolio/[slug]`**, with a mixed image and video gallery, a lightbox, highlights, the tech stack, the live link, the credit line and a CTA. The page is prerendered for every published slug and refreshed like the rest of the portfolio (ISR through the cached, tagged read).

Today the five published items are all Web & Apps, and each has exactly one image (its cover). There are no further screenshots in the seed source folder, and no videos. So on real data each page shows the cover as its hero and **no gallery section** yet. The gallery, the lightbox's previous/next controls and the videos are proven on a developer fixture page (D12) until more media is added, by seed amendment or by the CMS (Phases 29–30).

## Constitution sections this phase relies on

- `mission.md` → *How the portfolio is framed* (engineering products as RHM case studies, "credited to Emo Onerhime as technical lead and links to the personal portfolio") and *Guiding principles* 1 (inquiry first), 2 (the site is the proof), 3 (credibility is a conversion feature) and 4 (honest claims only).
- `tech-stack.md` → *Architectural rules* 1 (server-first; the lightbox and video facades are the client parts), 2 (items have real pages at `/portfolio/[slug]`), 8 (loading and error states), 9 (SEO and JSON-LD), 10 (accessibility), 11 (performance budget), 12 (CSP) and 13 (cached portfolio reads tagged `portfolio`); *Security baseline* (`<JsonLd>`, `<ExternalLink>`, `https:`-only links).
- `README.md` → *Integrated Portfolio Hub* ("live demo links, tech stack badges, and architecture summaries … responsive media lightbox viewers").
- `roadmap.md` → Phases 12, 14 (OG images, sitemap, canonical URLs), 21 (contextual CTAs), 22 (the modal over the grid) and 29–31 (galleries and portfolio editing).
- Phase 8 spec (`<MediaImage>`, `<VideoEmbed>`, D11 dev pages), Phase 9 spec D1–D3 (seed content and field caps), Phase 10 spec D2–D4 and D10–D11 (cached read, states, card, fixture page, where each state is proven), Phase 11 spec D2 (partial prerendering).

## Scope

1. **Constitution first** (listed below).
2. **Detail read** (D2): `fetchPortfolioItem` in `lib/portfolio/read-core.ts` and the cached `getPortfolioItem(slug)` in `read.ts`.
3. **Route** (D1, D3, D9): `app/(public)/portfolio/[slug]/page.tsx`, `loading.tsx`, static params, metadata.
4. **Detail view** (D4–D6): `components/portfolio/portfolio-detail.tsx`, the gallery and the lightbox (client).
5. **Card link** (D7): cards on `/portfolio` and in related work link to the detail page.
6. **Credit link** (D8): a `creditUrl` column, its migration and the seed value (owner answer C).
7. **JSON-LD** (D10): a builder in `lib/seo/json-ld.ts`, rendered through `<JsonLd>`.
8. **Copy** (D11): new keys in `content/defaults.ts` (Appendix A).
9. **Fixture page and tests** (D12, D13).

## Constitution changes (in this PR, before the code)

- **`tech-stack.md`:**
  - *Architectural rules* 13: public portfolio reads are cached functions **tagged `portfolio`**: the list read and, from this phase, the per-item read (D2). Phase 31 still refreshes the one tag.
  - *Architectural rules* 1: `/portfolio/[slug]` is prerendered for each published slug; a slug published later renders on its first request and is then cached (D1).
  - *Architectural rules* 9: `CreativeWork` for every portfolio item, and the `VideoObject` note (D10, owner answer D).
  - *Schema decisions*: `PortfolioItem` gains `creditUrl String?` (D8, owner answer C).
- **`roadmap.md`** → Phase 12 row: the JSON-LD becomes `CreativeWork`, plus `VideoObject` when the item has videos (owner answer D).
- **`README.md`** §5: `creditUrl` joins the `PortfolioItem` model (D8).
- **`mission.md`:** no change.
- **Phase 10 spec D4:** a dated note that cards now link to the detail page and no longer show "Visit live site" (D7, owner answer B).

## Out of scope

- The modal over the grid (Phase 22). Phase 12 builds the full page that the modal will later show.
- "Start a project" pre-filled for the item's service (Phase 21). The page uses the shared CTA to `/contact`.
- OG images, canonical URLs and sitemap entries (Phase 14).
- More screenshots, photos or videos for the seeded items. The gallery shows whatever media an item has; adding media is a seed amendment or CMS work (Phases 29–30).
- Previous/next project links, "more work" lists, and the homepage's featured items (Phase 23).
- Any schema, migration or seed change other than `creditUrl` (D8).

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **Route and static params.** `app/(public)/portfolio/[slug]/page.tsx`.<br>• `generateStaticParams` returns every published slug from `getPublishedPortfolio()` (Phase 10 D2). When that read fails or no item is published (the CI build has no database), it returns one **placeholder**, `{ slug: "__none__" }`, which can never be a real slug (the slug pattern has no underscores) and so renders the 404. Cache Components rejects an empty list (`empty-generate-static-params`).<br>• The page awaits `params` at the top, as the service pages do, so an item published after a deploy renders on its **first request** and is then cached, with no redeploy. `dynamicParams` is not available with Cache Components.<br>• An unknown or unpublished slug calls `notFound()` and must answer **HTTP 404** (D13). If a Suspense boundary above the page (the `/portfolio` `loading.tsx`) turns that into a streamed 200, the listing's `loading.tsx` moves into a route group so the detail route is not under it (plan 2.6).<br>• **Amended 2026-10-14 (plan 2.6):** an unlisted slug answers **HTTP 200** with the site's not-found page and `<meta name="robots" content="noindex">`. Partial Prefetching serves the route's static fallback shell before `params` resolve, so the status is already sent when `notFound()` runs. A build with both `loading.tsx` files removed gave the same 200, so moving them changes nothing, and `/services/nope` has answered the same way since Phase 5 (owner decision, Phase 5 spec, D1). `noindex` keeps these URLs out of search results. A value that is not a valid slug gets the not-found page without a database read, so junk URLs add no cache entries. Phase 14 (SEO) revisits the status code for both dynamic routes. | Every item gets a static page, and new items need no deploy (ISR). A real 404 status keeps unknown URLs out of search results. Next 16 docs (ctx7, 2026-10-14): with Cache Components, `generateStaticParams` must return at least one param, and unlisted params render on request. | Every item gets a static page, and new items need no deploy (ISR). A real 404 status keeps unknown URLs out of search results. Next 16 docs (ctx7, 2026-10-14): with Cache Components, `generateStaticParams` must return at least one param, and unlisted params render on request. | Roadmap Phase 12; rules 1, 2 |
| D2 | **Detail read.**<br>• `fetchPortfolioItem(db, slug)` in `read-core.ts` returns the published item with `slug`, or `null`. Fields: everything on the card plus `description`, `client`, `credit`, `highlights`, `repoUrl`, `publishedAt` (as an ISO date string, so the result stays cacheable) and **all its media** in `sortOrder` order.<br>• Media rules: an image needs an `rhm/` public ID and alt text, as the cover does (Phase 10 D1); a video needs a provider and an ID that the Phase 8 parser accepts. Any other row is skipped with a warning, never rendered. The **hero** is the first valid image (the card's cover), and the **gallery** is every other valid row.<br>• `getPortfolioItem(slug)` in `read.ts` wraps it in `"use cache"`, `cacheTag("portfolio")`, `cacheLife("hours")` on success and `cacheLife("minutes")` on failure. It returns `{ ok: true, item }`, `{ ok: true, item: null }` (not found) or `{ ok: false }`, and never throws (Phase 8 lesson). | One query per page instead of loading every item's detail into the list read. The same tag means Phase 31's refresh covers both reads. Unsafe media never reaches `<MediaImage>` or `<VideoEmbed>`. | Rules 8, 13; Phase 10 D1, D2 |
| D3 | **States.**<br>• **Found:** the detail view (D4).<br>• **Not found** (no published item with that slug): `notFound()`, the site's 404.<br>• **Unavailable** (the read failed): the Phase 10 unavailable message with a link back to `/portfolio`, and metadata `robots: noindex`. Amended 2026-10-14: the shared CTA follows, as on `/portfolio` in the same state (*inquiry first*). The failure is cached for minutes, so the page heals by itself.<br>• **Loading:** `app/(public)/portfolio/[slug]/loading.tsx`, a skeleton of the hero and title, so a navigation from the grid does not show the grid's skeleton.<br>• **Error:** the shared `app/(public)/error.tsx`. | A database outage must not 404 a real item, or search engines may drop it. Each data route has its own loading and error states. | Rule 8; Phase 10 D3, D6 |
| D4 | **Layout** (`components/portfolio/portfolio-detail.tsx`, a server component that takes the item, so the route and the fixture page share it):<br>1. A back link, "All work", to `/portfolio`, styled like the service pages' "All services".<br>2. The category name as the eyebrow (`muted`, 16px, uppercase, as on service pages), the title as `h1`, and the summary as the lead (`muted`, 18px).<br>3. The **hero**: the cover, `<MediaImage aspect="16/10" preload>` at the container width. It is the page's LCP image. It opens the lightbox (D6).<br>4. Two columns from `lg` (one on phones):<br>&nbsp;&nbsp;– **main:** the description, then **Highlights** (`h2`) as a list with brand-red markers like `<ItemList>`;<br>&nbsp;&nbsp;– **aside:** **Tech stack** (`h2`) as the card's pills; **Links**: "Visit live site" and, when there is one, "View the code on GitHub", both `<ExternalLink>` with the `↗` marker; the **credit line** (D8); and the client, when there is one ("Client: …").<br>5. **Gallery** (`h2`, D5), only when the item has media besides the hero.<br>6. The shared `<Cta />` ("Have a project in mind?", to `/contact`). | The order follows how a prospect judges work: what it is, what it looks like, what it does, how it was built, who made it, then the next step (mission principles 1 and 3). Reusing the service page's patterns keeps the site consistent. | Mission principles 1, 3; rule 10; Phase 5 page |
| D5 | **Gallery.** The media after the hero, in `sortOrder`, in a grid of one column on phones and two from `md`.<br>• **Images:** `<MediaImage aspect="16/10">`, lazy, each inside a button that opens the lightbox at that image, with the accessible name "View larger: {alt}".<br>• **Videos:** `<VideoEmbed>` (the Phase 8 click-to-play facade), playing in place. The title is the media `title`, or the item title. Videos are **not** in the lightbox.<br>• A caption, when the row has one, sits under its tile (`muted`, 16px). | Mixed media with no iframe before a click (rule 11). Videos already have an accessible player; putting an iframe in a dialog adds focus problems for no gain. | Roadmap Phase 12; rules 10, 11; Phase 8 D9 |
| D6 | **Lightbox** (`components/portfolio/lightbox.tsx`, client), built on the native **`<dialog>`** opened with `showModal()`:<br>• It holds every valid image of the item: the hero first, then the gallery images. Each is shown **whole**, scaled to fit the viewport: `<MediaImage>` gains a `fit="contain"` option (Cloudinary `c_limit`, no crop, `object-contain` in a fixed box), used only here. The images are lazy, so nothing loads until the dialog opens.<br>• Controls: a Close button (focused on open), and when there is more than one image, Previous and Next buttons, the ← and → keys, and an "Image 2 of 5" status. Escape closes it (native). The alt text and caption show below the image. Amended 2026-10-14: the caption shows, or the alt text when there is no caption, so the line is never doubled.<br>• `showModal()` makes the rest of the page inert, and focus returns to the button that opened it. Clicking the backdrop closes it. Transitions are off under reduced motion.<br>• Without JavaScript, every image is still on the page at full width, and the buttons simply do nothing. | The native dialog gives a focus trap, Escape and an inert page with no library (C1). Screenshots and photos need to be seen whole, which the cropped tiles cannot do. | README *lightbox viewers*; rules 1, 10, 11 |
| D7 | **Card link** (owner answer B). The card's **title becomes a link** to `/portfolio/{slug}`, stretched over the whole card (an `::after` overlay), so the card is one large target. Its accessible name is the title. The existing hover and `focus-within` lift and zoom stay, and the focus ring wraps the card. Applies on `/portfolio` and in service-page related work.<br>The card **drops "Visit live site"**; the live link moves to the detail page, next to the CTA. | A visitor who clicks a card expects more about that work. Phase 10 kept the live link only "until Phase 12 adds detail pages" (Phase 10 owner answer B). Keeping visitors on the site, one step from the CTA, serves *inquiry first*. One link per card also avoids a link inside a link. | Mission principle 1; Phase 10 D4 |
| D8 | **Credit line** (owner answer C). The detail page shows the item's `credit` text in the aside.<br>A new nullable column `creditUrl String?` (`httpsUrlSchema`, rendered through `<ExternalLink>`) makes the credit a link. The seed sets `https://emo-onerhime.vercel.app` on the five engineering items. It is an additive migration, applied by CI. The card does not show the credit. | The mission says each engineering case study is "credited to Emo Onerhime as technical lead and **links to the personal portfolio**", which Phase 9 did not build. A per-item URL also fits later media credits (a photographer's site). | Mission *How the portfolio is framed*; Phase 9 D2–D3 |
| D9 | **Metadata.** `generateMetadata` reads the same cached item: title `{item title} \| RedHat Media`, description = the item's summary. The unavailable state adds `robots: { index: false }`; not found uses the 404's metadata. OG images and canonical URLs come in Phase 14. | Each item has its own title and description (roadmap "Done when"), at no extra query. | Roadmap Phases 12, 14; rule 9 |
| D10 | **JSON-LD** (owner answer D), built by `portfolioItemJsonLd()` in `lib/seo/json-ld.ts` and rendered through `<JsonLd>`.<br>**`CreativeWork` for every item**, whatever its category: `name`, `description`, `url` (the detail page), `image` (the cover's Cloudinary URL, built from its public ID), `datePublished`, `genre` (the service name), `keywords` (the tech stack), `creditText` (the credit), `creator` (RedHat Media as an `Organization`) and, for a live product, `sameAs` the live URL.<br>• The roadmap names `SoftwareApplication` for engineering items, but Google's Software App result **requires `offers.price` and a rating or review** (Google Search Central, checked 2026-10-14). We have neither, and inventing them breaks *honest claims only*, so those pages would show as invalid items in Search Console and fail Phase 14's validator check.<br>• **`VideoObject`**, one per gallery video, under `video`: `name`, `description` (caption, else the item summary), `thumbnailUrl`, `embedUrl` and `contentUrl` (the canonical video URL). Google also requires **`uploadDate`**, which `MediaItem` does not store. It is emitted only when known; Phase 30, which adds videos, decides how to record the provider's publish date. No published item has a video today. | Valid, honest structured data on every page. `CreativeWork` has no Google rich result, so it raises no errors there, and it still describes the work to search engines. | Roadmap Phase 12; rule 9; mission principle 4 |
| D11 | **Copy** goes through `block()` with new `portfolio.detail.*` keys (Appendix A). Item text (title, summary, description, highlights, tech, credit, client, alt text, captions) is database content. | Every text string is keyed (Phase 3 D8), and the keys match the CMS pattern. | Phase 3 D8; *In-place CMS* 4 |
| D12 | **Fixture page** `/dev/portfolio-detail` (404 in production, `noindex`; Phase 8 D11): the detail view with a fixture item holding a hero, two gallery images (the Phase 8 sample asset, `rhm/page/dev-media/sample`, with distinct alt text and a caption), one YouTube and one Vimeo video (the Phase 8 fixture URLs), a credit link and a client; then the unavailable state. | Real data has no gallery yet, so the gallery, lightbox navigation and videos are proven here, in CI, with no database (as Phase 10 D10 did for the states). | Phase 8 D11; Phase 10 D10 |
| D13 | **Tests.**<br>• **Unit:** `read-core.test.ts` (hero and gallery split, media skip rules, `publishedAt` as a string); `read-core.db.test.ts` (published only, unknown slug gives `null`, media order, another item's media excluded); `json-ld.test.ts` (`CreativeWork` fields, `VideoObject` per video, no `uploadDate` when unknown, no `<` in the output); the static-params helper (published slugs, placeholder on failure or none); the seed schema for `creditUrl` (if C).<br>• **E2E, ready (Vercel preview, `preview-e2e`):** each seeded slug answers 200 with its title as `h1`, its highlights, tech stack, live link (`rel="noopener noreferrer"`, new tab), credit, CTA, `<title>` and one `CreativeWork` JSON-LD block; the hero is preloaded; HireFlow alone has a GitHub link; `/portfolio/nope` answers **404**; clicking a card on `/portfolio` opens its page; the hero opens the lightbox, Escape closes it and focus returns.<br>• **E2E, fixture page (CI):** the gallery renders images and videos in order; the lightbox opens at the chosen image, Next and Previous and the arrow keys move through every image, the counter updates, focus stays inside, Escape and the backdrop close it, focus returns; no video iframe before a click.<br>• **E2E, unavailable (CI):** `/portfolio/sportspred` shows the unavailable message, a link to `/portfolio` and `noindex`.<br>• `e2e/shell.spec.ts`: `/portfolio/sportspred` and `/dev/portfolio-detail` join the route list (layout at 360/768/1440px, contrast, reduced motion). Amended 2026-10-14: the `/dev` layout has no site header or footer, so only `/portfolio/sportspred` joins; the fixture page gets its own no-sideways-scroll check at 360px. In the unavailable state that page is shorter than the viewport at 768px and 1440px, so the shell's sticky-header check now skips any page that cannot scroll. Tab inside the open lightbox may move focus to the browser's own controls (native modal behaviour), so the test checks that focus never reaches the page behind. | Proves "Done when" (each item has its own page, metadata and JSON-LD) on real data, and everything real data cannot show yet on the fixture. | Roadmap Phase 12 "Done when"; Phase 10 D10, D11 |

## Constraints

- **C1 — No new libraries.** The lightbox is the native `<dialog>`; no lightbox, carousel or focus-trap package.
- **C2 — Static.** `/portfolio/[slug]` is prerendered per published slug (the build's route table lists them). No public server component reads cookies, headers or the session. `/portfolio` stays `◐` and the service pages stay prerendered.
- **C3 — Schema.** One migration only: the additive, nullable `creditUrl` column (D8), applied by CI.
- **C4 — Existing suites hold.** `pnpm test`, `pnpm test:db` and `pnpm test:e2e` pass. Existing specs change only for the card link (D7), the new copy keys, and the new routes in `shell.spec.ts`.
- **C5 — Contrast.** Every new text pairing is in the *Design tokens* table; the lightbox's backdrop and controls use `ink`, `fg`, `line` and `brand-deep`, and the rendered-contrast check passes on the new routes.
- **C6 — CSP and links.** No CSP change: lightbox images come from Cloudinary and videos from the Phase 8 hosts, already allowed. External links stay `https:`-only through `<ExternalLink>`.
- **C7 — Performance.** Only the hero is preloaded. Gallery and lightbox images are lazy, and no iframe loads before a click (rule 11).

## Owner answers

Given 2026-10-14, approving every recommendation in the draft:

- **A. Copy:** Appendix A approved as drafted.
- **B. Card link:** the whole card links to the detail page, and cards drop "Visit live site"; the live link lives on the detail page.
- **C. Credit link:** add `creditUrl` and link the credit to `https://emo-onerhime.vercel.app` on the five engineering items.
- **D. JSON-LD type:** `CreativeWork` for every item, plus `VideoObject` for videos.

---

## Appendix A — New copy (approved)

| Key | Text |
| --- | --- |
| `portfolio.detail.back` | All work |
| `portfolio.detail.highlights` | Highlights |
| `portfolio.detail.links` | Links |
| `portfolio.detail.repo` | View the code on GitHub |
| `portfolio.detail.credit` | Credit |
| `portfolio.detail.client` | Client |
| `portfolio.detail.gallery` | Gallery |
| `portfolio.detail.loading` | Loading the project |
| `portfolio.detail.view` | View larger: {alt} |
| `portfolio.detail.lightbox.label` | Image viewer |
| `portfolio.detail.lightbox.close` | Close |
| `portfolio.detail.lightbox.previous` | Previous image |
| `portfolio.detail.lightbox.next` | Next image |
| `portfolio.detail.lightbox.position` | Image {n} of {total} |

The existing keys are reused: `portfolio.tech` ("Tech stack"), `portfolio.live` ("Visit live site"), `portfolio.unavailable`, and the shared CTA's `home.cta.*`. `{alt}`, `{n}` and `{total}` are filled in by the component.
