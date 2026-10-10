# Validation — Phase 4 services index

## Roadmap success check ("Done when", verbatim)

> The page renders from `content/services.ts`. Adding a service to the config adds it to the page without other code changes, and muting one in the config removes it.

- [x] The page renders from `content/services.ts`: `e2e/services.spec.ts` passes, with its expectations derived from the config (D5)
- [x] **Adding a service:** a seventh service added only to `content/services.ts` and `content/defaults.ts` appears on the built page, in its pillar, linking to its slug; `e2e/services.spec.ts` still passes
- [x] **Muting a service:** muting one service in the config removes it from the built page; muting every service in a pillar removes that pillar's section; `e2e/services.spec.ts` still passes

## Local commands

- [x] `pnpm install --frozen-lockfile` succeeds (C1)
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` pass
- [x] `pnpm build` passes, and `/services` and `/` are `○` (C2)
- [x] `pnpm test:e2e` passes, the Phase 1 and Phase 3 suites included (C3)
- [x] `pnpm audit --prod --audit-level high` reports no known vulnerabilities

## Negative tests (each guard must bite)

Run each as an uncommitted change, then revert it with a reverse edit (not `git checkout`).

- [x] **Hard-coded text:** a literal string in the services page fails the keyed-text e2e check
- [x] **Raw list:** importing `services` from `@/content/services` in `app/(public)/services/page.tsx` fails `pnpm lint`

## Owner checks (preview)

- [x] Layout looks right at phone and desktop widths, and the service cards read well
- [x] Each **S** string in the key table is accepted or replaced (D2)

## CI

- [x] CI is green on the PR (`ci` including Playwright, `gitleaks`, `preview-headers`, Vercel)

## Spec hygiene

- [x] The README amendment is in the same PR
- [x] Every `plan.md` box is ticked, and `implementation.md` records any deviations
