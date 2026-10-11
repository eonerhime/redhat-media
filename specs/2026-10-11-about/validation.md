# Validation — Phase 6 About page

## Roadmap success check ("Done when", verbatim)

> `/about` is live, and all copy is keyed.

- [ ] **Live:** `/about` renders on the Vercel preview and is `○` in the build (D1, C2)
- [x] **All copy keyed:** `e2e/about.spec.ts` passes, including the keyed-text check (C5, D9)
- [x] **Sticky header:** on every route and at 360, 768 and 1440px, the header is at the top of the viewport after scrolling to the bottom, and the mobile menu opens in view (D10)
- [x] **Muted pillar:** with the Build pillar's service muted in the config, the Build card and the SDD section are gone, the other cards still render, and `e2e/about.spec.ts` still passes (D4, D7)

## Local commands

- [x] `pnpm install --frozen-lockfile` succeeds (C1)
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` pass
- [x] `pnpm build` passes: `/about` is `○`, and `/`, `/services` and the six service paths are unchanged (C2)
- [x] `pnpm test:e2e` passes, the Phase 1, 3, 4 and 5 suites included (C3)
- [x] `pnpm audit --prod --audit-level high` reports no known vulnerabilities

## Negative tests (each guard must bite)

Run each as an uncommitted change, then revert it with a reverse edit (not `git checkout`).

- [x] **Hard-coded text:** a literal string on `/about` fails the keyed-text e2e check
- [x] **Raw list:** importing `services` from `@/content/services` in the about page fails `pnpm lint`
- [x] **Missing role:** removing `roleKey` from one pillar fails `pnpm typecheck` (D4)
- [x] **Not sticky:** removing `sticky` from the header fails the shell e2e scroll check (D10)

## Owner checks (preview)

- [ ] Layout looks right at phone and desktop widths
- [ ] The header stays visible while scrolling, on a phone and on a desktop (D10)
- [ ] The founder line and founding year are correct (D2)
- [ ] Each **S** string in the key table is accepted or replaced (D3)

## CI

- [ ] CI is green on the PR (`ci` including Playwright, `gitleaks`, `preview-headers`, Vercel)

## Spec hygiene

- [ ] Every `plan.md` box is ticked, and `implementation.md` records any deviations
