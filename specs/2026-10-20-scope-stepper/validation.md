# Validation — Phase 19 Scope stepper

## Roadmap success check ("Done when", verbatim)

> A multi-service inquiry is saved with its full scope. The Playwright test completes the stepper by keyboard only.

- [x] **A multi-service inquiry is saved with its full scope:** services, project types, budget and timeline in the row; on a real Postgres and on the Vercel preview (D2, D13)
- [x] **The Playwright test completes the stepper by keyboard only**, with two services, locally and in CI (D13)

## Stepper

- [x] **Progress kept going back:** answers survive the in-form Back button, browser Back and Change from the review (D6, D7)
- [x] **Project-type rules** enforced on the server: at least one per chosen service, "Not sure yet" exclusive, no type of an unchosen or muted service (D1, D3, D4)
- [x] **Budget and timeline required**, each with its "not sure" answer (D3)
- [x] **Step checks:** Continue on an invalid step shows a focused summary and stays; a server `invalid` opens the first step with an error (D9)
- [x] **Review step** lists every answer, with a working Change for each group (D5)
- [x] **Copy** matches Appendices A and B as approved (D12)
- [x] **Static:** `/contact` prerendered (`○`) with the switch on and off; no new route (C2)

## Data

- [x] **Migration** is additive: `projectTypes` `TEXT[] NOT NULL DEFAULT '{}'`; Phase 18 rows read back with an empty list; `rhm_readonly` still cannot read `Inquiry` (D2, C3)
- [x] `migrate-preview` applies it in CI

## Accessibility and performance

- [x] **Zero axe violations** on every step at 360 and 1440 px (D13)
- [x] **Focus and announcements:** focus moves to each step's heading ("Step n of 6: …"); `aria-current="step"` on the progress list (D8)
- [x] **Screen reader:** NVDA pass on the preview, with what was announced recorded in `implementation.md` (owner answer H)
- [x] **JS budget:** `/contact` client JS grows by at most 15 kB gzipped over Phase 18, with both figures recorded (D14)
- [x] **Lighthouse** job green on `/contact` (D14)

## Security

- [x] The Phase 18 protections still hold: Turnstile, honeypot, `elapsedMs`, rate limit and generic errors; the existing `submit-core` and `turnstile-core` tests pass unchanged except for the new fields (C4)
- [x] No CSP change; `csp.spec.ts` raises no violation on `/contact` with the widget on step 6

## Gates

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass
- [x] `pnpm test:db` passes locally and in the CI `db` job
- [x] `pnpm test:e2e` passes locally and in CI; `preview-e2e` passes on the Vercel preview, including the multi-service submission
- [ ] Owner check on the preview (plan 5.4)
