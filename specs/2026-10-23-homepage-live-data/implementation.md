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

## Deviations from plan

- **`--role` takes any role**, not only `rhm_retention`: rotating one role alone is useful for every role, and the code is the same. A whole-branch run now creates and rotates all four.
- **Body copy with cards (owner, 2026-10-24):** "will appear here" is true only without cards, so a new key `home.work.bodyLive` ("Selected projects from across photography, video, marketing and software.") shows when cards do. Spec D1 has the dated note.
- **The Gmail forward filter** matches `Run failed: monitor` only. The runbook gives the widened filter; changing it is the owner's.
- **`RETENTION_DATABASE_URL` is refused on Vercel** by `lib/env.ts` (beside `MIGRATOR_DATABASE_URL` and `BOOTSTRAP_DATABASE_URL`), so the validation item "not in Vercel" is enforced, not only checked. `tech-stack.md` says so.

## Issues and fixes

- **2026-10-24** — `prisma migrate diff --from-schema … --to-schema … --script` hung locally with no output (`CHECKPOINT_DISABLE=1` set). The migration's `ALTER TABLE` was written by hand in the shape `migrate dev` produces; the drift check (`migrate diff --from-config-datasource`, as in CI) reports no difference.
- **2026-10-24** — Docker's daemon was not running, so the local `db` run used the installed PostgreSQL 18 (`initdb` into the scratchpad, port 55432). CI stays on `postgres:17`.
