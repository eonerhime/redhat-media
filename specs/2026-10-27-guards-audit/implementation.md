# Implementation log — Phase 25 Guards, audit and session endpoint

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

## Progress

- **2026-10-27** — Branch `feature/phase-25-guards-audit` created from `develop` at `cff93e0`. Before the interview, MRU's `edit-session` route, `edit-mode.tsx`, `requireSession` and `logAuditEvent` were read. Owner answers A–I given; spec, plan and validation written. Owner approved the build ("build it").
- **2026-10-27** — Schema PR built on `feature/phase-25-audit-schema` (plan 1.1–1.5):
  - `AuditEvent` in `schema.prisma` (nullable `actorId`, no foreign key, two indexes; D4). Migration `20261027000000_audit_event`: the CREATE statements in Prisma's shape, plus `REVOKE UPDATE, DELETE … FROM rhm_app` and `REVOKE ALL … FROM rhm_readonly` (D6).
  - New `lib/db/audit-grants.db.test.ts`: `rhm_app` inserts and reads, but is refused UPDATE, DELETE and TRUNCATE; `rhm_readonly` and `rhm_retention` are refused SELECT.
  - `tech-stack.md`: the *Schema decisions* `AuditEvent` row and the least-privilege row. `README.md` §5: the model as built.
  - Checked locally on a throwaway Postgres 18 cluster with the CI `db` job's steps (bootstrap, `migrate deploy`, no drift, seed, `test:db`: 13 files / 91 tests passed). Typecheck, lint and format pass. `prisma migrate dev` applied `…_audit_event` to Neon `dev`.

## Deviations from plan

## Issues and fixes
