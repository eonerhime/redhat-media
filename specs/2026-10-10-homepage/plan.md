# Plan — Phase 3 homepage

Scope, decisions (D1–D9) and constraints (C1–C4) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 1. Constitution first

- [x] 1.1 `roadmap.md`: the Phase 3 row gains the Growth strip (D4). Open question 11 notes that Phase 3 ships without proof points (D6).
- [x] 1.2 `tech-stack.md` → *Architectural rules* 3: the raw-list and `defaults` import ban is enforced by lint (D7).
- [x] 1.3 README: the `page.tsx` tree comment (D6).

## 2. Copy and config

- [x] 2.1 `content/defaults.ts`: the **S** and roadmap keys from the spec's key table.
- [x] 2.2 `content/services.ts`: `summaryKey` and `stepKeys` on each pillar.
- [x] 2.3 `lib/content/*.test.ts`: the pillar key invariants, and the "ported vs. new copy" test updated for the Phase 3 keys.

## 3. Page

- [x] 3.1 `components/home/button-link.tsx` (D9).
- [x] 3.2 `components/home/*`: hero, pillar cards, featured work, process strip and CTA (D1, D3–D5).
- [x] 3.3 `app/(public)/page.tsx`: composes the sections and sets the metadata description.

## 4. Guards

- [x] 4.1 `eslint.config.mjs`: `no-restricted-imports` for `app/**` and `components/**` (D7).
- [x] 4.2 `e2e/home.spec.ts`: the sections, CTA targets, service links and the keyed-text check (D8).

## 5. Verify and open the PR

- [ ] 5.1 Work through every item in [`validation.md`](validation.md).
- [ ] 5.2 Push the branch and open the PR `feature/phase-03-homepage` → `develop`.
