# Validation — Phase 16 Milestone 1 release

## Roadmap success check ("Done when", verbatim)

> The production URL serves the new site, a rehearsed restore is documented with its timing, and the old `index.html` is gone from `main`.

- [x] **Production URL serves the new site:** the hook-triggered production deployment is Ready, and `production-checks` is green on it (D3, D6).
- [x] **Rehearsed restore, with timing:** both rehearsal branches verified, each step's duration and the total recorded in `implementation.md`, and `docs/runbooks/restore.md` written (D10).
- [x] **`index.html` gone from `main`:** `git ls-tree origin/main` lists no `index.html` after the release merge (D5).

## Before the release PR merges

- [x] Production roles exist (`rhm_app`, `rhm_migrator`, `rhm_readonly`), confirmed by role list on the production endpoint (D2)
- [x] `neon-production` has `MIGRATOR_DATABASE_URL` and `VERCEL_DEPLOY_HOOK_URL`, is limited to `main` and has the owner as required reviewer (D2, D3)
- [x] The hook test proved that a hook deploys with auto-deploy off and reports `deployment_status`, or D3 was amended to the fallback (D3)
- [x] Vercel Production has `DATABASE_URL`, `RATE_LIMIT_SALT`, `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, and neither `MIGRATOR_DATABASE_URL` nor `BOOTSTRAP_DATABASE_URL` (D4)
- [x] The `monitor` environment holds the production `rhm_readonly`, is limited to `main`, and `MONITOR_BASE_URL` is the production origin (D8)
- [x] `.env.neon-production.local` is deleted, and no value was displayed (D4, C5)
- [x] The phase PR is merged into `develop` with every check green (plan 4.6)

## Release

- [x] `migrate-production` applied every migration and seeded 5 items and 5 covers, then fired the hook (D1–D3)
- [x] `production-checks`: every header present and the CSP enforced; the smoke test green in all three variants; `release.spec.ts` green (`/dev/*` 404, crawlable, production canonicals and sitemap, three share cards at 1200 × 630) (D6)

## External checks

- [x] securityheaders.com rates the production URL A or better (D7)
- [ ] opengraph.xyz shows the title, description and 1200 × 630 card for `/`, a service page and a portfolio item (D7)
- [ ] A portfolio link shared in WhatsApp shows its card (D7)
- [x] PageSpeed Insights, mobile, no audit skipped: every template ≥ 90 in all four categories (D7)
- [x] Bot Protection decision recorded, with the evidence for it (D9)

## Monitor

- [ ] A dispatched test alert ran every real check against production and reached both inboxes (D8)
- [x] The query-volume limit is confirmed or changed from a production sample, and recorded in `monitor-core.ts`, `monitoring.md` and `tech-stack.md` (D8)
- [x] The first scheduled run on `main` is green (D8)

## Search and owner checks

- [ ] Search Console property verified, sitemap submitted and accepted (D11)
- [ ] Owner phone walk-through, including the 404 page (D12)
- [ ] Owner screen-reader spot check on `/`, a service page and a portfolio item (D12)
- [ ] Vercel Web Analytics shows the visits, and Speed Insights receives data (D12)

## Pre-launch security checklist (`tech-stack.md`, items Phase 15 deferred here)

- [ ] Least-privilege DB role in use on production (`rhm_app`), migrator credentials absent from the Vercel runtime, restore rehearsed. The protected branch stays accepted in writing on Neon Free (Phase 7 D10)
- [x] Dependabot active, with PRs targeting `develop`

## Gates

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass
- [x] The route table is unchanged (C2)
- [x] `pnpm test:e2e` passes locally and in CI; `preview-e2e` and `lighthouse` pass on the phase PR's preview
- [x] `pnpm test:db` passes (no schema change, C3)
- [ ] No secret appears in any log, report, artifact or transcript (C5)
- [x] The owner's logo sources are committed only in `assets/brand/source/`, never in `public/` (C8, amended 2026-10-17)
- [ ] Every plan box ticked
