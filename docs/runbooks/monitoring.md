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
| `inquiry notifications` (Phase 20) | an inquiry saved between 15 minutes and 24 hours ago still has no team notification (`emailSentAt` NULL). It repeats hourly until the row is handled or 24 hours pass | A lead nobody was told about: *Unsent inquiry notification* below. A detail of `error 42501` means `rhm_readonly` lacks its column grant (migration `20261020180000_readonly_inquiry_monitor`). |
| `test alert` | always, when asked for | Not an incident. |

The log prints check names, states and numbers only. The repository is public, so anyone can read its Actions logs.

## Unsent inquiry notification

The send runs after the visitor's success message (Phase 20 spec, D3), so a failure loses no inquiry, but nobody has been told about it.

1. **Find the inquiry.** console.neon.tech → project `redhat-media` → SQL Editor → branch `production`:

   ```sql
   SELECT id, "createdAt", "clientName", email, phone
   FROM "Inquiry"
   WHERE "emailSentAt" IS NULL AND "createdAt" > now() - interval '25 hours'
   ORDER BY "createdAt";
   ```
2. **Contact the client** by email or phone. This comes first: the lead is waiting.
3. **Find the cause.** Resend → Emails and Logs (a revoked or wrong key, the daily or monthly quota, or the account's email no longer being the team inbox while sending from `onboarding@resend.dev`). Vercel → Logs shows `[email] team notification failed` with the inquiry id and an error name, but Hobby keeps logs for 1 hour only.
4. **Clear the alert** once the client is handled, by recording that the team has it:

   ```sql
   UPDATE "Inquiry" SET "emailSentAt" = now() WHERE id = '<id>' AND "emailSentAt" IS NULL;
   ```

   Left alone, the check stops reporting a row 24 hours after it was saved.

## Retention job

Built in Phase 23 (spec D5–D10, `specs/2026-10-23-homepage-live-data/spec.md`). `.github/workflows/retention.yml` runs `scripts/retention.mts` against production as `rhm_retention`:

- **daily** at 03:41 UTC (`schedule`, clear of the monitor's minute 17);
- **on demand** (Actions → retention → Run workflow → branch `main`), with an optional `test_alert`.

It does what the privacy notice promises (`privacy.retention.body`):

- **Anonymise:** every inquiry with `status` CLOSED, `closedAt` more than 24 months ago and no `anonymisedAt` gets `clientName`, `email`, `phone` and `projectNotes` overwritten with `redacted`, `companyName` set to NULL, and `anonymisedAt` set. Scope, budget, timeline, status, consent and the dates stay, for lead statistics. A row is never anonymised twice.
- **Purge:** every `RateLimitHit` row whose `windowEnd` is more than 30 days ago is deleted.

The log prints one line, `anonymised: N, purged: M`, and never row data. `rhm_retention` cannot read any personal column, so it could not print one if it tried (D7). Until the Phase 32 inbox closes inquiries (it sets `closedAt`), `anonymised` stays 0, which is correct.

| Fails with | Meaning | First thing to look at |
| --- | --- | --- |
| `FAIL retention: error 28P01` | Wrong password | `RETENTION_DATABASE_URL` in the `retention` environment, or a rotation that missed it ([secret-rotation.md](secret-rotation.md)). |
| `FAIL retention: error 42501` | Missing grant | The `…_inquiry_retention` migration's grants, or a later migration that changed a column it uses. |
| `FAIL retention: error` (no code) or a timeout | Neon unreachable | Neon status page and console. |
| `FAIL test alert: TEST ALERT — not an incident` | The dispatch had `test_alert` ticked | Not an incident. |

A failed run emails the owner like the monitor's, with the subject `Run failed: retention` (see *Where alerts go*). A missed day does no harm: the next run catches up, because both statements work from the date of the run.

## Where alerts go

- A failed run makes GitHub email the account that last changed the workflow's `cron` line, which is the owner's.
- The owner keeps GitHub → Settings → Notifications → **Actions** set to **Email**, with "Only notify for failed workflows".
- A **Gmail filter** in the owner's mailbox forwards those emails to `redhatmediang@gmail.com`:
  - From: `notifications@github.com`
  - Subject: `Run failed: monitor`. That phrase matches both forms GitHub sends: `[eonerhime/redhat-media] Run failed: monitor - …` (scheduled and dispatched runs) and `[eonerhime/redhat-media] PR run failed: monitor - …` (the old `test-alert` label). The first test alert, on 2026-10-16, arrived as the second form.
  - Action: forward to `redhatmediang@gmail.com`
  - From Phase 23 the retention job fails with `Run failed: retention`. The filter forwards it too only if its subject also matches that phrase, for example `Subject: ("Run failed: monitor" OR "Run failed: retention")`.
- **Neon** emails usage warnings on Free (storage, data transfer, compute) at 80% and 100%, per project. They go to the Neon account's email.
- **Vercel** emails deployment failures. They go to the Vercel account's email (Account Settings → Notifications).

## Test alert

Actions → monitor (or retention) → Run workflow → branch `main` → tick `test_alert` → Run workflow. The run does every real check (or the real retention run) against production, then fails with "TEST ALERT — not an incident", and the email arrives within a few minutes. (Phase 15 used a PR label instead, before the workflow was on `main`.)

## Settings

| Name | Kind | Value |
| --- | --- | --- |
| `MONITOR_BASE_URL` | Repository variable | `https://redhat-media.vercel.app` (production, from Phase 16; develop's preview in Phase 15) |
| `RETENTION_DATABASE_URL` (Phase 23) | Secret in the GitHub Environment `retention` | `rhm_retention`, **direct** connection, `sslmode=require`, production. The environment's deployment branches are limited to `main` |
| `MONITOR_DATABASE_URL` | Secret in the GitHub Environment `monitor` | `rhm_readonly`, **direct** (non-pooled) connection, `sslmode=require`: production from Phase 16 (the preview branch in Phase 15). The environment's deployment branches are limited to `main` |

The thresholds live in `lib/monitor/monitor-core.ts`, so changing one goes through a reviewed PR. Phase 16 confirmed the query-volume limit from a production sample: **3 transactions a minute** on 2026-10-19 (run 39262581542), below the preview baseline of 6, so the limit stays at 60, the floor (`specs/2026-10-16-release/implementation.md`).

A scheduled run wakes the compute itself, so it is usually younger than 5 minutes and not sampled. To take a sample, dispatch runs back to back until one reports a rate (each run keeps the compute awake for the next).

## Keep it running

- GitHub **disables scheduled workflows after 60 days with no repository activity**. If that happens: Actions → monitor (and Actions → retention) → "Enable workflow". A disabled monitor sends no email, so check the Actions tab at the monthly upkeep (Phase 35).
- The hourly run wakes the Neon compute for about 5 minutes, which fits the Free plan's compute allowance.
- If `MONITOR_DATABASE_URL` is rotated ([secret-rotation.md](secret-rotation.md)), run the workflow once by hand to confirm it.
