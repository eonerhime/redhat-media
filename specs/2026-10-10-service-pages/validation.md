# Validation — Phase 5 service detail pages

## Roadmap success check ("Done when", verbatim)

> Six service pages are pre-rendered, each with its own metadata and `Service` JSON-LD. A service muted in the config returns 404.

- [x] **Six pages pre-rendered:** the build prerenders all six slugs (`.html`, `.rsc`, and a `.meta` with no postponed state, for each) (C2)
- [x] **Own metadata and JSON-LD:** `e2e/service-pages.spec.ts` passes. Each visible service has its own title and description, and one parseable `Service` JSON-LD block with its name, summary and URL (D7, D8)
- [x] **Muted returns 404:** with one service muted in the config, its page returns 404. It is gone from `/` and `/services`, the other pages still render, and `e2e/service-pages.spec.ts` still passes
- [x] An unknown slug renders the not-found page with `noindex` (a soft 404, accepted by the owner; D1)

## Local commands

- [x] `pnpm install --frozen-lockfile` succeeds (C1)
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` pass
- [x] `pnpm build` passes: the six service paths are prerendered, and `/` and `/services` stay `○` (C2)
- [x] `pnpm test:e2e` passes, the Phase 1, 3 and 4 suites included (C3)
- [x] `pnpm audit --prod --audit-level high` reports no known vulnerabilities

## Negative tests (each guard must bite)

Run each as an uncommitted change, then revert it with a reverse edit (not `git checkout`).

- [x] **Hard-coded text:** a literal string on a service page fails the keyed-text e2e check
- [x] **Raw list:** importing `services` from `@/content/services` in the service page fails `pnpm lint`
- [ ] **Banned prop:** `dangerouslySetInnerHTML` in `components/shared/json-ld.tsx` fails `pnpm lint` (C5). *Not run: the auto-mode classifier refused the edit. Substitute evidence in `implementation.md`, pending the owner's decision.*
- [x] **Script break-out:** a summary containing `</script><script>alert(1)</script>` renders inside the JSON-LD as escaped data. The page has exactly one `<script type="application/ld+json">`, and the parsed JSON holds the string intact (D5)

## Owner checks (preview)

- [ ] Layout looks right at phone and desktop widths on at least two service pages
- [ ] Each **S** string in the key table is accepted or replaced (D3)

## CI

- [ ] CI is green on the PR (`ci` including Playwright, `gitleaks`, `preview-headers`, Vercel)

## Spec hygiene

- [x] The `tech-stack.md` amendment is in the same PR
- [ ] Every `plan.md` box is ticked, and `implementation.md` records any deviations
