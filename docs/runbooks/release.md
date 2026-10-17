# Runbook — Releasing to production, and rolling back

Built in Phase 16 (spec D1–D5, `specs/2026-10-16-release/spec.md`). Production is the Vercel deployment of `main` at `https://redhat-media.vercel.app`, reading the Neon `production` branch.

## How a release flows (migrate, then deploy)

1. A release PR goes `develop` → `main`. `branch-check`, `ci`, `db` and `gitleaks` must be green. Merge it with a merge commit: `gh pr merge <n> --merge --repo eonerhime/redhat-media`.
2. The push to `main` runs `ci` and `db`, then `migrate-production`, which **waits for the owner's approval** (GitHub Environment `neon-production`).
3. **Before approving**, check whether the release carries a migration: `git diff --stat origin/main~1 origin/main -- prisma/migrations`. If it does, take a snapshot (below).
4. Approve: Actions → the `ci` run for the merge commit → **Review deployments** → tick `neon-production` → **Approve and deploy**.
5. The job runs `prisma migrate deploy`, seeds the approved portfolio content (`SEED_ALLOW_PRODUCTION=1`), then calls the deploy hook. Its log ends with `Deploy hook: PENDING`.
6. Vercel builds and promotes the production deployment. `vercel.json` turns off automatic deployments of `main`, so this hook is the only thing that starts one.
7. `production-checks` (in `preview-headers.yml`) runs on the Production deployment: headers, the smoke test and `e2e/release.spec.ts`. If it did not start, run it by hand: Actions → preview-headers → Run workflow → `main`.

If step 5 fails, no deploy is started, and production keeps serving its last good deployment. Fix forward with a new PR, or roll the database back (below).

**Migration rule:** the database changes a few minutes before the new code is live, so a migration must work with the code already in production. Add first, remove in a later release (expand, then contract).

## Snapshot before a production migration

Neon Free keeps **one** manual snapshot, and it stands in for a protected branch (*Security baseline*).

1. console.neon.tech → project `redhat-media` → **Backup & Restore** → branch `production` → **Create snapshot**.
2. Name it `before-<release PR number>`. Creating it replaces the previous one.
3. Then approve `migrate-production` (step 4 above).

The first release (Phase 16) skipped this: the branch was empty.

## Roll back the site

Vercel → project `redhat-media` → **Deployments** → filter Production → the previous Ready production deployment → **⋯** → **Instant Rollback** → Confirm. It takes seconds and needs no build. Hobby can roll back to the previous production deployment.

- Production then stays on that deployment until the next promotion. A later hook run promotes the newest `main` again, so fix `main` before the next release.
- For the Phase 16 release, the previous production deployment is the old static page.

## Roll back the database

Use a point-in-time restore: [restore.md](restore.md). Roll the site back first if the new code needs the new schema.

## Settings

| Name | Where | What |
| --- | --- | --- |
| `MIGRATOR_DATABASE_URL` | GitHub Environment `neon-production` | Production `rhm_migrator`, direct connection |
| `VERCEL_DEPLOY_HOOK_URL` | GitHub Environment `neon-production` | The deploy hook for `main` (Vercel → Settings → Git → Deploy Hooks) |
| Deployment branches | `neon-production` and `monitor` | `main` only |
| Required reviewer | `neon-production` | the owner |
| `git.deploymentEnabled.main` | `vercel.json` | `false` |

Rotation of both secrets: [secret-rotation.md](secret-rotation.md).
