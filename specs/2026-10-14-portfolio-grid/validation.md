# Validation — Phase 10 Portfolio grid

## Roadmap success check ("Done when", verbatim)

> All seeded items are listed, with loading, error and empty states.

- [x] **All seeded items listed:** on the Vercel preview, `preview-e2e` finds the five seeded items in order, each with a loaded cover, category badge, tech pills and an `https:` live link (D3, D4, D7, D11) — `preview-e2e` (run 38578733148): 11 passed with `E2E_PORTFOLIO_STATE=ready` on the PR #14 preview
- [x] **Loading state:** `app/(public)/portfolio/loading.tsx` exists and renders a labelled `role="status"` placeholder (D5) — `app/(public)/portfolio/loading.tsx`
- [x] **Error state:** the CI build has no database, and the e2e run sees the **unavailable** message and the CTA on `/portfolio`. `app/(public)/error.tsx` exists with fixed copy and a "Try again" button that calls `retry()` (D3, D6, D11; amended 2026-10-14: no test forces a render error, so the boundary is checked by type and review, not by e2e) — CI run 38578623545 (`ci`, pinned `unavailable`); locally 220 passed with `DATABASE_URL` blank
- [x] **Empty state:** `/dev/portfolio-states` shows the empty message, and the e2e spec checks it; on `/portfolio` the CTA follows every state (D3, D10; amended 2026-10-14) — `portfolio.spec.ts` › `/dev/portfolio-states`, locally and on the preview

## Page behaviour

- [x] **Related work:** the Web & App Development page shows SportsPred, AfroJamz and toutMessages with a "See all work" link; the other five service pages show no related-work section (D8) — `portfolio.spec.ts` › related work, all six service pages, locally and on the preview
- [x] **Static:** the build route table shows `/portfolio` and the service pages as prerendered, not dynamic (C2) — `/portfolio` ○ 1h/1d (ready), ○ 1m/1h (unavailable); all six service pages prerendered
- [x] **Links safe:** every live link has `target="_blank"` and `rel="noopener noreferrer"` (D4) — asserted per card in `portfolio.spec.ts`
- [x] **Motion:** the hover lift and zoom run normally and are absent under `prefers-reduced-motion` (D4) — hover test: `translate`/`scale` set with motion allowed, `none` under reduce
- [x] **Keyed text:** every visible string on `/portfolio` is a content key or seeded database content (D9) — `portfolio.spec.ts` and `service-pages.spec.ts` keyed-text checks
- [ ] **Owner preview check:** the owner viewed `/portfolio` and the Web & App service page on the preview and approved them (owner check)

## Accessibility and layout

- [x] `/portfolio` passes the shell checks at 360, 768 and 1440px, with no horizontal overflow (D10) — `shell.spec.ts` routes include `/portfolio`
- [x] The rendered-contrast check passes on `/portfolio` (C5) — `shell.spec.ts` contrast test on `/portfolio`, both states
- [x] Every cover has alt text, and the hover cue also appears on keyboard focus (D4) — covers found by alt in `portfolio.spec.ts`; `focus-within` variants in the card

## Quality gates

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass locally — unit 720/720
- [x] `pnpm test:db` passes, including `read-core.db.test.ts` — 24/24 locally (postgres:17 replica) and CI `db`
- [x] `pnpm test:e2e --workers=1` passes locally (ready state), with existing specs changed only as C4 (amended) allows — ready 221; unavailable 220 + 1 skipped
- [x] CI is green on the PR (`ci`, `db`, `gitleaks`, `preview-headers`, `preview-e2e`, Vercel) — PR #14: run 38578623545 (`ci`, `db`, `gitleaks`), run 38578733148 (`preview-headers`, `preview-e2e`), Vercel Ready
- [x] No secret appears in logs or artifacts; gitleaks is green (C6) — bypass header scoped to the preview origin, traces off for remote runs, no artifacts; gitleaks green

## Spec hygiene

- [x] The `tech-stack.md`, Phase 5 and Phase 8 spec, and `CLAUDE.md` amendments are in the same PR — commit 81c20c4
- [ ] Every `plan.md` box is ticked, and `implementation.md` records any deviations
