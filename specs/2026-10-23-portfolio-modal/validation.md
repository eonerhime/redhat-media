# Validation — Phase 22 Portfolio modal

## Roadmap success check ("Done when", verbatim)

> Deep links, back/forward and focus trapping behave correctly, as tested in Playwright.

All Playwright cases below run in `e2e/portfolio-modal.spec.ts` in preview-e2e, against the seeded preview (D11).

- [ ] **Deep links:** loading `/portfolio/{slug}` directly shows the full page: no dialog, the "All work" link and one `CreativeWork` JSON-LD block. Reloading while the modal is open does the same.
- [ ] **Opens over the grid:** clicking a card on `/portfolio` opens a dialog labelled with the item title. The URL is `/portfolio/{slug}`, and the grid is still in the page behind it.
- [ ] **Back/forward:** Back closes the modal and returns to `/portfolio`. Forward reopens the modal on the same item.
- [ ] **Filter kept:** opened from `/portfolio?category=web-apps`, Back returns to that exact URL with that filter current.
- [ ] **Focus trapping:** focus starts on Close. Tabbing well past the last control never reaches the page behind (as in Phase 12, focus may pass through the browser's own controls). The grid behind is inert.
- [ ] **Focus return:** after Back, Close, Escape or a backdrop click, focus is on the card link that opened the modal.

## Closing and behaviour

- [ ] **Every close is Back:** Close, Escape, and a backdrop click at 1440px each close the modal and leave the URL at `/portfolio`. Forward then reopens it, which proves history went back rather than a new entry being pushed (D4).
- [ ] **No backdrop at phone width:** at 360px the dialog fills the viewport, and there is no sideways scroll (D5).
- [ ] **Nested lightbox:** in the modal the hero opens the lightbox, and Escape closes only the lightbox. The modal stays open with the same URL (D4).
- [ ] **Scroll:** after scrolling the grid, opening and closing the modal leaves the grid's scroll position unchanged (D4).
- [ ] **Tab title:** it reads "{item} \| RedHat Media" while the modal is open and goes back to the portfolio title after closing (D7).
- [ ] **CTA:** "Start a project" in the modal goes to `/contact?service=<slug>` with that service ticked, and no dialog remains (D1, Phase 21).
- [ ] **Related work stays full-page:** a related-work card on `/services/web-app-development` opens the full page, with no dialog (D2).
- [ ] **Reduced motion:** with `prefers-reduced-motion: reduce`, the open dialog has no transition (D6).
- [ ] **Contrast:** the rendered-contrast check passes on the open modal (C5).
- [ ] **Not found inside the slot:** a soft navigation from the grid to an unpublished slug shows the 404 view inside the dialog, named by its heading, and Close returns to the grid (D8 as amended, owner answer H).

## Static and constraints

- [ ] In the `pnpm build` route table, `/portfolio` is `◐`, `/portfolio/[slug]` lists every published slug, and every other route keeps its mode (C2).
- [ ] No schema, migration, seed, CSP, env or dependency change appears in the diff. The only workflow change is the preview-e2e spec list (C3).
- [ ] Without JavaScript, a card on `/portfolio` loads the full page (C6).

## Manual checks

- [ ] **NVDA spot check** on the preview (Windows, Edge): opening a card announces a dialog with the item title, Tab stays inside, and focus returns to the card on close (D12).
- [ ] **Owner preview check** on phone and desktop: open a card, scroll inside the modal, close it with Close and with Back, reload an open modal URL, and confirm the look (D12).

## CI and merge

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass
- [ ] `pnpm test:e2e` passes locally (`PW_CHANNEL=msedge`, `--workers=1`) on the specs this phase touches. The modal spec runs against Neon `dev` with `E2E_PORTFOLIO_STATE=ready` (see `implementation.md`).
- [ ] CI is green on the PR into `develop`, including preview-e2e with the new spec
- [ ] Every box in `plan.md` is ticked
