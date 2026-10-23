# Implementation log — Phase 21 Contextual CTAs

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

## Progress

- **2026-10-22** — Branch `feature/phase-21-contextual-ctas` created from `develop` at `ae76dae`. Owner answers A–G given; spec, plan and validation drafted for approval.

- **2026-10-23** — Owner approval to build. The branch was fast-forwarded to `develop` at `a07595c` (PR #50, the service-card amendment) first.
- **2026-10-23** — Plan groups 1–3 built.
  - Link side: `contactPath(service, visible)` and `contactHref(service?)` in `lib/content/services.ts`. `<Cta service>` builds its href through them. The service page passes its service, and `portfolio-detail.tsx` passes `serviceByCategory(item.category)`. The portfolio page's unavailable state and every other page keep `<Cta />` and the plain `/contact` (D3, D8).
  - Page side: `prefillCategory(search, options)` in `lib/inquiry/prefill.ts`. `inquiryServiceOption` now carries `slug`. `inquiry-form.tsx` applies the pre-fill in its existing mount effect: it checks the box and then reads every ticked box into `chosen`, as it already did for restored ticks. Focus, URL and history are untouched (D5, D7).
  - Tests:
    - `lib/inquiry/prefill.test.ts` has 12 cases: visible, muted through an override, none, unknown, empty, missing, wrong case, enum name, a `/portfolio` filter name and repeated values.
    - `e2e/contextual-cta.spec.ts` has 9 cases: the six service pages, a portfolio item, an unknown value and the carry-through to step 2. It is added to `preview-e2e`, the job with a seeded database.
    - Updated: the CTA walk in `contact.spec.ts` (each service page expects its own slug; a portfolio item accepts either form), `smoke.spec.ts`, `service-pages.spec.ts` and the ready case in `portfolio-detail.spec.ts`.
  - Local checks:
    - typecheck, lint, `format:check` and `pnpm test` (1512 tests) pass;
    - `pnpm build` with the form on: `/contact` is `○`, and `/services/[slug]` and `/portfolio/[slug]` render as before (C2);
    - Playwright with the form on and Edge, over the contextual-cta, contact, smoke, service-pages, portfolio-detail, inquiry, home, services, portfolio and about specs: 159 passed, 3 skipped (unavailable-state cases; the local build has data), 1 environment mismatch (below).

- **2026-10-23** — PR #51 (`348ec99`). All checks passed: run 39951391943 (`ci`: 431 passed, 35 skipped, the portfolio pre-fill case among them because CI has no database; `db`; `gitleaks`) and run 39951417551 (`preview-headers`, `lighthouse`, and `preview-e2e`: 122 passed, 3 skipped, against 113 and 3 on PR #50, so all 9 new cases ran on the seeded preview), Vercel Ready. `preview-e2e` took 13 minutes, nearly all of it in "Install Playwright Chromium"; the tests took 1.2 minutes. Every plan and validation box is ticked.

## Deviations from plan

| Item | Planned | Actual | Reason |
| --- | --- | --- | --- |
| 1.1 helper | `contactHref(service?)` | Also a pure `contactPath(service, visible)`, which `contactHref` wraps | The muted case can then be unit-tested with an override and no module mocking, as `resolveVisibility` already is (Phase 2). |
| 3.2 placement | Playwright cases | Their own spec file, added to the `preview-e2e` list in `preview-headers.yml` | The portfolio case needs the seeded database, which only `preview-e2e` has. In CI (no database) that case skips. |

## Issues and fixes

- **First local build failed:** "`use cache` function took too long during prerendering" on `/about/opengraph-image` and `/portfolio/abara`. Neither depends on this change, and a rebuild passed unchanged. The likely cause is the Neon `dev` compute waking up.
- **Keyboard submission showed success locally:** with the form on, `inquiry.spec.ts` › keyboard alone expects CI's no-database message unless `E2E_INQUIRY_SUBMIT=success`. The local build has the Neon `dev` database, so the submission was saved and the success panel showed. Re-run with `E2E_INQUIRY_SUBMIT=success`, it passed (C4). The two runs left two test rows in Neon `dev` only, and no email went out because Resend is not configured locally.
