# Plan — Phase 21 Contextual CTAs

Scope, decisions (D1–D9) and constraints (C1–C4) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 1. Link side

- [x] 1.1 Add a `contactHref(service?)` helper next to `visibleServices()`. It returns `/contact?service=<slug>` for a visible service and `/contact` for a muted service or none (D1, D8). Add unit tests.
- [x] 1.2 `components/shared/cta.tsx`: add an optional `service` prop that builds its href through `contactHref` (D6: no copy change).
- [x] 1.3 `app/(public)/services/[slug]/page.tsx`: pass the page's service to `<Cta>` (D3).
- [x] 1.4 `components/portfolio/portfolio-detail.tsx`: pass `serviceByCategory(item.category)` to `<Cta>` (D3).

## 2. Page side

- [x] 2.1 Add a pure resolver from a query string and the given services to the category to tick, or none (D1). Add unit tests: visible, muted (absent from the list), unknown, empty, wrong case and repeated.
- [x] 2.2 Add `slug` to `inquiryServiceOption` in `components/contact/inquiry-copy.ts`, so the stepper can match slugs.
- [x] 2.3 `components/contact/inquiry-form.tsx`: after hydration, apply the resolver once. Tick the checkbox and update `chosen`, with no focus move, history entry or URL change (D2, D5, D7, C4).

## 3. Tests

- [x] 3.1 Update the existing CTA checks that expect a bare `/contact` (the "every CTA leads to /contact" walk in `e2e/contact.spec.ts` and the `/\/contact$/` step in `e2e/smoke.spec.ts`) so they accept `?service=<slug>`.
- [x] 3.2 New Playwright cases (D9; listed in `validation.md`).

## 4. Close-out

- [x] 4.1 Run the gates and the build. Confirm `/contact` is still `○` (C2).
- [x] 4.2 Tick `validation.md` and log the work in `implementation.md`. Then open the PR into `develop`.
