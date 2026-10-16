# Runbook — Monitoring and alerts

Built in Phase 15 (spec D7, `specs/2026-10-16-launch-readiness/spec.md`). The project is on Vercel **Hobby** and Neon **Free**. Neither can alert on errors, connections or query volume, so the monitor runs on GitHub Actions.

## What runs

`.github/workflows/monitor.yml` runs `scripts/monitor.mts`:

- **hourly**, at minute 17 (`schedule`);
- **on demand** (Actions → monitor → Run workflow), with an optional `test_alert`;
- **on the `test-alert` PR label** (see *Test alert*).

GitHub runs `schedule` and `workflow_dispatch` **only from `main`**, so the hourly run starts at the Phase 16 release.

| Check | Fails when | First thing to look at |
| --- | --- | --- |
| `GET <page>` for each template and `/sitemap.xml` | not 200 | Vercel → Deployments: is the latest production deployment Ready? Then Vercel → Logs (Hobby keeps 1 hour). |
| `GET /rhm-monitor-missing` | not 404 | Routing or `app/not-found.tsx` changed. |
| `portfolio listing` | the `/portfolio` listing is not in its `ready` state | The site cannot read Neon. Check the Neon console for the compute and whether the project is suspended, then the `DATABASE_URL` on Vercel. |
| `database reachable` | `rhm_readonly` cannot connect | Neon status page and console. A wrong or rotated `MONITOR_DATABASE_URL` also fails here. |
| `connection saturation` | ≥ 80% of the usable connections in use (`max_connections` minus the reserved ones; 97 usable on 0.25 CU) | A connection leak or a flood. Look at the Vercel Firewall traffic view; consider Attack Challenge Mode ([firewall.md](firewall.md)). |
| `query volume` | more than 60 transactions a minute over the run's 60-second sample | Cached pages barely reach the database (6 a minute measured under e2e load), so a high rate means something is hitting uncached paths. Same steps as above. A compute that started less than 5 minutes ago is not sampled. |
| `test alert` | always, when asked for | Not an incident. |

The log prints check names, states and numbers only. The repository is public, so anyone can read its Actions logs.

## Where alerts go

- A failed run makes GitHub email the account that last changed the workflow's `cron` line, which is the owner's.
- The owner keeps GitHub → Settings → Notifications → **Actions** set to **Email**, with "Only notify for failed workflows".
- A **Gmail filter** in the owner's mailbox forwards those emails to `redhatmediang@gmail.com`:
  - From: `notifications@github.com`
  - Subject: `Run failed: monitor`
  - Action: forward to `redhatmediang@gmail.com`
- **Neon** emails usage warnings on Free (storage, data transfer, compute) at 80% and 100%, per project. They go to the Neon account's email.
- **Vercel** emails deployment failures. They go to the Vercel account's email (Account Settings → Notifications).

## Test alert

- **Before Phase 16:** on an open PR, add the label `test-alert`. The `monitor` job runs the real checks against `MONITOR_BASE_URL` (develop's preview) and the Neon preview branch. It then fails with "TEST ALERT — not an incident", and the email arrives within a few minutes. Remove the label afterwards. A label run shows a red `monitor` check on the PR; it is not a required check.
- **From Phase 16:** Actions → monitor → Run workflow → tick `test_alert` → Run.

## Settings

| Name | Kind | Value |
| --- | --- | --- |
| `MONITOR_BASE_URL` | Repository variable | develop's preview URL in Phase 15; the production URL from Phase 16 |
| `MONITOR_DATABASE_URL` | Secret in the GitHub Environment `monitor` | `rhm_readonly`, **direct** (non-pooled) connection, `sslmode=require`: the preview branch in Phase 15, production from Phase 16 |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Repository secret (existing) | Lets the monitor past preview protection. Sent only to `MONITOR_BASE_URL`'s origin. |

The thresholds live in `lib/monitor/monitor-core.ts`, so changing one goes through a reviewed PR. Phase 16 recalibrates the query-volume limit on production.

## Keep it running

- GitHub **disables scheduled workflows after 60 days with no repository activity**. If that happens: Actions → monitor → "Enable workflow". A disabled monitor sends no email, so check the Actions tab at the monthly upkeep (Phase 35).
- The hourly run wakes the Neon compute for about 5 minutes, which fits the Free plan's compute allowance.
- If `MONITOR_DATABASE_URL` is rotated ([secret-rotation.md](secret-rotation.md)), run the workflow once by hand to confirm it.
