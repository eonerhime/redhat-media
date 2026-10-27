# Implementation log — Phase 25 Guards, audit and session endpoint

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

## Progress

- **2026-10-27** — Branch `feature/phase-25-guards-audit` created from `develop` at `cff93e0`. Before the interview, MRU's `edit-session` route, `edit-mode.tsx`, `requireSession` and `logAuditEvent` were read. Owner answers A–I given; spec, plan and validation written. Owner approved the build ("build it").
- **2026-10-27** — Schema PR built on `feature/phase-25-audit-schema` (plan 1.1–1.5):
  - `AuditEvent` in `schema.prisma` (nullable `actorId`, no foreign key, two indexes; D4). Migration `20261027000000_audit_event`: the CREATE statements in Prisma's shape, plus `REVOKE UPDATE, DELETE … FROM rhm_app` and `REVOKE ALL … FROM rhm_readonly` (D6).
  - New `lib/db/audit-grants.db.test.ts`: `rhm_app` inserts and reads, but is refused UPDATE, DELETE and TRUNCATE; `rhm_readonly` and `rhm_retention` are refused SELECT.
  - `tech-stack.md`: the *Schema decisions* `AuditEvent` row and the least-privilege row. `README.md` §5: the model as built.
  - Checked locally on a throwaway Postgres 18 cluster with the CI `db` job's steps (bootstrap, `migrate deploy`, no drift, seed, `test:db`: 13 files / 91 tests passed). Typecheck, lint and format pass. `prisma migrate dev` applied `…_audit_event` to Neon `dev`.

- **2026-10-27** — Schema PR #63 merged by the owner; `migrate-preview` green (run 40492187291). `develop` fast-forwarded into `feature/phase-25-guards-audit` (plan 1.6).
- **2026-10-27** — Feature built (plan 2–7, 8.1–8.3, 9.1–9.2):
  - Guard: `lib/auth/guard-core.ts` (the decision, `createRequireRole()` with an injected session reader, `guardResponse()`), `lib/auth/guards.ts` (server-only `requireRole()` wired to the request), `hasMinRole()` in `roles.ts`, `auth.forbidden` with `reason` and `action` in `security-log.ts`.
  - Session: `lib/auth/staff-session.ts` (`toStaffSession()`, now with `sessionCreatedAt`, and `hasSessionCookie()`); `session.ts` gains `readStaffSession(headers)`, which `getStaffSession()`, the guard and the endpoint share.
  - Audit: `lib/audit/audit.ts` (`audit()`, `auditBestEffort()`, `checkAuditEvent()`). The lockout hooks write `auth.lockout` (password and 2FA code) and `auth.2fa_enabled`; `seedAdmin()` and `resetStaffPassword()` write `auth.admin_seeded` and `auth.password_reset` in their transaction.
  - Endpoint: `lib/auth/session-endpoint.ts` and `app/api/cms/session/route.ts`; `StaffLink` reads it. `e2e/admin.spec.ts`: the endpoint is a 404 with the CMS off; with it on, a visitor gets `{ role: null, authenticated: false }` and the home page makes no `/api/cms` or `/api/auth` request; the full flow checks the icon read the endpoint.
  - Helpers: `lib/auth/testing/fakes.ts` and `auth-kit.ts`; ESLint `no-restricted-imports` keeps them out of everything but tests (`lint-rules.test.ts`). `auth.db.test.ts` moved onto the kit with its tests unchanged.
  - Check: `lib/auth/public-mutations.ts`, `guard-coverage.ts`, `guard-coverage.test.ts` (fixtures plus the repo scan, and a stale-entry check on the allowlist).
  - Constitution: `tech-stack.md` rule 5, the lockout row, the two *Authorization & application* rows and *In-place CMS* 1; the roadmap *Built* note and the owner's `---` divider.
  - Local results: typecheck, lint, format and `pnpm test` (50 files, 1,672 tests) pass. The CI `db` job's steps on a throwaway Postgres 18 cluster (bootstrap, `migrate deploy`, no drift, seed twice, `test:db`): 16 files, 116 tests pass. `next build` passes with the CMS off and on. The route tables match except the `/admin` pages (○ off, ◐ on, as in Phase 24); `/api/cms/session` is ƒ in both (C2).

- **2026-10-27** — PR #64 opened. Red-CI proof (plan 8.4): throwaway commit `e0744a3` added `app/(public)/guard-proof/actions.ts`, a `"use server"` module whose `unguardedProof()` skips the guard. The PR's `ci` job failed at `pnpm test` (run [40498102482](https://github.com/eonerhime/redhat-media/actions/runs/40498102482)) with `app/(public)/guard-proof/actions.ts:5 unguardedProof: server action does not open with await requireRole(...)`. `db` and `gitleaks` stayed green. The commit was then dropped (branch reset to `9ca0997` and force-pushed with lease).

## Deviations from plan

- **`lib/audit/audit.ts` does not import `server-only`** (plan 4.1). The owner scripts call it under plain Node, where that import throws. It has no secret and no env access, and takes its client as an argument, like `staff-admin.ts`.
- **The 2FA-code lockout is audited, but not through a plugin hook** (plan 4.4, D7). The `twoFactor` plugin locks inside its endpoint and calls nothing. The after hook on a failed `/two-factor/verify-*` therefore reads the user from the signed `two_factor` challenge cookie and checks their `twoFactor` row: a spent count and a lock in force mean this request locked it. A refusal while already locked (`ACCOUNT_TEMPORARILY_LOCKED`) is skipped. The lock also gets an `auth.lockout` security-log line now, as the password lock had. Known limit: two wrong codes at exactly the same moment could write the event twice. That is a duplicate, never a miss.
- **The guard is split into `guard-core.ts` and `guards.ts`** (plan 3.1), so unit and database tests build it with their own session reader without `server-only` or `next/headers`. A 401 carries `reason: "signed-out"` so the result type is uniform. `requireRole()` takes an optional `action` name, which the D12 log line needs.
- **The password lock's event has `diff: { via: "password" }`**, the counterpart of the spec's `{ via: "2fa" }`, so the two locks are told apart.
- **The CI check also scans `components/`** (D11 named `app/` and `lib/`). A `"use server"` there would be just as unguarded.
- **`/api/cms/session` calls `connection()`** instead of exporting `dynamic`, which `cacheComponents` does not allow. The route is ƒ in the build either way.
- **The endpoint's database test runs its core, `cmsSessionResponse()`, with the test Better Auth instance** (plan 7.2), because the route builds the runtime instance from env. The route itself is three lines, and e2e calls it on the preview.
- **`createStaffUser()` now takes only the `user` delegate**, so `seedAdmin()` can call it inside a transaction. `resetStaffPassword()` moved from a batch to an interactive transaction so that `audit()` runs inside it.
- **`createAuthKit()` takes an `ipOffset`.** Four database test files now sign in, and they share the per-IP rate-limit table, so each starts at a different address in the documentation ranges.

## Issues and fixes

- `lib/auth/lint-rules.test.ts` timed out once (60 s) in the first full `pnpm test` run, while ESLint cold-started under full parallel load. It passed alone in 9 s and in every full run after it. It is unchanged in behaviour by this phase; no fix needed.
