# Implementation log — Phase 22 Portfolio modal

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

## Progress

- **2026-10-23** — Branch `feature/phase-22-portfolio-modal` created from `develop` at `066a2ca`. Owner answers A–G given; spec, plan and validation drafted for approval.
- **2026-10-23** — Owner approval to build. Plan groups 1–6 built:
  - Constitution: `tech-stack.md` rules 1, 2 and 8; the Phase 12 D7 note.
  - `lib/portfolio/item-route.ts` holds `itemStaticParams`, `readItem` and `itemMetadata`. `/portfolio/[slug]` imports them, and so does the new `@modal/(.)[slug]/page.tsx`.
  - Routes: `portfolio/layout.tsx`; `@modal/default.tsx` and `@modal/page.tsx` (both `null`); and `@modal/(.)[slug]/` with `layout.tsx` (the shell), `page.tsx`, `loading.tsx`, `error.tsx` and `not-found.tsx` (D8 as amended).
  - `components/portfolio/portfolio-modal.tsx` (client shell). `modal-label.ts` holds the one id that names the dialog: the item title, the loading text, the unavailable message, or the error or 404 heading. `PortfolioDetail` and `PortfolioDetailUnavailable` take `modal`. `ErrorView` and `NotFoundView` take `headingId`. The detail skeleton moved into `portfolio-skeleton.tsx` as `PortfolioDetailSkeleton`, so both loading files share it.
  - Copy: `portfolio.modal.close`, added to the copy-key list in `block.test.ts`.
  - Tests: `e2e/portfolio-modal.spec.ts` (20 cases), added to preview-e2e. `smoke.spec.ts` and `portfolio-detail.spec.ts` now expect the modal after a card click on `/portfolio`. The contrast sampler moved from `shell.spec.ts` to `e2e/contrast.ts`, so the modal spec can check the dialog alone.
- **2026-10-23** — Gates. `typecheck`, `lint`, `format:check` and `test` all pass (1515 tests). `next build` passes against Neon `dev`, with the same render modes as develop's CI build (C2): `/portfolio` is `◐`, and `/portfolio/[slug]` is `◐` with `○` per slug. The new `/portfolio/(.)[slug]` mirrors it.
- **2026-10-23** — Local Playwright: Edge, `--workers=1`, the form on with Cloudflare's test keys, `PW_BASE_URL=http://localhost:3217` and `E2E_PORTFOLIO_STATE=ready`.
  - `portfolio-modal`: 20 passed.
  - `portfolio`, `portfolio-detail`, `smoke`, `shell`, `contextual-cta`, `service-pages`, `a11y`, `not-found` and `error`: 310 passed and 13 skipped. The skips are unavailable-state cases, because the local build has data.

## Deviations from plan

- **D8 amended (owner answer H).** Plan 6.5 found that `notFound()` in the slot replaced the whole page with the site's 404 view. The owner chose to show it inside the dialog, so a `not-found.tsx` and its e2e case were added.
- **The shell focuses Close itself (D4).** React applies `autoFocus` by calling `.focus()` at commit, which is before `showModal()`. Chrome's own pick was then the scroll box, which is focusable as a scroller. A ref and an explicit `focus()` after `showModal()` replace `autoFocus`.

## Issues and fixes

- **A hidden `<Activity>` keeps the dialog.** Next 16 keeps a route it left in a hidden `<Activity>` instead of unmounting it, so after Back or the CTA the modal's DOM stays in the page. A dialog that is hidden but still `:modal` would leave the next page inert and unscrollable. The layout-effect cleanup therefore calls `close()`, with a guard so that close does not trigger another Back, and returns focus to the card link. Forward reveals the route again and the effect reopens the dialog. The e2e cases check that `html` is scrollable again after every way of leaving. The modal spec's locator targets `dialog[open]`, because a second item can leave the first item's closed dialog in the DOM.
- **React passes dialog events up the component tree.** React listens for `cancel` and `close` on every `<dialog>` and passes them to ancestors' handlers. Escape in the nested lightbox therefore reached the modal's `onCancel` and went Back. Both handlers now act only when `event.target === event.currentTarget`.
- **StrictMode double effects in dev.** The `close` event that the first cleanup queues arrives after the second mount has reopened the dialog. `onClose` ignores it while the dialog is open.
- **The 360px box was measured mid-rise.** The test now waits for `y` to reach 0 before measuring (D6).
