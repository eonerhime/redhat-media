# Plan — Phase 4 services index

Scope, decisions (D1–D7) and constraints (C1–C4) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 1. Constitution first

- [x] 1.1 README: the `services/` tree comment (D7).

## 2. Copy

- [x] 2.1 `content/defaults.ts`: the three **S** keys from the spec's key table.
- [x] 2.2 `lib/content/block.test.ts`: the "ported vs. new copy" test lists the Phase 4 keys.

## 3. Components and page

- [x] 3.1 `components/shared/`: move `ButtonLink` and `Cta`, extract `StepList`; the homepage imports them from there (D4).
- [x] 3.2 `app/(public)/services/page.tsx`: header, pillar sections with service cards, CTA, metadata (D1, D3).

## 4. Tests

- [x] 4.1 `e2e/keyed-text.ts`: the keyed-text check as a shared helper, used by `e2e/home.spec.ts` (D5).
- [x] 4.2 `e2e/services.spec.ts`: headings, cards and links derived from the config, no muted service, CTA, metadata, keyed text (D5).
- [x] 4.3 `e2e/shell.spec.ts`: layout and contrast checks loop over `/` and `/services` (D6).

## 5. Verify and open the PR

- [x] 5.1 Work through every item in [`validation.md`](validation.md).
- [x] 5.2 Push the branch and open the PR `feature/phase-04-services-index` → `develop`.
