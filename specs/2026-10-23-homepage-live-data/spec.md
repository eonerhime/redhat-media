# Phase 23 — Homepage live data + Milestone 2 release

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 2, Phase 23
- **Branch:** `feature/phase-23-homepage-live-data` (from `develop` at `9cbee43`)
- **Started:** 2026-10-23
- **Status:** owner answers A–J given 2026-10-23; approved to build 2026-10-24 ("review the Phase 23 spec, then build it")

## What and why

Three things close Milestone 2:

1. **Homepage live data.** The homepage's *Featured work* section is still the Phase 3 text-and-link placeholder (Phase 3 spec, D5). It now shows the featured portfolio items from the database, so the `featured` flags that the seed sets (and that editors toggle from Phase 31) decide what the homepage shows.
2. **Retention job.** The privacy notice already promises: "Once it's closed, we anonymise it after 24 months. The hashed IP records used to stop abuse are deleted after 30 days." (`privacy.retention.body`). Nothing enforces that yet. A daily scheduled job now does, as the NDPA 2023 row of `tech-stack.md` requires.
3. **Milestone 2 release.** The pre-launch security checklist runs again (`tech-stack.md` → *Pre-launch security checklist*, "repeated at 23"). Then `develop` merges to `main`, and the roadmap's production checks follow.

## Constitution sections this phase relies on

- `mission.md` → *Guiding principles* 2 (the site is the proof) and 4 (no invented claims).
- `tech-stack.md`:
  - *Architectural rules* 1 (server-first), 8 (loading and error states), 10 (accessibility), 11 (performance budget), 13 (tagged cache);
  - *Database security & data protection*: least-privilege roles, CI-only migrations (expand, then contract), the Personal data (NDPA 2023) row, and Monitoring;
  - *Supply chain & secrets*: the rotation runbook;
  - *Pre-launch security checklist*.
- `roadmap.md` → Phase 23; Phase 31 (Featured toggle, `PORTFOLIO_TAG` refresh); Phase 32 (inbox, which closes inquiries); open questions 9 (Neon plan) and 10 (data protection).
- Phase 3 spec D5 (placeholder section), Phase 10 spec D2 and D4 (cached read, card), Phase 16 spec D1–D3 and D8 (migrate-then-deploy, monitor), Phase 17 spec D4 and the retention note (overwrite, don't null), Phase 18 spec answer C (24 months), Phase 20 spec D10 (monitor column grant), Phase 22 spec answer A (homepage cards keep full-page links).

## Scope

1. **Constitution first** (listed below).
2. **Expand PR** (D5–D7, D9): the `closedAt` and `anonymisedAt` columns, the `rhm_retention` role in `scripts/db-bootstrap.mts`, and its grants. It ships and is migrated before the feature PR (C3).
3. **Homepage featured work** (D1–D4).
4. **Retention job** (D5–D10): the core functions, the script, the `retention` workflow, and the runbook.
5. **Security checklist** (D12).
6. **Milestone 2 release and production checks** (D11, D13, D14).

## Constitution changes (in the PRs, before the code)

- **`tech-stack.md`:**
  - *Database security & data protection* → least-privilege roles: add `rhm_retention` (D7). Personal data row: the retention clock is `closedAt`; anonymising overwrites the personal fields and sets `anonymisedAt`; the job runs daily on GitHub Actions (D5, D6, D8). Monitoring row: the retention workflow alerts the same way as the monitor (D10).
  - *Supply chain & secrets* → rotation runbook: add the `rhm_retention` credential.
  - *Pre-launch security checklist*: no wording change; the run is recorded in this phase's `validation.md` (D12).
- **`roadmap.md`:** open question 9 gets the dated answer "stay on Free; revisit at Milestone 3" (D11). The Phase 23 row stands as written. The owner's uncommitted `---` edit is not part of this phase: stage only this phase's hunks (C6).
- **Phase 3 spec D5:** a dated note that Phase 23 replaced the placeholder with live cards.
- **`mission.md`:** no change.
- **Privacy notice copy:** no change. The job enforces what `privacy.retention.body` already says.

## Out of scope

- Closing inquiries (setting `status = CLOSED` and `closedAt`). That arrives with the Phase 32 inbox. Until then the job anonymises nothing, which is correct (D5).
- A hard age limit on inquiries that are never closed (owner answer B chose closed-only).
- Opening the portfolio modal from the homepage. The cards link to the full page (Phase 22 spec, owner answer A).
- Featured toggles in the UI (Phase 31). Featured flags change through the seed until then.
- An upgrade to Neon Launch (D11).
- The domain amendment (open question 2).
- New dependencies. The job uses `pg`, already used by `scripts/monitor.mts`.

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **What the section shows:** published items with `featured = true`, in portfolio order (`sortOrder`, then title), at most **3**, rendered with the existing `PortfolioCard`. The heading, body and "See the portfolio" link stay. Selection is a pure function next to `relatedTo()` in `lib/portfolio/read-core.ts`. | One card component across the site. Three cards fill one row at 1440px. Today exactly three items are featured. | Owner answer A |
| D2 | **Fallback:** when no item is featured, or the read fails (`ok: false`), the section renders today's text and link with no cards and no error message. The homepage never shows an unavailable state. | The homepage is the front door. The link still leads to `/portfolio`, which has its own unavailable state. | Owner answer A |
| D3 | **Data path:** the homepage calls the existing `getPublishedPortfolio()` (tagged `PORTFOLIO_TAG`, cached for hours), so Phase 31's refresh updates the homepage with no extra wiring. There is no new query. `/` stays prerendered (C2). | Rule 13. The same read already serves `/portfolio` and the service pages. | Phase 10 spec D2 |
| D4 | **Card links** go to the full page `/portfolio/[slug]`. The `@modal` slot lives under `/portfolio`, so nothing on `/` is intercepted. | Already decided. | Phase 22 spec, owner answer A |
| D5 | **Retention clock:** a new nullable `Inquiry.closedAt` column. The job anonymises rows with `status = 'CLOSED'`, `closedAt` more than 24 months ago, and `anonymisedAt` null. Phase 32 sets `closedAt` when an inquiry is closed and clears it if one is reopened. A note to that effect goes into the Phase 32 row's spec when it is written. | `updatedAt` would restart the clock on any edit. `closedAt` makes the promise exact. | Owner answer B |
| D6 | **Anonymising** overwrites `clientName`, `email`, `phone` and `projectNotes` with `"redacted"`, sets `companyName` to null, and sets a new nullable `anonymisedAt` column. Services, project types, budget, timeline, status, consent and the dates are kept for lead statistics. One idempotent `UPDATE` per run; a row already anonymised is never touched again. | The Phase 17 note: overwrite, so required columns stay required. Statistics hold no personal data. | Owner answer C; Phase 17 spec |
| D7 | **`rhm_retention` role,** created per branch by `scripts/db-bootstrap.mts` (a new `--role rhm_retention` option creates or rotates only that role, so the other roles' passwords are left alone). Its grants are column-level and written in a hand-written migration:<br>• `Inquiry`: `SELECT ("id", "status", "closedAt", "anonymisedAt")` and `UPDATE ("clientName", "companyName", "email", "phone", "projectNotes", "anonymisedAt")`;<br>• `RateLimitHit`: `SELECT ("windowEnd")` and `DELETE`.<br>No default privileges, no other table, no DDL. It can never read client details, only overwrite them. | Least privilege. The production `rhm_app` credential stays only in Vercel. | Owner answer F |
| D8 | **Scheduler:** a GitHub Actions workflow `retention.yml`, on `schedule` once a day at **03:41 UTC** (clear of the monitor's minute 17) and on `workflow_dispatch` with a `test_alert` input, the same way the monitor works. It runs `scripts/retention.mts` (Node, `pg`, direct connection) with `RETENTION_DATABASE_URL` from a `retention` GitHub environment limited to `main`. | A failed run emails the owner, which Vercel Hobby cannot do. Same pattern and credential handling as the monitor. | Owner answer E; Phase 15 spec D7 |
| D9 | **Rate-limit purge:** delete `RateLimitHit` rows whose `windowEnd` is more than 30 days ago. The job prints only counts (`anonymised: N, purged: M`), never row data. | The privacy notice's 30 days. The longest window today is 1 day. | `privacy.retention.body` |
| D10 | **Alerting:** a failed run (connection, SQL, or the `test_alert` input) fails the workflow, and GitHub emails the owner, as with `Run failed: monitor`. `docs/runbooks/monitoring.md` gets a *Retention job* section: what it does, how to dispatch it, the test alert, and the 60-day inactivity rule that disables schedules. | Same alert path the owner already filters on. | Owner answer H |
| D11 | **Neon plan:** stay on Free (6-hour restore window). Revisit at Milestone 3, when staff edits live only in the database. | Every inquiry is also emailed, so a lost database doesn't lose leads. | Owner answer D; open question 9 |
| D12 | **Security checklist:** run `/security-review` over all of Milestone 2, from the Milestone 1 release (`218d02c`) to this phase's head. Each checklist item is recorded in `validation.md` as done (with evidence), N/A until a named phase, or deferred to a named phase. | The checklist says "repeated at 23". Milestone 2 added the first public write path. | Owner answer I |
| D13 | **Production test inquiry:** after the release, submit one inquiry on production, confirm the row, `emailSentAt` and the Gmail notification, then delete the row and confirm the next monitor run is green. This is the same procedure as Phase 20. | The roadmap's "Done when". No test lead is left in the Phase 32 inbox. | Owner answer G |
| D14 | **Carry-overs** closed at this release: delete the Neon branch `before-45` (`br-noisy-fire-zapg5293`) after this release's own pre-migration branch exists, and confirm the Resend sending region, recording it here. If the region changes what the privacy notice should say, that becomes a follow-up amendment. **The owner confirms the delete again just before it runs.** | `before-45` has been stale since the Phase 20 release. The region was never confirmed. | Owner answer J (the owner asked for a suggestion; Claude suggested both) |

## Constraints

- **C1 — No invented claims.** The section shows only what the database holds. With nothing featured, it falls back to the text (mission principle 4).
- **C2 — Route modes.** `/` stays static (`○`) in the build's route table, and every other route keeps its mode. If a mode changes, stop and ask the owner.
- **C3 — Expand first.** The columns and grants ship in their own PR, merged and migrated on `preview` before the feature PR, because a schema change fails preview-e2e until it is migrated. `rhm_retention` must exist on a branch **before** the grant migration reaches it: on `preview` before the expand PR merges, and on `production` before the release's migrate-production runs. CI's throwaway Postgres gets the role from the same bootstrap script in the same PR.
- **C4 — Personal data stays unread.** Neither the job nor its logs read or print any personal field. The grants enforce this, and a database test proves it (D7).
- **C5 — Performance.** The cards sit below the fold, and their images load lazily through `<MediaImage>`. `/` keeps Lighthouse ≥ 90 on mobile.
- **C6 — The owner's roadmap edit.** The owner's uncommitted `---` in `roadmap.md` is never staged. This phase's own `roadmap.md` hunk is staged alone (`git apply --cached` with a patch of just that hunk).
- **C7 — Owner-only steps.** Creating `rhm_retention` on `preview` and `production` (owner credential), the `retention` environment secret, merges into `main`, and approving migrate-production are the owner's. Each is listed in the plan with the exact command.

## Owner answers (2026-10-23)

- **A. Featured section:** up to 3 cards, falling back to today's text and link.
- **B. Retention clock:** add `closedAt`.
- **C. Anonymising:** keep scope and dates; overwrite the personal fields; add `anonymisedAt`.
- **D. Neon plan:** stay on Free.
- **E. Scheduler:** GitHub Actions, daily.
- **F. Credential:** a new `rhm_retention` role.
- **G. Production test row:** delete it after the checks.
- **H. Proving the schedule:** one dispatched run, one scheduled run, and a test alert.
- **I. Security review:** all of Milestone 2.
- **J. Carry-overs:** the owner asked "what do you suggest, both?". Claude suggested both, with the delete confirmed again just before it runs.
