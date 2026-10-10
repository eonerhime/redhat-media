# Validation — Phase 2 content defaults

## Roadmap success check ("Done when", verbatim)

> Unit tests show `block(key)` returns defaults and fails type-checking for unknown keys. They also show that a muted service is left out of `visibleServices()`, together with its pillar once all of that pillar's services are muted.

- [x] Unit tests show `block(key)` returns defaults
- [x] Unit tests show `block(key)` fails type-checking for unknown keys (`pnpm typecheck` enforces the `@ts-expect-error`; see the negative test below)
- [x] Unit tests show a muted service is left out of `visibleServices()`, together with its pillar once all of that pillar's services are muted

## Local commands

- [x] `pnpm install --frozen-lockfile` succeeds (no dependency change, C1)
- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] `pnpm format:check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes, and the route table still shows `○ /` (C2)
- [x] `pnpm test:e2e` passes unchanged (C2)
- [x] `pnpm audit --prod --audit-level high` reports no known vulnerabilities

## Verbatim port

- [x] A one-off Node script extracts the visible text and the meta description from `git show main:index.html`, decodes the entities, and confirms that every string appears in the spec's inventory and in its stated destination (D5). The result is recorded in `implementation.md`.

## Negative tests (each guard must bite)

Run each as an uncommitted change, then revert it with a reverse edit (not `git checkout`).

- [x] **Unknown key:** adding the `@ts-expect-error` test's key to `defaults` makes `pnpm typecheck` fail ("Unused '@ts-expect-error' directive")
- [x] **Key pattern:** adding a key `site.name` to `defaults` fails `pnpm typecheck` (D4)
- [x] **Verbatim:** changing one character of a ported string fails the verbatim test
- [x] **Enum drift:** adding `BRANDING` to the README §5 enum fails the drift test (D8)
- [x] **Last visible service:** setting `muted: true` on all six services in the config fails the "at least one visible" test

## Preview manual check (owner)

- [ ] The Vercel preview looks the same as Phase 1 (no rendered change, C2)
- [ ] The owner has read the key inventory and the services table in `spec.md`, and accepts the ported wording, the pillar names and the slugs

## CI

- [ ] CI is green on the PR (`ci` including Playwright, `gitleaks`, `preview-headers`, Vercel)

## Spec hygiene

- [ ] The `roadmap.md`, `tech-stack.md` and README amendments (plan group 1) are in the same PR
- [ ] Every `plan.md` box is ticked, and `implementation.md` records any deviations
