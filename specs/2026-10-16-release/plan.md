# Plan — Phase 16 Milestone 1 release

Scope, decisions (D1–D13) and constraints (C1–C8) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md). Owner steps are written out in full when they come up (C7).

## 0. Constitution first

- [x] 0.1 `specs/tech-stack.md`: Hosting row, the migrations, protected-branch, backups and Monitoring rows, Edge protection, *Environment variables* and the rotation row, per the owner's answers.
- [x] 0.2 `specs/roadmap.md`: Phase 16 outcomes placeholder, the Phase 31 create-only note (D1), open question 2 (owner answer A).
- [x] 0.3 `README.md` deployment section and the `CLAUDE.md` `db:seed` line (D1, D3).

## 1. Production database (before the release)

- [x] 1.1 `assertSeedTarget()` opt-in (`SEED_ALLOW_PRODUCTION=1`) with `seed-guard.test.ts` cases (D1, D13).
- [ ] 1.2 Confirm the production branch by endpoint ID and `neon roles list --branch production` (only `neondb_owner`). `neon connection-string production --role-name neondb_owner` (profile `e1rhyme`) writes the owner URL to `.env.neon-production-owner.local`; `db-bootstrap.mts --branch production` runs from it and writes `.env.neon-production.local`; roles listed again (D2, owner answer D).
- [ ] 1.3 Owner creates the GitHub Environment `neon-production`: deployment branch `main` only, owner as required reviewer. `MIGRATOR_DATABASE_URL` piped in from the file (D2, C5).
- [x] 1.4 `migrate-production` job in `ci.yml` (`push` gains `main`; needs `ci` and `db`; non-cancelling concurrency; migrate → seed → hook) (D2, D3).

## 2. Migrate, then deploy

- [x] 2.1 `vercel.json`: `git.deploymentEnabled.main = false` (D3).
- [ ] 2.2 Hook test on a throwaway branch with its own `deploymentEnabled: false` entry and hook: the hook deploys, and the deployment reports `deployment_status`. Branch, hook and entry removed afterwards. If it fails, amend D3 to the fallback before going on (D3).
- [ ] 2.3 Owner creates the production deploy hook for `main` (Settings → Git → Deploy Hooks); `VERCEL_DEPLOY_HOOK_URL` stored in `neon-production` without being displayed (D3, C5).

## 3. Production environment

- [ ] 3.1 Vercel Production: `DATABASE_URL` (pooled `rhm_app`), `RATE_LIMIT_SALT`, `NEXT_PUBLIC_SITE_URL`, piped from the file (D4, C5). `vercel env ls production` shows the names only.
- [ ] 3.2 `.env.neon-production.local` and `.env.neon-production-owner.local` deleted once every value is stored (the monitor's value is stored in 5.1 first); `secret-rotation.md` production entries (D4).
- [ ] 3.3 Dashboard check: production has no Deployment Protection; the project's production branch is `main` (D4).

## 4. Checks, runbooks and the phase PR

- [x] 4.1 `e2e/release.spec.ts` (`PW_RELEASE=1`) and the `production-checks` job in `preview-headers.yml` (deployment_status Production, plus `workflow_dispatch`) (D6, D13).
- [x] 4.2 `monitor.yml`: label trigger and bypass secret removed (D8).
- [ ] 4.3 Search Console: owner creates the URL-prefix property and downloads the HTML file; committed as `public/google<token>.html` (D11, owner answer F).
- [ ] 4.4 `docs/runbooks/release.md` (release steps, reviewer snapshot, rollback) and the `monitoring.md` and `firewall.md` updates (D3, D5, D8, D9).
- [ ] 4.5 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, `pnpm test:e2e --workers=1`; route table compared with develop's CI log (C2).
- [ ] 4.6 Phase PR into `develop`: `ci`, `db`, `gitleaks`, `preview-headers`, `preview-e2e` and `lighthouse` green; owner approves; merged with a merge commit.

## 5. Release

- [ ] 5.1 Owner sets `MONITOR_BASE_URL` to the production origin and limits the `monitor` environment to `main`; production `rhm_readonly` (direct) piped into `MONITOR_DATABASE_URL` (D8, C5).
- [ ] 5.2 Release PR `develop` → `main`: `branch-check`, `ci`, `db`, `gitleaks` green; every pre-release box in `validation.md` ticked; promoted as soon as the phase is done (owner answer G); merged with a merge commit (D5, C6).
- [ ] 5.3 Owner approves `migrate-production` (snapshot skipped: empty target, recorded). Migrate, seed and hook green; production deployment Ready; `index.html` gone from `main` (D2, D3, D5).
- [ ] 5.4 `production-checks` green (headers, smoke, `release.spec.ts`) (D6).

## 6. After go-live

- [ ] 6.1 Restore rehearsal: a branch after the seed (data matches) and a branch before `migrate-production` (no tables), timed, then both deleted; `docs/runbooks/restore.md` (D10).
- [ ] 6.2 securityheaders.com grade; PageSpeed Insights for the seven templates, no audit skipped (D7).
- [ ] 6.3 Owner: opengraph.xyz for the three pages; WhatsApp share of a portfolio link (D7).
- [ ] 6.4 Bot Protection stays on Log (owner answer E); recorded in `firewall.md` and `tech-stack.md` (D9).
- [ ] 6.5 Monitor: dispatched test alert reaches both inboxes; query rate sampled and the limit confirmed or changed; first scheduled run green (D8).
- [ ] 6.6 Search Console verified, sitemap submitted, `/` indexing requested (D11).
- [ ] 6.7 Owner phone walk-through with the 404, screen-reader spot check, and Analytics and Speed Insights receiving data (D12).
- [ ] 6.8 Dependabot shows as active and opens its PRs against `develop`.
- [ ] 6.9 Phase 14 share link revoked (D5).

## 7. Close

- [ ] 7.1 Close-out PR into `develop` with the post-release ticks, results and outcomes (roadmap Phase 16 row), then `develop` → `main` so `main` carries the final specs. Every `validation.md` box ticked.
