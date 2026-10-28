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

## Turning the inquiry form on (Phase 20 release)

Do this once, with the Phase 20 release (Phase 20 spec, D11). Merging Phase 20 into `develop` needs none of it.

1. **Before merging the release PR**, the owner adds these to Vercel → Settings → Environment Variables → **Production** only:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`: the real widget for `redhat-media.vercel.app` (Phase 18 spec, D5);
   - `RESEND_API_KEY`: the Production sending-only key, from a Resend account **registered as `redhatmediang@gmail.com`**;
   - `EMAIL_FROM` = `RedHat Media <onboarding@resend.dev>`;
   - `INQUIRY_NOTIFICATION_EMAIL` = `redhatmediang@gmail.com`;
   - `INQUIRY_FORM_ENABLED` = `1`.

   Leave `INQUIRY_ACK_ENABLED` and `EMAIL_REDIRECT_TO` unset: `lib/env.ts` refuses both in production until the domain amendment.
2. Release as above. The production build fails in `lib/env.ts` if a variable is missing or a Turnstile test key is used; fix the variable and run the deploy hook again.
3. Check `/contact` on production shows the form.
4. **Test inquiry:** complete the form on production with a real address you can read. The success panel has no confirmation sentence (the acknowledgment is off). Within a minute the notification reaches `redhatmediang@gmail.com`. If the submit is refused, check `TURNSTILE_SECRET_KEY` first: the build can't tell a wrong secret from the right one, and the refusal isn't logged. Re-enter it and redeploy (Phase 20 release).
5. In Gmail, open it → ⋮ → **Show original**: SPF, DKIM and DMARC must all read `PASS`. Look at it on the web and on a phone: the layout, the "Service: Type" lines and the reply link.
6. In the Neon SQL Editor (`production`), check that the row has `emailSentAt` set, then delete it: `DELETE FROM "Inquiry" WHERE id = '<id>';`
7. Dispatch the monitor (Actions → monitor → Run workflow): `inquiry notifications` reads `none unsent`.

To turn the form off again, remove `INQUIRY_FORM_ENABLED` from Production and redeploy.

## Snapshot before a production migration

A copy of `production` taken just before the migration stands in for a protected branch (*Security baseline*).

1. console.neon.tech → project `redhat-media` → **Backup & Restore** → branch `production` → **Create snapshot**. Name it `before-<release PR number>`. Neon Free keeps one manual snapshot and **won't create another while one exists** (Phases 24–26 release, #67: `backup-58` blocked it). Deleting the old snapshot can't be undone, so use step 2 instead.
2. **If *Create snapshot* is greyed out or refused** (Phase 20 and #67 releases), make a branch instead: **Branches** → **New branch**, parent `production`, current data, named `before-<release PR number>`, **without a compute**. It uses no compute hours.
3. Then approve `migrate-production` (step 4 above).
4. Once the release has settled (the next monitor runs are green and nothing is rolled back), delete the `before-<n>` branch.

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
