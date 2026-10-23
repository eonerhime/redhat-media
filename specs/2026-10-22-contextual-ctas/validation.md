# Validation — Phase 21 Contextual CTAs

## Roadmap success check ("Done when", verbatim)

> Each service page opens the stepper with that service pre-selected. A muted service's pre-fill opens the stepper with nothing selected.

- [x] **Each service page opens the stepper with that service pre-selected:** a Playwright test follows "Start a project" on all six `/services/[slug]` pages and finds only that service ticked on step 1 (D2, D3)
- [x] **A muted service's pre-fill opens the stepper with nothing selected:** unit tests show the resolver ticks nothing for a slug that is not among the visible services, and that `contactHref` returns `/contact` for a muted service (D8, D9)

## Pre-fill

- [x] **Portfolio item:** a Playwright test follows "Start a project" on a published `/portfolio/[slug]` page and finds its category's service ticked (D3)
- [x] **Unknown value:** in Playwright, `/contact?service=nope` opens step 1 with nothing ticked and no error. Unit tests cover the empty, wrong-case and repeated values (D1)
- [x] **Carries through:** after a pre-fill, Continue shows that service's project types on step 2 (D7)
- [x] **No pre-fill:** the existing `inquiry.spec.ts` keyboard path passes unchanged (C4)
- [x] **Other pages:** the CTA on `/`, `/services`, `/about` and `/portfolio` still links to a bare `/contact` (D3)

## Static and constraints

- [x] **`/contact` is `○`** in the `pnpm build` output. The service and portfolio pages keep their current render mode (C2)
- [x] No schema, migration, dependency, route or CSP change appears in the diff (C1)

## CI and merge

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass
- [x] `pnpm test:e2e` passes locally (`PW_CHANNEL=msedge`), including the updated CTA and smoke checks. Run on the specs this phase touches, with the form on (see `implementation.md`); CI runs the whole suite
- [x] CI is green on the PR into `develop`, including preview-e2e — PR #51, run 39951391943 (`ci` 431 passed, `db`, `gitleaks`), run 39951417551 (`preview-headers`, `preview-e2e` 122 passed: the 9 new cases on top of the 113 before, `lighthouse`), Vercel Ready
