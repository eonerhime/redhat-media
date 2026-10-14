# Phase 10 — Portfolio grid

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 1, Phase 10
- **Branch:** `feature/phase-10-portfolio-grid` (from `develop` at `4cabbe2`)
- **Started:** 2026-10-14
- **Status:** approved by the owner, 2026-10-14

## What and why

Show the seeded work. Phase 9 put five engineering case studies in the database, but no page reads them yet, and the header's "Portfolio" link still 404s. This phase adds:

- **`/portfolio`**, a server-rendered grid of every published item: cover image, category badge, title, summary, tech-stack pills and a live-site link, with a hover lift and image zoom;
- **its three states**: loading, error ("unavailable") and empty, as the roadmap's "Done when" asks;
- **the related-work slot** on each service page, empty since Phase 5, filled with published items in that service's category;
- **one cached, tagged read** of portfolio data that every later phase reuses (Phase 11 filters, Phase 12 detail, Phase 23 homepage, Phase 31 cache refresh).

## Constitution sections this phase relies on

- `mission.md` → *How the portfolio is framed*, *Guiding principles* 1–4 (inquiry first, the site is the proof, credibility, honest claims) and 8 (restrained motion)
- `tech-stack.md`:
  - *Architectural rules* 1 (server-first, static), 2 (filters in the URL, later), 3 (muted services keep their portfolio items), 8 (loading and error states), 10 (accessibility), 11 (performance budget) and 13 (cache refresh by tag);
  - *Design tokens* and the contrast table;
  - *Security baseline* → external links (`<ExternalLink>`) and Cloudinary public IDs (`<MediaImage>`);
  - *Supporting tools* → E2E tests.
- `roadmap.md` → Phases 10, 11, 12, 22, 23 and 31.
- Phase 3 spec D1 (card surface), D5 (featured-work gate) and D8 (keyed text); Phase 5 spec D6 (related-work slot); Phase 8 spec D5 (`<MediaImage>` aspects) and the "throw inside `use cache`" lesson; Phase 9 spec D3–D5 (content rules, `<ExternalLink>`, stable IDs).

## Scope

1. **Constitution first** (listed below).
2. **Read layer** (D1, D2): `lib/portfolio/read-core.ts` (pure query and mapping, takes the client) and `lib/portfolio/read.ts` (`server-only`, `"use cache"`, tagged).
3. **`/portfolio` page** (D3–D7): `app/(public)/portfolio/page.tsx`, `loading.tsx`, and the card and grid components in `components/portfolio/`.
4. **Error boundary** (D6): `app/(public)/error.tsx`, covering every public route.
5. **Related work** (D8): `components/services/related-work.tsx` filled in.
6. **`16/10` aspect** (D4): added to `lib/media/cloudinary.ts`.
7. **Copy** (D9): new keys in `content/defaults.ts` (Appendix A).
8. **Tests** (D10, D11): unit, database and e2e, plus a Playwright run against the Vercel preview.
9. **Docs:** the constitution changes below and `CLAUDE.md`.

## Constitution changes (in this PR, before the code)

- **`tech-stack.md`:**
  - *Architectural rules* 8: one `app/(public)/error.tsx` serves every public route, and its copy is fixed text in `lib/site.ts`, not a content block, so it still renders when the content store has failed (D6).
  - *Architectural rules* 13: public portfolio reads are cached under the tag `portfolio` (`cacheLife("hours")`). Phase 31's portfolio mutations refresh that tag (D2).
  - *Supporting tools → E2E*: Playwright also runs `e2e/portfolio.spec.ts` against each Vercel preview (`preview-e2e`), with the existing bypass secret (D11).
- **Phase 8 spec D5:** the aspect list gains `16/10` (D4), noted as an amendment dated 2026-10-14.
- **Phase 5 spec D6:** marked as filled by this phase (D8).
- **`CLAUDE.md`** → *Commands*: `pnpm test:e2e` can target a deployed URL with `PW_BASE_URL` (D11).
- **`roadmap.md`:** no change. The Phase 10 row already describes this phase.

## Out of scope

- Category tabs and `?category=` (Phase 11). The grid shows every published item.
- `/portfolio/[slug]` and card links to it (Phase 12), and the modal (Phase 22).
- Database-backed featured items on the homepage (Phase 23). The homepage's featured-work section is unchanged (D12).
- JSON-LD, OG images and the sitemap entry for `/portfolio` (Phase 14).
- Any schema, migration or seed change. Media case studies (Phase 9 spec, D10).
- Editing controls (Phase 31).

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **Read core** (`lib/portfolio/read-core.ts`, no `server-only`):<br>• `fetchPublishedPortfolio(db)` runs two queries: published `PortfolioItem` rows ordered by `sortOrder`, then `title`; and their `IMAGE` `MediaItem` rows (`ownerType` `PORTFOLIO_ITEM`, `ownerId` in those IDs), ordered by `sortOrder`.<br>• `toCards(items, media)` returns plain objects: `id`, `slug`, `title`, `category`, `summary`, `techStack`, `liveUrl` and `cover` (`{ publicId, alt }` or `null`). Strings and arrays only, so the result is safe to cache.<br>• **Cover rule:** the lowest-`sortOrder` image with a `cloudinaryId` that passes `isRhmPublicId` and a non-empty `alt`. Anything else gives `cover: null` and a logged warning, because `<MediaImage>` throws on a bad ID and every image needs alt text (rule 10).<br>• `relatedTo(cards, category, limit)` filters by category and keeps the first `limit` (D8). | The core takes the client as a parameter, like `runSeed`, so the database test runs it against the CI Postgres (`rate-limit-core` / `blur-core` pattern). Mapping rules are unit-tested without a database. | Phase 9 spec D5, D7; rule 10 |
| D2 | **Cached read** (`lib/portfolio/read.ts`, `server-only`):<br>• `getPublishedPortfolio()` is a `"use cache"` function with `cacheTag("portfolio")`. It returns `{ ok: true, cards }` with `cacheLife("hours")`, or `{ ok: false }` with `cacheLife("minutes")` and a logged error.<br>• **It never throws.** The `getDb()` call and both queries sit inside a `try` within the cached function, because a throw inside `"use cache"` fails the prerender even when the caller catches it (Phase 8 lesson). `"minutes"` (expire 1 hour) is not "short-lived" (expire under 5 minutes), so a failure is still prerendered and retried soon after.<br>• Every reader (the grid, related work, later Phases 11, 12 and 23) calls this one function, so there is one cache entry and one tag to refresh. | `/portfolio` stays static, as rule 1 requires. Until Phase 31, content changes arrive by seed, so an hourly refresh is enough; Phase 31 refreshes the tag on write. Next 16 docs (ctx7, 2026-10-14): `cacheLife` short-lived threshold. | Rules 1, 8, 13; Phase 8 lesson |
| D3 | **`/portfolio` page** (`app/(public)/portfolio/page.tsx`, a server component):<br>• `h1` and intro from `block()`, then one of three states, marked with `data-state` on the section for tests:<br>&nbsp;&nbsp;– **ready**: the grid (D4);<br>&nbsp;&nbsp;– **empty** (`ok` with no cards): a short message and the `/contact` CTA;<br>&nbsp;&nbsp;– **unavailable** (`ok: false`): a message asking the visitor to try again shortly, with `role="status"`.<br>• Metadata: `Portfolio \| RedHat Media` and a description key.<br>• The shared `<Cta />` follows the grid in every state (inquiry first).<br>• The nav's "Portfolio" link now resolves, and `lib/site.ts`'s comment about 404s is updated. | Three explicit states are the roadmap's "Done when". An inline "unavailable" state (rather than throwing to `error.tsx`) keeps the build green when the database is unreachable, and tells the visitor plainly what happened. | Roadmap Phase 10; rules 1, 8 |
| D4 | **Grid and card** (`components/portfolio/portfolio-grid.tsx`, which also holds the state-aware `PortfolioListing` that `/portfolio` and the D10 fixture page share, and `portfolio-card.tsx`):<br>• Grid: one column on phones, two from `md`, three from `lg`, as on `/services` (Phase 4 D1).<br>• Card: an `<article>` on the Phase 3 surface (`ink`, `line` border, `brand` top edge). In order: cover, category badge, title (`h2`), summary (`muted`, 16px), tech pills, live-site link.<br>• **Cover:** `<MediaImage aspect="16/10">` with `sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"`. Only the **first** card's cover is `preload` (it may be the LCP on phones; rule 11); the rest are lazy. A card with `cover: null` shows a plain `line`-bordered panel of the same aspect, with no text. The covers are 1200×750, so a new `16/10` aspect shows them whole instead of cropping.<br>• **Badge:** the service name for the item's category (`block(service.nameKey)`, through a new `serviceByCategory()` helper that ignores muting, because muted services keep their items; rule 3). `fg` text at 14px bold, uppercase, with a `brand-deep` border (3.18:1 against `ink`, a UI edge).<br>• **Tech pills:** every entry (the schema caps it at 10), `fg` on `ink` with a `line` border, 14px. They are a `<ul>` labelled by a visually hidden "Tech stack".<br>• **Live link:** `<ExternalLink href={liveUrl}>` with the label "Visit live site" (owner question B). There is no whole-card link until Phase 12 adds detail pages.<br>• **Motion:** on `hover` and `focus-within`, the card lifts 4px and the cover zooms to 1.04 inside an `overflow-hidden` frame, over 200ms. Both use `motion-safe:` variants, and the global reduced-motion rule also stops them. | The same card surface keeps the site consistent. `focus-within` gives keyboard users the same cue as a mouse. A whole-card link to an external site would surprise visitors once Phase 12 adds internal detail pages. | Roadmap Phase 10; Phase 3 D1; Phase 4 D1; rules 3, 10, 11; design tokens |
| D5 | **Loading state** (`app/(public)/portfolio/loading.tsx`): three card-shaped placeholders (`line` borders, no text) and a visually hidden "Loading the portfolio" in a `role="status"` region. No shimmer animation. | Rule 8 asks for `loading.tsx` on every data-fetching route. The page is prerendered, so it shows only while a fresh render streams, but it must exist and be accessible. | Rule 8 |
| D6 | **Error boundary** (`app/(public)/error.tsx`, a client component): a heading, one line of text and a "Try again" button that calls `retry()` (Next 16.4: it re-fetches the server render, then resets the boundary; `reset()` alone would re-render the same failed payload). It sits at the route-group level, so it covers `/portfolio`, the service pages (which now read data) and every later public route. **Its copy is fixed text in `lib/site.ts` (`errorCopy`)**, not `block()` keys: client components cannot call `block()`, and from Phase 27 `block()` reads the database, which may be what failed. | One boundary for all public routes satisfies rule 8 without copying files per route. | Rule 8; Phase 2 D9 (`lib/site.ts` holds data) |
| D7 | **Ordering and visibility.** The grid shows every row with `published = true`, in `sortOrder` then `title` order: SportsPred, HireFlow, AfroJamz, toutMessages, Abara. `featured` is not used here (Phase 23 reads it). Items in a muted service's category stay listed (rule 3). | The seed already sets the order to match `emo-onerhime.vercel.app` (Phase 9 D1). | Phase 9 D1; rule 3 |
| D8 | **Related work** (`components/services/related-work.tsx`):<br>• Shows up to **three** published items in the service's category, **featured first**, then by `sortOrder` (owner question C). For Web & App Development that is SportsPred, AfroJamz and toutMessages.<br>• Uses the same card as the grid, under an `h2` "Related work" and a "See all work" link to `/portfolio`. Amended 2026-10-14: Phase 11 points the link at the service's filtered URL, e.g. `/portfolio?category=web-apps` (Phase 11 spec, D7).<br>• When the category has no published items, **or the read failed**, it renders nothing, so the other five service pages are unchanged. No covers are preloaded here. | Phase 5 D6 left this slot empty for this phase. Rendering nothing for an empty category avoids placeholder copy on five pages (Phase 3 D5). A failed read hides one optional section rather than breaking a service page. | Roadmap Phases 5, 10, 11; Phase 5 D6 |
| D9 | **Copy** goes through `block()` with new keys under `portfolio.*` and `services.detail.work.*` (Appendix A). The card's own text (title, summary, tech) is database content, not copy. No claims beyond what Phase 9 approved. | Every text string is keyed (Phase 3 D8). The keys match the CMS pattern `^(home\|about\|services\|portfolio\|contact\|footer)\.`. | Phase 3 D8; *In-place CMS* 4 |
| D10 | **Tests.**<br>• **Unit (Vitest):** `read-core.test.ts`: `toCards` ordering, the cover rule (lowest `sortOrder`, rejects a full URL, a non-`rhm/` ID and a missing `alt`), and `relatedTo` (category filter, featured first, limit 3). `cloudinary.test.ts`: the `16/10` aspect. `services.test.ts`: `serviceByCategory` returns muted services too.<br>• **Database (`read-core.db.test.ts`, run by `pnpm test:db`):** after `runSeed`, `fetchPublishedPortfolio` returns the five items in order, each with its cover; a draft item and a non-image media row are left out.<br>• **E2E (`e2e/portfolio.spec.ts`):** it reads `data-state` and checks that state's content: **ready**: one card per seeded item from `prisma/seed-data/portfolio.ts`, in order, each with a loaded cover, badge, pills and an `https:` live link with `rel="noopener noreferrer"`; **unavailable**: the message and the CTA. When `E2E_PORTFOLIO_STATE` is set, the state must equal it. Also: the page's title and keyed text (seed values allowed), the Web & App service page showing three related cards, another service page showing none, and the hover lift being absent under reduced motion.<br>• `e2e/shell.spec.ts` adds `/portfolio` to its routes (layout at 360/768/1440, contrast, header).<br>• **Empty state:** `/dev/portfolio-states` renders the grid section with an empty list and the unavailable notice side by side (developer-only route, 404 in production as Phase 8 D11 requires), and the e2e spec checks both there. | Covers the "Done when": all seeded items listed, plus loading, error and empty states. Pinning the state per environment makes CI and the preview deterministic without faking data in production code. | Roadmap Phase 10 "Done when"; Phase 3 D8; Phase 8 D11 |
| D11 | **Where each state is proven.**<br>• **CI `ci` job:** it builds without a database (as today), so `/portfolio` prerenders **unavailable**. `ci.yml` sets `E2E_PORTFOLIO_STATE=unavailable`.<br>• **Vercel preview (new `preview-e2e` job)** in `preview-headers.yml`, on the same successful-deployment event: install, Playwright Chromium, then `pnpm test:e2e e2e/portfolio.spec.ts` with `PW_BASE_URL` = the preview URL and `E2E_PORTFOLIO_STATE=ready`. `playwright.config.ts`: with `PW_BASE_URL` set, it skips the local `webServer` and sends `x-vercel-protection-bypass` from `VERCEL_AUTOMATION_BYPASS_SECRET` (the secret `preview-headers` already uses). No trace or report artifact is uploaded, so the header never leaves the runner.<br>• **Locally:** `pnpm build` reads the `dev` branch through `.env.local`, so the run shows **ready**. | The runtime client speaks Neon's WebSocket protocol, which the CI Postgres container does not, and `DATABASE_URL` must use TLS. Testing **ready** on the real preview, against the CI-seeded `preview` branch and real Cloudinary, proves the whole path a visitor takes, with no new secret. | Phase 7 D6, D7; Phase 9 D8; *Supporting tools* |
| D12 | **Homepage featured-work gate (Phase 3 D5):** unchanged in this phase. Its "See the portfolio" link now reaches a populated `/portfolio` on previews, which is one of the gate's three options. Production is checked at Phase 16, as Phase 3 D5 already records. | Database-backed featured items are Phase 23. | Phase 3 D5 |

## Constraints

- **C1 — No new libraries.** Everything uses what is already installed.
- **C2 — Static stays static.** `/portfolio` and the six service pages are prerendered (`○` or `◐` in the build route table). No public server component reads cookies, headers or the session.
- **C3 — No schema change.** No migration and no seed change.
- **C4 — Existing suites hold.** `pnpm test`, `pnpm test:db` and `pnpm test:e2e` pass, with existing specs changed only to add `/portfolio` to the shell routes, to add the new keys to the content port test (`block.test.ts`), and to let `service-pages.spec.ts` accept the related-work heading and seeded card text where related work appears (amended 2026-10-14; which pages show it is checked in `portfolio.spec.ts`).
- **C5 — Contrast.** Every new text pairing is in the *Design tokens* contrast table, and the rendered-contrast e2e check passes on `/portfolio`.
- **C6 — Secrets.** The bypass secret is read only from the environment in CI and never printed or written to an artifact.

## Owner answers

Given 2026-10-14, answering the questions asked with the draft:

- **A. Copy:** Appendix A approved as drafted.
- **B. Card link:** "Visit live site" (opens the product in a new tab) on each card until Phase 12 adds detail pages.
- **C. Related work:** up to three items, featured first.
- **D. Preview e2e:** add the `preview-e2e` job (D11).

---

## Appendix A — New copy (for approval)

| Key | Text |
| --- | --- |
| `portfolio.meta.description` | Websites and web apps designed, built and shipped by RedHat Media. |
| `portfolio.heading` | Our work |
| `portfolio.intro` | Products we have designed, built and shipped, with the tools behind each one. |
| `portfolio.tech` | Tech stack |
| `portfolio.live` | Visit live site |
| `portfolio.loading` | Loading the portfolio |
| `portfolio.empty` | No projects are published yet. Tell us about yours. |
| `portfolio.unavailable` | The portfolio could not be loaded just now. Please try again in a few minutes. |
| `services.detail.work.heading` | Related work |
| `services.detail.work.link` | See all work |

Fixed error-boundary text (`lib/site.ts` → `errorCopy`, D6):

| Field | Text |
| --- | --- |
| heading | Something went wrong |
| body | This page could not be shown. Please try again. |
| retry | Try again |

The description and intro speak only of websites and web apps, because those are the only published items. When media case studies are seeded (Phase 9 D10), these two lines are widened in the same PR.
