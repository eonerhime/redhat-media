# Implementation log — Phase 23 Homepage live data + Milestone 2 release

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

## Progress

- **2026-10-23** — Branch `feature/phase-23-homepage-live-data` created from `develop` at `9cbee43`. Owner answers A–J given; spec, plan and validation drafted for approval.

- **2026-10-24** — Owner approved the build. Spec review before code found two gaps, handled in the feature PR (plan 2.5): `e2e/home.spec.ts` selects every `main article` for the pillar cards, which would also catch portfolio cards, and its keyed-text check would reject database text; and `home.spec.ts` is not in the preview-e2e list, so the "three cards" case needs adding there.
- **2026-10-24** — Expand PR built on `feature/phase-23-retention-schema` (plan 1.1–1.6): `rhm_retention` in `lib/db/bootstrap.mts` and `scripts/db-bootstrap.mts` (`--role`), `TEST_RETENTION_DATABASE_URL` in `test-client.ts` and `ci.yml`, migration `20261024000000_inquiry_retention` (columns + D7 grants), `retention-grants.db.test.ts`, `tech-stack.md` and the rotation runbook. Checked locally on a throwaway Postgres 18 cluster with the CI `db` job's steps: bootstrap, `migrate deploy`, no drift, seed, `test:db` 9 files / 57 tests passed. Unit tests, typecheck, lint and format pass.
- **2026-10-24** — Expand PR #56 opened.
- **2026-10-24** — Feature work on `feature/phase-23-homepage-live-data` (stacked on the expand commit until #56 merges):
  - Homepage (plan 2.1–2.5): `featuredCards()` in `read-core.ts` with unit tests; `FeaturedWork` renders up to three `PortfolioCard`s (h3) from `getPublishedPortfolio()`, falling back to the text and link. Phase 3 spec D5 got its dated note. `home.spec.ts` scopes the pillar test to its region, accepts card text in the keyed-text check, and gains two featured-work cases. It now uses the bypass-aware `test` and is in the preview-e2e list.
  - Route table (C2): the no-DB build differs from develop's CI build only in `/`'s cache lifetime (`○`, 1m/1h, because a failed read is cached for minutes, as on `/services/photography`). With a database it is `○` 1h/1d. No mode changed.
  - e2e: the no-DB build passed the full suite (`--workers=1`, Edge, `E2E_PORTFOLIO_STATE=unavailable`, 411 passed, 77 skipped). A build against Neon `dev` (seeded: SportsPred, AfroJamz, toutMessages featured) passed home, a11y, shell and portfolio (236 passed, 3 skipped), then home and a11y again after the copy change (45 passed). Screenshots at 360px and 1440px: one or three cards to a row, no horizontal scroll.
  - Retention (plan 3.1–3.6): `lib/retention/core.ts` (fixed, parameterised SQL like `monitor-core.ts`; the cut-offs are computed in SQL from `now` as UTC wall time, so the session TimeZone cannot shift them), `retention.db.test.ts`, `scripts/retention.mts`, `.github/workflows/retention.yml`, the *Retention job* runbook section, `tech-stack.md` rows, and roadmap open question 9 (that hunk staged alone with `git apply --cached`). Local run: the DB tests pass as `rhm_retention`, and the script prints `anonymised: 0, purged: 0`, fails on a test alert, and prints only `error 28P01` for a bad password.
- **2026-10-24** — Security checklist (plan 4.1, 4.2): `/security-review` over `218d02c..HEAD` reported no HIGH or MEDIUM findings. Two items were considered and dropped as excluded or low impact: acknowledgments to an address the visitor does not own (already rate-limited per address, and carrying only fixed labels), and a raw Prisma error in the private Vercel runtime log. Every checklist item is recorded in `validation.md`. Only "Alerting tested" stays open, until the retention test alert (plan 6.5).
- **2026-10-25** — Plan 1.7, 1.8: `rhm_retention` created on Neon `dev` and `preview` (`--role rhm_retention`, owner URL from `neon connection-string`; `neon roles list` shows it on both), and the `.env.neon-*.local` files deleted. `migrate dev` on `dev` applied `20261024000000_inquiry_retention` (and the still-pending `20261020180000_readonly_inquiry_monitor`). #56 merged as `5908385`; `migrate-preview` green. `develop` merged into the feature branch.
- **2026-10-25** — Feature PR #57: on the first run, `preview-e2e` and `lighthouse` failed on pages this PR does not touch (see Issues). A rerun of the failed jobs passed: `/` 97 and `/portfolio/sportspred` 96. The owner checked `/` on the preview, and #57 was merged as `25892e3` (plan 5.1, 5.2).
- **2026-10-25** — Release (plan 6.1–6.4, 6.6):
  - 6.1: `rhm_retention` was created on production. The GitHub environment `retention` was created with deployment branches limited to `main`, and `RETENTION_DATABASE_URL` was set there from the bootstrap file, without being displayed. The file was then deleted. The secret is in neither the repository secrets nor Vercel (`vercel env ls`).
  - 6.2: release PR #58. Neon snapshot `before-58` (`snap-noisy-sound-zajeph8b`) was taken at 20:00:58Z, before the merge (`8501c1a`). After the owner's approval, `migrate-production` applied `20261024000000_inquiry_retention` and re-seeded (9 portfolio items updated).
  - 6.3: production deploy of `8501c1a` Ready at 20:12Z. production-checks green. `home.spec.ts` against production (Edge, `PW_BASE_URL`): 7 passed.
  - 6.4: test inquiry `cmvoam6ct000208i3e4ak1qru`, created 20:41:21.581Z, `emailSentAt` 20:41:21.914Z, `ackSentAt` NULL (acknowledgment off), `closedAt` and `anonymisedAt` NULL. Gmail received the notification at 20:41:22Z with SPF, DKIM (`resend.dev`, `amazonses.com`) and DMARC passing. The owner deleted the row in the Neon SQL Editor, and dispatched monitor run 40232454175 was green, including `inquiry notifications: none unsent`.
  - 6.6: PageSpeed Insights mobile on `/`: 98, 97 and 97 (median 97). LCP 2.3–2.6 s, TBT 20–30 ms, CLS 0. A further run scored 99, with no run warnings and no errored performance audit.
- **2026-10-25** — Retention (plan 6.5, partial):
  - The owner widened the Gmail forward filter to `("Run failed: monitor" OR "Run failed: retention")`.
  - Dispatched run 40236224879 was green and printed only `anonymised: 0, purged: 0`.
  - The `test_alert` dispatch, run 40236289742, did the real run, then failed with `TEST ALERT — not an incident`. The failure email reached the owner's mailbox and `redhatmediang@gmail.com`.
  - Neither log has personal data. The only `@` lines are package names from `pnpm install`.
  - The first scheduled run (2026-10-26, 03:41 UTC) is still to be checked.
- **2026-10-25** — D14 (plan 6.7): the Resend region is `us-east-1`, recorded in `spec.md`. The privacy notice already matches it. The owner deleted the Neon branch `before-45` (`br-noisy-fire-zapg5293`) at 22:07:58Z, which left only `production`, `preview` and `dev`. Before that, at 21:32:01Z, the `before-58` snapshot was deleted by mistake (see Issues).

## Deviations from plan

- **`--role` takes any role**, not only `rhm_retention`: rotating one role alone is useful for every role, and the code is the same. A whole-branch run now creates and rotates all four.
- **Body copy with cards (owner, 2026-10-24):** "will appear here" is true only without cards, so a new key `home.work.bodyLive` ("Selected projects from across photography, video, marketing and software.") shows when cards do. Spec D1 has the dated note.
- **The Gmail forward filter** matches `Run failed: monitor` only. The runbook gives the widened filter; changing it is the owner's.
- **`RETENTION_DATABASE_URL` is refused on Vercel** by `lib/env.ts` (beside `MIGRATOR_DATABASE_URL` and `BOOTSTRAP_DATABASE_URL`), so the validation item "not in Vercel" is enforced, not only checked. `tech-stack.md` says so.

## Issues and fixes

- **2026-10-24** — `prisma migrate diff --from-schema … --to-schema … --script` hung locally with no output (`CHECKPOINT_DISABLE=1` set). The migration's `ALTER TABLE` was written by hand in the shape `migrate dev` produces; the drift check (`migrate diff --from-config-datasource`, as in CI) reports no difference.
- **2026-10-24** — Docker's daemon was not running, so the local `db` run used the installed PostgreSQL 18 (`initdb` into the scratchpad, port 55432). CI stays on `postgres:17`.
- **2026-10-25** — Flaky first run on #57:
  - `portfolio-modal.spec.ts` "its text meets its contrast ratios" sampled 0 text elements; it expects more than 5. This was probably measured while the dialog was still rising in.
  - Lighthouse scored `/portfolio/sportspred` at 0.83, probably a cold first load of the new preview.
  - Neither file or page changed in this PR, and both passed on the rerun. If the modal's contrast case fails again, wait for the opening transition to end before sampling, as the 360px case does.
- **2026-10-25** — The auto-mode permission classifier blocked the agent from reading production `Inquiry` rows, even in a read-only transaction. The owner ran the check and the delete in the Neon SQL Editor, as `release.md` says.
- **2026-10-25** — The `before-58` snapshot (`snap-noisy-sound-zajeph8b`) was deleted at 21:32:01Z, when `before-45` was the one meant to go. Neon's operation log shows a `delete_timeline` and no `delete_branch`, and `neon snapshots list` was empty. `before-45` was then deleted at 22:07:58Z. There was no harm: the migration only adds things, every post-release check was green, and Neon's 6-hour restore window still covered the time before the merge. So production has no manual snapshot until the next release takes one. Snapshots are in **Backup & Restore** and branches in **Branches**; check the name before deleting.
