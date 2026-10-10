# Validation — Phase 3 homepage

## Roadmap success check ("Done when", verbatim)

> The homepage is live on preview with real copy, and every text string is keyed.

- [x] The homepage is live on the Vercel preview with the copy in the spec's key table
- [x] Every text string is keyed: `e2e/home.spec.ts` passes the keyed-text check (D8)

## Local commands

- [x] `pnpm install --frozen-lockfile` succeeds (C1)
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` pass
- [x] `pnpm build` passes, and `/` is still `○` (C2)
- [x] `pnpm test:e2e` passes, the Phase 1 suite included (C3)
- [x] `pnpm audit --prod --audit-level high` reports no known vulnerabilities

## Negative tests (each guard must bite)

Run each as an uncommitted change, then revert it with a reverse edit (not `git checkout`).

- [x] **Hard-coded text:** adding a literal string in a homepage component fails the keyed-text e2e check
- [x] **Raw list:** importing `services` from `@/content/services` in `app/(public)/page.tsx` fails `pnpm lint`
- [x] **Defaults:** importing `@/content/defaults` in a component fails `pnpm lint`
- [x] **Muting reaches the page:** muting both Production services in the config removes the Production card and strip from the built page

## Owner checks (preview)

- [x] Layout looks right at phone and desktop widths, and the pillar cards read well
- [x] Each **S** string in the key table is accepted or replaced (D2)
- [x] The Growth process strip ("Audit → Plan → Grow") is accepted, changed or removed (D4)

## Release gate (carried into the Phase 16 spec)

- [x] Recorded in `implementation.md` for Phase 16: before the Milestone 1 release, the featured-work section shows real items, links to a populated `/portfolio`, or is removed (D5)

## CI

- [x] CI is green on the PR (`ci` including Playwright, `gitleaks`, `preview-headers`, Vercel)

## Spec hygiene

- [x] The `roadmap.md`, `tech-stack.md` and README amendments are in the same PR
- [x] Every `plan.md` box is ticked, and `implementation.md` records any deviations
