# Runbook — Monitoring and alerts

Built in Phase 15 (spec D7, `specs/2026-10-16-launch-readiness/spec.md`), pointed at production in Phase 16 (spec D8, `specs/2026-10-16-release/spec.md`). The project is on Vercel **Hobby** and Neon **Free**. Neither can alert on errors, connections or query volume, so the monitor runs on GitHub Actions.

## What runs

`.github/workflows/monitor.yml` runs `scripts/monitor.mts`:

- **hourly**, at minute 17 (`schedule`);
- **on demand** (Actions → monitor → Run workflow), with an optional `test_alert`.

GitHub runs `schedule` and `workflow_dispatch` **only from `main`**, so the hourly run started at the Phase 16 release. The `test-alert` PR label trigger of Phase 15 was removed then: the `monitor` environment is limited to `main`, so no PR branch can read the production credential.

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
  - Subject: `Run failed: monitor`. That phrase matches both forms GitHub sends: `[eonerhime/redhat-media] Run failed: monitor - …` (scheduled and dispatched runs) and `[eonerhime/redhat-media] PR run failed: monitor - …` (the old `test-alert` label). The first test alert, on 2026-10-16, arrived as the second form.
  - Action: forward to `redhatmediang@gmail.com`
- **Neon** emails usage warnings on Free (storage, data transfer, compute) at 80% and 100%, per project. They go to the Neon account's email.
- **Vercel** emails deployment failures. They go to the Vercel account's email (Account Settings → Notifications).

## Test alert

Actions → monitor → Run workflow → branch `main` → tick `test_alert` → Run workflow. The run does every real check against production, then fails with "TEST ALERT — not an incident", and the email arrives within a few minutes. (Phase 15 used a PR label instead, before the workflow was on `main`.)

## Settings

| Name | Kind | Value |
| --- | --- | --- |
| `MONITOR_BASE_URL` | Repository variable | `https://redhat-media.vercel.app` (production, from Phase 16; develop's preview in Phase 15) |
| `MONITOR_DATABASE_URL` | Secret in the GitHub Environment `monitor` | `rhm_readonly`, **direct** (non-pooled) connection, `sslmode=require`: production from Phase 16 (the preview branch in Phase 15). The environment's deployment branches are limited to `main` |

The thresholds live in `lib/monitor/monitor-core.ts`, so changing one goes through a reviewed PR. Phase 16 confirmed the query-volume limit from a production sample: **3 transactions a minute** on 2026-10-19 (run 39262581542), below the preview baseline of 6, so the limit stays at 60, the floor (`specs/2026-10-16-release/implementation.md`).

A scheduled run wakes the compute itself, so it is usually younger than 5 minutes and not sampled. To take a sample, dispatch runs back to back until one reports a rate (each run keeps the compute awake for the next).

## Keep it running

- GitHub **disables scheduled workflows after 60 days with no repository activity**. If that happens: Actions → monitor → "Enable workflow". A disabled monitor sends no email, so check the Actions tab at the monthly upkeep (Phase 35).
- The hourly run wakes the Neon compute for about 5 minutes, which fits the Free plan's compute allowance.
- If `MONITOR_DATABASE_URL` is rotated ([secret-rotation.md](secret-rotation.md)), run the workflow once by hand to confirm it.
