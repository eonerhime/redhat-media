# Phase 21 — Contextual CTAs

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 2, Phase 21
- **Branch:** `feature/phase-21-contextual-ctas` (from `develop` at `ae76dae`, fast-forwarded to `a07595c` after PR #50)
- **Started:** 2026-10-22
- **Status:** owner answers A–G given 2026-10-22; approved 2026-10-23; built, PR into `develop`

## What and why

Every "Start a project" button on the site opens a blank `/contact` today. A visitor who has just read the Photography page, or a Web & App case study, has already told us what they want. This phase makes that button carry it: `/contact?service=photography` opens the scope stepper with Photography already ticked. That is one less choice before a scoped inquiry (*Guiding principles* 1, inquiry first), and it is what the *Supporting metrics* row "portfolio / service page → inquiry conversion" measures.

## Constitution sections this phase relies on

- `mission.md` → *Supporting metrics* (page → inquiry conversion); *Guiding principles* 1 (inquiry first).
- `tech-stack.md` → *Architectural rules*:
  - 1: server-first, with client components only where interaction needs them;
  - 3: a muted service is ignored in the `?service=` pre-fill, and a portfolio item in a muted category drops it from its "Start a project" link;
  - 9: canonical URLs carry no query string.
- `roadmap.md` → Phase 21; Phase 22 (the portfolio modal reuses `portfolio-detail.tsx`, so it inherits this CTA); Phase 31 (muting moves to the database, and `visibleServices()` stays the only reader).
- Phase 19 spec: the stepper (D5–D11) and `/contact` staying prerendered (C2).

## Scope

1. **Link side** (D1, D3, D8): `<Cta>` takes an optional service. The service pages pass their own, and portfolio pages pass their item's category. A muted service gives the plain `/contact` link.
2. **Page side** (D2, D5, D7): the stepper reads `?service=` in the browser and ticks that service on step 1 when it is visible.
3. **Tests** (D9): unit tests for both sides, Playwright for the Done-when, and the existing "every CTA leads to `/contact`" checks updated.

## Constitution changes

None. `tech-stack.md` → *Architectural rules* 3 already describes the pre-fill and how muting affects it, and the roadmap row stands as written. The owner's uncommitted `roadmap.md` edit (a `---` before Milestone 2) is not part of this phase.

## Out of scope

- Pre-filled links from the service cards on `/` and `/services` (owner answer C). Those pages, `/about` and `/portfolio` keep the plain CTA.
- `/portfolio?category=…` pre-fill. One filter can cover several services (`marketing` covers three).
- Recording where an inquiry came from (owner answer D). There is no schema change. Revisit with the inbox (Phase 32) if sales want it.
- Service-specific CTA copy (owner answer F).
- More than one service in the query, or pre-filling project types, budget or timeline.
- Skipping ahead to step 2 (owner answer B).

## Decisions

- **D1 — The value is the service slug.** `?service=` takes the `slug` from `content/services.ts`, the same segment as `/services/[slug]` (`photography`, `web-app-development`, …), as in the roadmap's example. The match is exact. Any other value (an enum name, the wrong case, a `/portfolio` filter name such as `web-apps`, empty) is ignored. If the parameter repeats, only the first value counts (`URLSearchParams.get`). *(Assumed from the roadmap example; not asked.)*
- **D2 — Step 1 opens with the service ticked** (owner answer B). The stepper opens on Services as usual, with the pre-filled service checked. The visitor can tick more services or untick it, then press Continue. Focus, step announcements and history are unchanged from Phase 19.
- **D3 — Only service and portfolio detail pages** (owner answer C):
  - `/services/[slug]` links to its own service;
  - `/portfolio/[slug]` links to its item's `category`, which is always one of the six services.

  Every other page keeps the plain `/contact` link.
- **D4 — No source tracking** (owner answer D). There is no new column or migration. Vercel Analytics already records visits to `/contact?service=…`.
- **D5 — The browser reads the query** (owner answer E). The stepper reads `window.location.search` once, after hydration. `/contact` stays prerendered (`○`) with no new dynamic hole (Phase 19 spec, C2). Without JavaScript nothing is pre-ticked, which is acceptable because the form needs JavaScript for Turnstile anyway.
- **D6 — The copy is unchanged** (owner answer F). Only the link changes: "Have a project in mind?" and "Start a project" stay as they are, with no new content blocks.
- **D7 — The pre-fill is applied once, on load.**
  - It ticks the box and updates the stepper's chosen-services state, so step 2 shows that service's project types. It never unticks anything and never re-applies after the visitor changes step 1.
  - The URL is left as it is, with no `replaceState`. A reload pre-fills again, which matches a fresh visit.
  - It moves no focus and adds no history entry.
  - `/contact`'s canonical stays `/contact`, as already set (rule 9).
- **D8 — Both ends check visibility.**
  - **Link side:** a shared href helper takes a service and returns `/contact?service=<slug>` only when the service is in `visibleServices()`, and `/contact` otherwise.
  - **Page side:** the stepper ticks only a slug that is among the services it was given, which are already the visible ones.

  So a muted service is ignored even on a hand-typed URL (rule 3). Because muting is config-only until Phase 31, a mute takes effect at the next build on both ends. Server-side inquiry validation still rejects a muted service, as before.
- **D9 — Validation** (owner answer G):
  - unit tests for the href helper and the slug resolver, covering visible, muted, unknown, empty, wrong-case and repeated values;
  - Playwright for the cases in [`validation.md`](validation.md);
  - the muted case is tested at unit level only, because muting can't be toggled in a running build before Phase 31.

  No owner preview check, JS-budget figure or NVDA pass is required.

## Constraints

- **C1** No schema change, migration, new library, new route or CSP change.
- **C2** `/contact` stays `○` in the build output. The service and portfolio pages stay as prerendered as they are now.
- **C3** Public code reads services only through `visibleServices()` (rule 3; the ESLint ban stands).
- **C4** The Phase 19 stepper behaviour (keyboard path, focus, history, review Change) is unchanged when there is no `?service=`.

## Owner answers (2026-10-22)

- **A.** The phase is roadmap Phase 21, Contextual CTAs.
- **B.** The stepper lands on step 1 with the service ticked.
- **C.** Roadmap pages only: service and portfolio detail pages.
- **D.** No source tracking for now.
- **E.** The query is read in the browser, and `/contact` stays static.
- **F.** The current CTA copy is kept.
- **G.** Playwright covers every case. No other optional checks were chosen.
