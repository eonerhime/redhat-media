# Plan — Phase 6 About page

Scope, decisions (D1–D9) and constraints (C1–C5) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 1. Config and copy

- [x] 1.1 `content/services.ts`: `roleKey` on the `Pillar` type and on all three pillars (D4).
- [x] 1.2 `content/defaults.ts`: the 21 keys from the spec's key table, the founding year included (D2, D3).
- [x] 1.3 `lib/content/block.test.ts`: the "ported vs. new copy" test lists the Phase 6 keys.
- [x] 1.4 `lib/content/services.test.ts`: every `roleKey` matches `about.pillars.<id>.role` (D4).

## 2. Page

- [x] 2.1 `app/(public)/about/page.tsx`: metadata, header, story with facts list, one-team section, pillar cards, SDD section (Build visible only) and CTA (D1, D4–D8).

## 3. Tests

- [x] 3.1 `e2e/about.spec.ts`: config-derived checks (D9).
- [x] 3.2 `e2e/shell.spec.ts`: `routes` includes `/about` (D9).
- [x] 3.3 `e2e/keyed-text.ts`: an optional list of allowed site values; the About test passes the registration number and location (D9).

## 3a. Sticky header (shell amendment)

- [x] 3a.1 Phase 1 spec: header item 7 amended, D14 added (D10).
- [x] 3a.2 `components/site-header.tsx`: `sticky top-0 z-40 bg-ink`; `app/globals.css`: `scroll-padding-top: 6rem` on `html` (D10).
- [x] 3a.3 `e2e/shell.spec.ts`: the header stays at the top after scrolling, per route and width; the mobile menu opens in view after scrolling (D10).

## 4. Verify and open the PR

- [ ] 4.1 Work through every item in [`validation.md`](validation.md).
- [ ] 4.2 Push the branch and open the PR `feature/phase-06-about` → `develop`.
