# Implementation log — Phase 23 Homepage live data + Milestone 2 release

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

## Progress

- **2026-10-23** — Branch `feature/phase-23-homepage-live-data` created from `develop` at `9cbee43`. Owner answers A–J given; spec, plan and validation drafted for approval.

- **2026-10-24** — Owner approved the build. Spec review before code found two gaps, handled in the feature PR (plan 2.5): `e2e/home.spec.ts` selects every `main article` for the pillar cards, which would also catch portfolio cards, and its keyed-text check would reject database text; and `home.spec.ts` is not in the preview-e2e list, so the "three cards" case needs adding there.
- **2026-10-24** — Expand PR built on `feature/phase-23-retention-schema` (plan 1.1–1.6): `rhm_retention` in `lib/db/bootstrap.mts` and `scripts/db-bootstrap.mts` (`--role`), `TEST_RETENTION_DATABASE_URL` in `test-client.ts` and `ci.yml`, migration `20261024000000_inquiry_retention` (columns + D7 grants), `retention-grants.db.test.ts`, `tech-stack.md` and the rotation runbook. Checked locally on a throwaway Postgres 18 cluster with the CI `db` job's steps: bootstrap, `migrate deploy`, no drift, seed, `test:db` 9 files / 57 tests passed. Unit tests, typecheck, lint and format pass.

## Deviations from plan

- **`--role` takes any role**, not only `rhm_retention`: rotating one role alone is useful for every role, and the code is the same. A whole-branch run now creates and rotates all four.
- **`RETENTION_DATABASE_URL` is refused on Vercel** by `lib/env.ts` (beside `MIGRATOR_DATABASE_URL` and `BOOTSTRAP_DATABASE_URL`), so the validation item "not in Vercel" is enforced, not only checked. `tech-stack.md` says so.

## Issues and fixes

- **2026-10-24** — `prisma migrate diff --from-schema … --to-schema … --script` hung locally with no output (`CHECKPOINT_DISABLE=1` set). The migration's `ALTER TABLE` was written by hand in the shape `migrate dev` produces; the drift check (`migrate diff --from-config-datasource`, as in CI) reports no difference.
- **2026-10-24** — Docker's daemon was not running, so the local `db` run used the installed PostgreSQL 18 (`initdb` into the scratchpad, port 55432). CI stays on `postgres:17`.
