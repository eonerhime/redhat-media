# Validation — Phase 22 Portfolio modal

## Roadmap success check ("Done when", verbatim)

> Deep links, back/forward and focus trapping behave correctly, as tested in Playwright.

All Playwright cases below run in `e2e/portfolio-modal.spec.ts` in preview-e2e, against the seeded preview (D11). They passed in PR #53, run 40019629367 (preview-e2e: 142 passed, 3 skipped).

- [x] **Deep links:** loading `/portfolio/{slug}` directly shows the full page: no dialog, the "All work" link and one `CreativeWork` JSON-LD block. Reloading while the modal is open does the same.
- [x] **Opens over the grid:** clicking a card on `/portfolio` opens a dialog labelled with the item title. The URL is `/portfolio/{slug}`, and the grid is still in the page behind it.
- [x] **Back/forward:** Back closes the modal and returns to `/portfolio`. Forward reopens the modal on the same item.
- [x] **Filter kept:** opened from `/portfolio?category=web-apps`, Back returns to that exact URL with that filter current.
- [x] **Focus trapping:** focus starts on Close. Tabbing well past the last control never reaches the page behind (as in Phase 12, focus may pass through the browser's own controls). The grid behind is inert.
- [x] **Focus return:** after Back, Close, Escape or a backdrop click, focus is on the card link that opened the modal.

## Closing and behaviour

- [x] **Every close is Back:** Close, Escape, and a backdrop click at 1440px each close the modal and leave the URL at `/portfolio`. Forward then reopens it, which proves history went back rather than a new entry being pushed (D4).
- [x] **No backdrop at phone width:** at 360px the dialog fills the viewport, and there is no sideways scroll (D5).
- [x] **Nested lightbox:** in the modal the hero opens the lightbox, and Escape closes only the lightbox. The modal stays open with the same URL (D4).
- [x] **Scroll:** after scrolling the grid, opening and closing the modal leaves the grid's scroll position unchanged (D4).
- [x] **Tab title:** it reads "{item} \| RedHat Media" while the modal is open and goes back to the portfolio title after closing (D7).
- [x] **CTA:** "Start a project" in the modal goes to `/contact?service=<slug>` with that service ticked, and no dialog remains (D1, Phase 21).
- [x] **Related work stays full-page:** a related-work card on `/services/web-app-development` opens the full page, with no dialog (D2).
- [x] **Reduced motion:** with `prefers-reduced-motion: reduce`, the open dialog has no transition (D6).
- [x] **Contrast:** the rendered-contrast check passes on the open modal (C5).
- [x] **Not found inside the slot:** a soft navigation from the grid to an unpublished slug shows the 404 view inside the dialog, named by its heading, and Close returns to the grid (D8 as amended, owner answer H).

## Static and constraints

- [x] In the `pnpm build` route table, `/portfolio` is `◐`, `/portfolio/[slug]` lists every published slug, and every other route keeps its mode (C2). Checked against develop's CI build (`implementation.md`).
- [x] No schema, migration, seed, CSP, env or dependency change appears in the diff. The only workflow change is the preview-e2e spec list (C3).
- [x] Without JavaScript, a card on `/portfolio` loads the full page (C6).

## Manual checks

- [x] **NVDA spot check** on the preview (Windows): opening a card announces a dialog with the item title, Tab stays inside, and focus returns to the card on close (D12). Run 2026-10-23 in the owner's Chrome on the preview, with NVDA 2026.2:
  - Enter on the SportsPred card spoke "SportsPred, dialog", then "Close, button".
  - 14 Tabs went through the hero button, Visit live site, the credit link and Start a project, then Chrome's own toolbar, and back into "SportsPred, dialog". The grid was never reached.
  - Escape spoke the page title "Portfolio | RedHat Media" and NVDA's page-load line ("Skip to content"), then "SportsPred, visited, link, heading level 2": focus was back on the card.
- [x] **Owner preview check** on phone and desktop: open a card, scroll inside the modal, close it with Close and with Back, reload an open modal URL, and confirm the look (D12). Confirmed by the owner, 2026-10-23.

## CI and merge

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass
- [x] `pnpm test:e2e` passes locally (`PW_CHANNEL=msedge`, `--workers=1`) on the specs this phase touches. The modal spec runs against Neon `dev` with `E2E_PORTFOLIO_STATE=ready` (see `implementation.md`).
- [x] CI is green on the PR into `develop`, including preview-e2e with the new spec: PR #53 at `13a4d05`, run 40019560008 (`ci` 431 passed, `db`, `gitleaks`) and run 40019629367 (`preview-headers`, `preview-e2e` 142 passed and 3 skipped, `lighthouse`), Vercel Ready
- [x] Every box in `plan.md` is ticked
