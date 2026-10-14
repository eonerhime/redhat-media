# Phase 11 — Portfolio filtering

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 1, Phase 11
- **Branch:** `feature/phase-11-portfolio-filtering` (from `develop` at `ed629a3`)
- **Started:** 2026-10-14
- **Status:** approved by the owner, 2026-10-14

## What and why

`/portfolio` lists every published item in one grid (Phase 10). This phase adds **category filters** whose state lives in the URL (`/portfolio?category=web-apps`), so a filtered view can be shared, bookmarked, reloaded and indexed. A tab with no published items is never shown.

Today only Web & Apps has published items. The owner chose on 2026-10-14 to ship this phase **before** the photo-seed amendment (roadmap open question 4), so the bar shows **All** and **Web & Apps** for now. The Photography, Videography and Marketing tabs appear by themselves once items in those categories are published, with no code change.

## Constitution sections this phase relies on

- `mission.md` → *How the portfolio is framed* ("engineering and media work sit in one portfolio, separated only by category filters") and *Guiding principles* 2 (the site is the proof) and 4 (honest claims).
- `tech-stack.md` → *Architectural rules* 1 (server-first, static), 2 (filter state in the URL), 3 (muted services keep their portfolio items), 8 (loading and error states), 10 (accessibility), 11 (performance budget) and 13 (one cached portfolio read).
- `README.md` → *Portfolio*: the tab list `All`, `Web & Apps`, `Photography`, `Videography`, `Marketing`.
- `roadmap.md` → Phases 11, 12, 14 and 22, and open question 4.
- Phase 10 spec D2 (the cached read), D3 (the three states), D4 (grid and card), D8 (related work and its "See all work" link) and D11 (where each state is proven).

## Scope

1. **Constitution first** (listed below).
2. **Filter model** (D1, D3): `lib/portfolio/filters.ts`, pure and unit-tested.
3. **`/portfolio` page** (D2, D4–D6): the listing reads `?category=` inside a `<Suspense>` boundary, with a filter bar above the grid.
4. **Related work** (D7): "See all work" points at the service's filtered URL.
5. **Copy** (D8): new keys in `content/defaults.ts` (Appendix A).
6. **Tests** (D9): unit and e2e, both in CI and against the Vercel preview.

## Constitution changes (in this PR, before the code)

- **`tech-stack.md`:**
  - *Architectural rules* 2: list the filter slugs (`web-apps`, `photography`, `videography`, `marketing`, with no parameter meaning All) and the Marketing grouping (D1). Filters are plain links, and an unknown or empty category shows All (D3).
  - *Architectural rules* 1: `/portfolio` is **partially prerendered**. Its shell (heading, intro, CTA) is static, and the filtered listing renders per request from the cached read (D2).
- **`roadmap.md`** → open question 4: record the owner's answer of 2026-10-14. Phase 11 ships first with only Web & Apps populated. Photos chosen and cleared later are seeded in their own amendment PR, and their tab then appears with no code change.
- **Phase 10 spec D8:** a dated note that "See all work" now links to the filtered URL (D7).
- **`roadmap.md` Phase 11 row** and **`README.md`:** no change.

## Out of scope

- Seeding photography, videography or marketing items (the owner's later amendment PR; Phase 9 spec, D10).
- Per-filter titles, descriptions and canonical URLs, plus the sitemap entries (Phase 14). `/portfolio` keeps one title and description for every filter.
- `/portfolio/[slug]`, card links to it (Phase 12), and the modal over the grid (Phase 22).
- Item counts on tabs, search, sorting and multi-select filters.
- Any schema, migration or seed change.

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **Filters and their categories** (`lib/portfolio/filters.ts`), in this order:<br>• **All**: no parameter (`/portfolio`), every category.<br>• **Web & Apps** (`web-apps`): `WEB_APP`.<br>• **Photography** (`photography`): `PHOTOGRAPHY`.<br>• **Videography** (`videography`): `VIDEOGRAPHY`.<br>• **Marketing** (`marketing`): `DIGITAL_MARKETING`, `SOCIAL_MEDIA` and `ONLINE_PRESENCE`, the three Growth-pillar services (owner question C).<br>Each of the six categories belongs to exactly one filter, and a unit test enforces this. The module exports `portfolioFilters`, `parseFilter(value)`, `visibleFilters(cards)`, `applyFilter(cards, filter)`, `filterHref(filter)` and `filterForCategory(category)`. | The README's five tabs cover six categories. Marketing is the only tab that covers more than one, and it matches the Growth pillar (rule 3). One typed table keeps the tabs, URL slugs and related-work links in step. | README *Portfolio*; rules 2, 3 |
| D2 | **Rendering.** `page.tsx` passes the `searchParams` promise into a `PortfolioResults` server component inside `<Suspense>`. That component awaits it, calls `getPublishedPortfolio()` (Phase 10 D2, unchanged), and renders the filter bar and the listing.<br>• The heading, intro and CTA stay in the **static shell**. The route moves from `○` to `◐` (partial prerender), which C2 of Phase 10 already allows.<br>• The `<Suspense>` fallback is the Phase 10 loading placeholder, plus a strip as tall as the filter bar so nothing shifts when the results arrive (rule 11, CLS).<br>• `generateMetadata` does not read `searchParams`, so the metadata stays static. | The server returns the filtered HTML for every URL. A shared or reloaded link shows the right items at first paint, and the filtered items are in the HTML response, so it can be indexed (rule 2). Amended 2026-10-14: the streamed listing is revealed by React's inline script, so with JavaScript off it stays hidden, as on any partially prerendered route (the e2e test reads the server HTML, hidden nodes included). The alternative, a static page filtered on the client, would show All first and then switch on deep links. Next 16 docs (ctx7, 2026-10-14): pass `searchParams` to a component inside `<Suspense>` to keep the shell static. The data read is the same cached function, so a request-time render costs no extra database query while the cache is warm. | Rules 1, 2, 11; Phase 10 D2 |
| D3 | **Parsing and visibility.**<br>• `parseFilter` accepts only a single exact slug from D1. A missing, unknown, repeated (`?category=a&category=b`) or wrongly cased value gives **All**.<br>• `visibleFilters(cards)` returns All plus each filter that has at least one published card, in D1 order. A muted service's items still count (rule 3).<br>• A valid slug whose filter has **no** published items (for example a shared `?category=photography` link before photos are seeded) shows **All**, with All marked current. The URL is not rewritten. Empty categories never show (roadmap "Done when").<br>• The filter bar appears only in the **ready** state. The empty and unavailable states (Phase 10 D3) show no bar, whatever the URL. | Bad or stale links still show work instead of an error or an empty page. There is no redirect, because the shell has already streamed by the time the parameter is read, and showing All is enough for an old link. | Roadmap Phase 11 "Done when"; rules 2, 3 |
| D4 | **Filter bar** (`components/portfolio/portfolio-filters.tsx`):<br>• A `<nav>` labelled "Filter by category" (`aria-label`), holding a `<ul>` of Next `<Link>`s. These are **links, not ARIA tabs**, because each one loads a new URL. The current filter has `aria-current="page"`.<br>• **Shown when at least one filter besides All is visible**, so for now that is All and Web & Apps (owner question B).<br>• Style: pill links, 16px semibold. Inactive pills are `fg` on `ink` with a `line` border; the current one is `fg` on `brand-deep` (5.03:1). Both use the existing focus ring. On phones the row scrolls sideways inside its own container, never the page.<br>• The links use `scroll={false}`, so the page keeps its scroll position. **After a filter is chosen, keyboard focus is on that filter's link.** Amended 2026-10-14: the e2e test shows that the soft navigation keeps both focus and scroll, so no client component was needed and the bar stays a server component. | Links open in new tabs and can be bookmarked, and assistive tech already announces them correctly. The ARIA tabs pattern implies in-page panels and arrow-key moves, which do not fit here. Keeping focus and scroll in place stops a keyboard user from being thrown back to the top. | Rules 1, 2, 10; design tokens |
| D5 | **Filtered grid.** `applyFilter` keeps the Phase 10 order (`sortOrder`, then `title`) and the same card. The first card of the **filtered** list is the preloaded cover (Phase 10 D4). The `data-state` and `data-testid` hooks stay, and the listing also gets `data-filter="<slug or all>"` for tests. | One card, one order, and the LCP image is still the first one visible. | Phase 10 D4, D7; rule 11 |
| D6 | **Loading and errors** stay as in Phase 10. `loading.tsx` still covers a full navigation, the `<Suspense>` fallback (D2) covers the listing, and `app/(public)/error.tsx` still covers a thrown render. `getPublishedPortfolio()` still never throws. | No new failure paths: the filter is pure and works on data that has already been fetched. | Rule 8; Phase 10 D2, D5, D6 |
| D7 | **Related work** (`components/services/related-work.tsx`): "See all work" links to `filterHref(filterForCategory(category))`. For example, Web & App Development links to `/portfolio?category=web-apps`. The section only renders when that category has items, so the link never lands on a hidden filter. | The roadmap asked Phase 11 to point this link at the filtered view (Phase 10 D8). | Phase 10 D8 |
| D8 | **Copy** goes through `block()` with new `portfolio.filter.*` keys (Appendix A). The bar's labels are content keys, so the Phase 31 CMS can edit them. | Every text string is keyed (Phase 3 D8). | Phase 3 D8; *In-place CMS* 4 |
| D9 | **Tests.**<br>• **Unit (`lib/portfolio/filters.test.ts`):** each category maps to exactly one filter; `parseFilter` handles missing, unknown, repeated and wrongly cased values; `visibleFilters` hides empty filters and keeps a muted service's items; `applyFilter` keeps order; `filterHref` and `filterForCategory` round-trip.<br>• **E2E (`e2e/portfolio.spec.ts`), ready state (Vercel preview):**<br>&nbsp;&nbsp;– the bar shows exactly the visible filters (today All and Web & Apps; no Photography, Videography or Marketing);<br>&nbsp;&nbsp;– choosing Web & Apps sets `?category=web-apps`, marks it current, lists the seeded items and leaves focus on that link;<br>&nbsp;&nbsp;– **reloading** keeps the filter, and the **server HTML** of the filtered URL (read with JavaScript off) already holds the filtered items and the current filter;<br>&nbsp;&nbsp;– `?category=photography`, `?category=nope` and `?category=Web-Apps` all show All as current with every item;<br>&nbsp;&nbsp;– the bar does not scroll the page sideways at 360px.<br>• **E2E, unavailable state (CI):** `/portfolio?category=web-apps` shows the unavailable message and no bar.<br>• **Related work:** the Web & App Development page's "See all work" link has `href="/portfolio?category=web-apps"`.<br>• `e2e/shell.spec.ts`: `/portfolio?category=web-apps` joins the route list (layout, contrast). | Proves each part of "Done when": the URL is shareable, a reload keeps the filter, and empty categories never show. Real data on the preview proves which filters are hidden; the unit tests prove the rule for every category, including those with no data yet. | Roadmap Phase 11 "Done when"; Phase 10 D10, D11 |

## Constraints

- **C1 — No new libraries.** No URL-state library; `searchParams` and `<Link>` are enough.
- **C2 — Static where it can be.** `/portfolio` builds as `◐` (static shell, streamed listing) and the six service pages stay prerendered. No public server component reads cookies, headers or the session.
- **C3 — No schema change.** No migration and no seed change.
- **C4 — Existing suites hold.** `pnpm test`, `pnpm test:db` and `pnpm test:e2e` pass. Existing specs change only to add the new keys to the content port test and the keyed-text allowances, to update the related-work link's `href`, and to add the filtered route to `shell.spec.ts`.
- **C5 — Contrast.** Every new text pairing is in the *Design tokens* contrast table, and the rendered-contrast e2e check passes on the filtered route.
- **C6 — Secrets.** No change to how the preview bypass secret is used.

## Owner answers

Given 2026-10-14, answering the questions asked with the draft:

- **A. Copy:** Appendix A approved as drafted.
- **B. Bar with one category:** show the bar with All and Web & Apps while only Web & Apps has items.
- **C. Marketing tab:** it groups Digital Marketing, Social Media Marketing and Online Presence Management.
- **D. Stale or unknown filter links:** show All, with All marked current.

---

## Appendix A — New copy (for approval)

| Key | Text |
| --- | --- |
| `portfolio.filter.label` | Filter by category |
| `portfolio.filter.all` | All |
| `portfolio.filter.webApps` | Web & Apps |
| `portfolio.filter.photography` | Photography |
| `portfolio.filter.videography` | Videography |
| `portfolio.filter.marketing` | Marketing |

The page's description and intro stay as Phase 10 approved them ("websites and web apps"). They are widened in the photo-seed amendment PR, as Phase 10's Appendix A already notes.
