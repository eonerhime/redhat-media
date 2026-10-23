# Phase 22 — Portfolio modal

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 2, Phase 22
- **Branch:** `feature/phase-22-portfolio-modal` (from `develop` at `066a2ca`)
- **Started:** 2026-10-23
- **Status:** owner answers A–G given 2026-10-23; approved 2026-10-23 (Appendix A included); answer H given during the build; built and merged into `develop` via PR #53

## What and why

Today a card on `/portfolio` is a full navigation to `/portfolio/[slug]`. The visitor leaves the grid, and on the way back loses their place in it. This phase opens the item **as a modal over the grid** instead, through an intercepting route. The URL still changes to `/portfolio/[slug]`, so the link can be shared. Back closes the modal and Forward reopens it. A direct load or a reload of that URL shows the full Phase 12 page, unchanged.

The modal shows the same detail body as the full page, including the "Start a project" CTA that Phase 21 pre-fills. A visitor can therefore browse several case studies without losing the grid or its filter, and stays one click from an inquiry (*Guiding principles* 1).

## Constitution sections this phase relies on

- `mission.md` → *Guiding principles* 1 (inquiry first) and 2 (the site is the proof).
- `tech-stack.md` → *Architectural rules*:
  - 1: server-first, with client components only where interaction needs them;
  - 2: "the in-grid modal (Phase 22) is an intercepting route over the same URL, so deep links always work";
  - 8: loading and error states for every data-fetching route;
  - 10: accessibility;
  - 11: performance budget.
- `roadmap.md` → Phase 22, Phase 23 (homepage featured items, which keep linking to the full page).
- Phase 10 spec D4 (card), Phase 11 spec D2 (`/portfolio` partially prerendered), Phase 12 spec D1–D7 (route, read, states, layout, lightbox, card link), Phase 21 spec D3 (the CTA pre-fill on portfolio pages).
- Next 16.4.2 docs bundled in `node_modules/next/dist/docs` (*Intercepting Routes*, *Parallel Routes* → *Modals*), read 2026-10-23.

## Scope

1. **Constitution first** (listed below).
2. **Routes** (D1, D2, D8): a `portfolio` layout with a `@modal` slot, its null pages, and the intercepting `(.)[slug]` route.
3. **Shared item read** (D9): the slug check and the cached read move out of `[slug]/page.tsx`, so both routes use the same code.
4. **Modal shell** (D4–D7): a client `<dialog>` wrapper.
5. **Detail in the modal** (D3): `PortfolioDetail` gets a modal variant.
6. **Copy** (D10): one new key.
7. **Tests** (D11).

## Constitution changes (in this PR, before the code)

- **`tech-stack.md`** → *Architectural rules*:
  - 1: the portfolio modal joins the list of client parts. It opens only from `/portfolio` (owner answer A).
  - 2: add a pointer to this spec after "an intercepting route over the same URL".
  - 8: the intercepted route has its own loading and error states inside the dialog (D8).
- **Phase 12 spec D7:** a dated note. On `/portfolio` the card link now opens the modal. In related work and on a direct load it still opens the full page.
- **`roadmap.md`:** no change; the Phase 22 row stands as written. The owner's uncommitted `roadmap.md` edit (a `---` before Milestone 2) is not part of this phase.
- **`mission.md`:** no change.

## Out of scope

- A modal anywhere other than the `/portfolio` grid: service-page related work and the homepage featured items (Phase 23) keep full-page links (owner answer A).
- An "Open as full page" link in the modal (owner answer D). A reload already does this.
- Previous/next item navigation inside the modal.
- Any change to the full page `/portfolio/[slug]`, its metadata, JSON-LD or OG image.
- Schema, migration, seed, CSP, env or dependency changes.
- A `/dev` fixture grid for the modal (owner answer E).

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **Route structure** (all under `app/(public)/portfolio/`):<br>• `layout.tsx` renders `{children}` then `{modal}`.<br>• `@modal/default.tsx` returns `null`, so a direct load or reload of any portfolio URL renders no modal.<br>• `@modal/page.tsx` returns `null`. A soft navigation keeps a slot's last state when the new URL has no match in it, so `/portfolio` needs this explicit empty match.<br>• `@modal/(.)[slug]/page.tsx` intercepts `/portfolio/[slug]` (`(.)` because `@modal` is a slot, not a segment). It uses the same `generateStaticParams` as the full page.<br>Leaving `/portfolio` (the CTA, the header nav) unmounts the whole portfolio layout, modal included, so no catch-all null route is needed (D2). | The docs' modal pattern. Without the explicit null match, the modal would stay open when navigating back to the grid by a link. | Next docs, *Parallel Routes* → *Modals*; rule 2 |
| D2 | **Only the grid intercepts** (owner answer A). The slot lives in the portfolio layout, not the `(public)` layout. A card in a service page's related work, a link from elsewhere, or a typed URL loads the full page.<br>**Render modes stay as they are:** `/portfolio` stays `◐` and `/portfolio/[slug]` stays prerendered for each published slug. Every slot at one level shares a render mode, so if the slot changes either mode in the build output, building stops and the owner is asked. | All slots in a layout render as static or dynamic together, so a slot in the `(public)` layout could change every public page's mode. A modal over a service page is also an odd context. | Next docs, *Parallel Routes* → *Slots*; rule 1; Phase 11 D2; Phase 12 D1 |
| D3 | **Content: the full detail body** (owner answer B). The intercepted page renders `PortfolioDetail` with a `modal` variant. It drops the "All work" back link, whose job the Close button does (D4), and gives the title an `id` so the dialog can be labelled by it. Everything else is the same: hero (which opens the lightbox above the modal), story, highlights, aside, gallery and the pre-filled CTA. There is **no JSON-LD** in the modal; the full page at the same URL keeps it. | One component for both views, so they cannot drift. Structured data belongs to the crawlable page, and crawlers never see the modal. | Phase 12 D4–D6; Phase 21 D3 |
| D4 | **Modal shell** (`components/portfolio/portfolio-modal.tsx`, client), a native `<dialog>` opened with `showModal()` on mount:<br>• **Closing:** the Close button, Escape (the dialog's `cancel` event) and a backdrop click (D5) all call `router.back()`, so closing is the same as the browser's Back. The dialog is never closed in place, so the URL and the screen never disagree.<br>• **Label:** `aria-labelledby` the item title (D3). While the item is still loading, it is labelled by the loading text (D8).<br>• **Focus:** when the dialog opens, focus moves to Close. When the modal unmounts after Back, focus returns to the card link that opened it. The grid never unmounted, so that link is still the same element. Unmounting does not trigger the browser's own focus return (only `close()` does), so the shell does this itself.<br>• **Scroll:** the dialog scrolls inside itself. The page behind is locked while it is open, and the grid's scroll position is unchanged after closing.<br>• **Nested lightbox:** the lightbox opens above the modal (both are in the top layer). Escape closes only the topmost dialog, so Escape in the lightbox leaves the modal open. | The native dialog gives the focus trap, an inert page and Escape with no library, as the lightbox does (Phase 12 C1). Mapping every close to Back keeps the docs' back/forward behaviour true for every way out. | Roadmap "Done when"; rule 10; Phase 12 D6 |
| D5 | **Layout** (owner answer C):<br>• **Under 768px:** full screen (`100dvh`, no radius or margin).<br>• **From 768px:** a centred panel, `max-w-6xl` and `calc(100dvh - 2rem)` tall, with the lightbox's border, radius and `ink/90` backdrop, so the grid shows dimmed behind it. A backdrop click closes it (owner answer D).<br>• The Close button sits in a header bar that stays pinned at the top while the content scrolls. | On a phone the content needs the whole width; on larger screens the visible grid tells the visitor where Back goes. | Owner answers C, D |
| D6 | **Motion** (owner answer F). On open, a 200ms fade with a small upward move of the panel (`@starting-style`, Tailwind's `starting:` variant), matching the cards' 200ms lift. It applies only under `motion-safe`, and with reduced motion the modal appears at once. There is no closing animation, because the modal unmounts on Back. | Ties the modal to the card it came from without delaying it. | Rule 10; Phase 10 D4 |
| D7 | **Tab title** (owner answer D). The intercepted route exports the same `generateMetadata` as the full page, so while the modal is open the tab reads "{item} \| RedHat Media". After closing it is back to the portfolio title. | The title matches the URL, which is the item's. | Owner answer D; Phase 12 D9 |
| D8 | **States inside the modal:**<br>• **Loading:** `@modal/(.)[slug]/loading.tsx`. The dialog opens at once with the Phase 12 detail skeleton (the same markup as `[slug]/loading.tsx`) and is labelled "Loading the project" (`portfolio.detail.loading`). The shell sits in the intercepted route's `layout.tsx`, so it wraps the loading state and the page.<br>• **Unavailable** (the read failed): `PortfolioDetailUnavailable` inside the dialog. Its "All work" link is replaced by Close, as in D3.<br>• **Error:** `@modal/(.)[slug]/error.tsx` inside the dialog, using the shared error copy from `lib/site.ts` with a retry. The grid behind stays usable after Close.<br>• **Not found** (an item unpublished between the grid render and the click): the intercepted page calls `notFound()` like the full page. Where Next renders it from inside a slot is checked during the build and logged in `implementation.md`. If it replaces the grid, the owner is asked.<br>• **Amended 2026-10-23 (owner):** with no boundary of its own, the slot's `notFound()` replaced the whole page with the site's 404 view. `@modal/(.)[slug]/not-found.tsx` now shows the same `<NotFoundView>` inside the dialog, so Close and Back return to the grid. | Rule 8: each data route has loading and error states. Without its own boundaries, an error in the slot would bubble up to `(public)/error.tsx` and replace the grid. | Rule 8; Phase 12 D3 |
| D9 | **Shared item read.** `readItem` (slug pattern and length check, then the cached `getPortfolioItem`) and the metadata builder move from `[slug]/page.tsx` to one module. The full page and the intercepted page both import them. Neither adds a database query; both use the same cached, tagged read. | Both routes then validate a slug the same way, and Phase 31's refresh of the `portfolio` tag covers both. | Phase 12 D1, D2, D9; rule 13 |
| D10 | **Copy:** one new key, `portfolio.modal.close` = "Close" (Appendix A). The dialog's name comes from the item title, which is database content. | Every text string is keyed. A separate key from the lightbox's Close lets the CMS change one without the other. | Phase 3 D8 |
| D11 | **Tests** (owner answer E). A new `e2e/portfolio-modal.spec.ts` runs in **preview-e2e**, against the seeded preview (`E2E_PORTFOLIO_STATE=ready`), and is added to that job's spec list. It skips in the CI `unavailable` state, as the ready-state portfolio tests do. Before the PR, the same spec runs locally against Neon `dev`. The cases are listed in `validation.md`. Existing specs that click a `/portfolio` card and expect the full page (`portfolio-detail.spec.ts`, `smoke.spec.ts`) are updated to expect the modal there, and to take the full page from a direct load. | Real cards exist only where a database does. Phases 10 and 12 prove ready-state behaviour the same way. | Owner answer E; Phase 10 D10, D11; Phase 12 D13 |
| D12 | **Manual checks** (owner answer G). The owner checks the preview on phone and desktop. An NVDA spot check on Windows against the preview confirms that the dialog announces the item title, that Tab stays inside, and that focus returns to the card on close. There is no phone screen-reader check this phase. | The behaviour that matters most here (announcements, focus) is the part automated tests check least well. | Owner answer G; rule 10 |

## Constraints

- **C1 — No new libraries.** The modal is the native `<dialog>`, with no modal, focus-trap or animation package.
- **C2 — Render modes.** In the `pnpm build` route table, `/portfolio` stays `◐`, `/portfolio/[slug]` lists every published slug, and every other route keeps its current mode (D2).
- **C3 — No schema, migration, seed, CSP, env or dependency change.** The only workflow change adds the new spec file to the preview-e2e spec list.
- **C4 — Existing suites hold.** `pnpm test`, `pnpm test:db` and `pnpm test:e2e` pass. Existing specs change only for the card click on `/portfolio` (D11) and the new copy key.
- **C5 — Contrast.** The modal uses the lightbox's pairings (`ink`, `fg`, `line`, `brand-deep`), all in the *Design tokens* table, and the rendered-contrast check passes on the open modal.
- **C6 — No-JS and crawlers.** Cards stay plain links. Without JavaScript, or for a crawler, a card leads to the full page, which keeps its metadata, JSON-LD and canonical URL.

## Owner answers

Given 2026-10-23:

- **A. Where:** the portfolio grid only. The slot lives in a new `portfolio/layout.tsx`, and related-work cards keep going to the full page.
- **B. Content:** the full detail view. "All work" becomes Close.
- **C. Layout:** full screen on phones; a centred panel from 768px.
- **D. Behaviour:** the tab title shows the item, and a backdrop click closes the modal. No "Open as full page" link.
- **E. Test data:** the Vercel preview only (preview-e2e), plus a local run against Neon `dev`. No `/dev` fixture grid.
- **F. Motion:** a short fade and rise, off under reduced motion.
- **G. Manual checks:** an owner preview check, and an NVDA spot check by Claude. No phone screen-reader check.
- **H. Not found in the modal** (asked during the build, 2026-10-23): show the 404 view inside the dialog instead of letting it replace the grid (D8 as amended).

---

## Appendix A — New copy (approved)

| Key | Text |
| --- | --- |
| `portfolio.modal.close` | Close |

These existing keys are reused: `portfolio.detail.loading` ("Loading the project") and every `portfolio.detail.*` key the detail body already reads.
