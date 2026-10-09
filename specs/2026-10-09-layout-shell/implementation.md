# Implementation log — Phase 1 layout shell

## Progress

- **2026-10-09** — Kickoff.
  - Branch `feature/phase-01-layout-shell` created from `develop` at `596a851`.
  - Owner answers:
    - Roadmap open question 1: there is no logo or favicon, so the CSS wordmark stays and the favicon is generated (D1).
    - Typefaces are Archivo and Inter (D2).
    - The nav is config-driven with all four links (D3).
    - Playwright comes in now (D4).
  - Contrast ratios computed with the WCAG 2.x formula. The results drive D7: `brand-deep` is `#d0181f`, and `muted` is restricted to `ink`.
  - Docs checked via ctx7:
    - `next/font` `variable` with Tailwind `@theme inline` (Next.js docs).
    - `new Date()` under `cacheComponents` needs `'use cache'` or `io()` (Next.js docs, D10).
    - Playwright `reducedMotion` and `webServer` options (Playwright docs).
  - npm on 2026-10-09: `@playwright/test` latest is 1.64.0 (published 2026-10-07), so it is pinned to 1.63.0 (C1).
  - Spec folder written. Awaiting owner review before plan group 1.

## Deviations from plan

| Item | Planned | Actual | Reason |
| --- | --- | --- | --- |

## Issues and fixes
