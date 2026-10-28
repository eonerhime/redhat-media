# Plan — Phase 25 Guards, audit and session endpoint

Scope, decisions (D1–D12) and constraints (C1–C5) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md). Steps marked **(owner)** are the owner's (C4).

## 1. Schema PR (`feature/phase-25-audit-schema`, merged first; C1)

- [x] 1.1 `tech-stack.md`: the *Schema decisions* `AuditEvent` row and the least-privilege row (D4, D6). `README.md` §5: the `AuditEvent` model as built.
- [x] 1.2 `schema.prisma`: the `AuditEvent` model with both indexes (D4).
- [x] 1.3 Migration `…_audit_event`: the `prisma migrate diff` output, plus the hand-written `REVOKE UPDATE, DELETE ON "AuditEvent" FROM rhm_app` and `REVOKE ALL ON "AuditEvent" FROM rhm_readonly` (D6).
- [x] 1.4 `lib/db/audit-grants.db.test.ts`: `rhm_app` can insert and select but not update or delete; `rhm_readonly` and `rhm_retention` cannot select.
- [x] 1.5 Locally: the CI `db` job's steps on a throwaway Postgres (bootstrap, `migrate deploy`, no drift, seed, `test:db`). `pnpm db:migrate` on Neon `dev`.
- [x] 1.6 PR into `develop`; **(owner)** merges; `migrate-preview` green. Merge `develop` into the feature branch.

## 2. Constitution (feature PR)

- [x] 2.1 `tech-stack.md`: *Architectural rules* 5, *In-place CMS* 1, *Authorization & application* (CI check, audit transaction), *Abuse & brute force* lockout row (spec → *Constitution changes*).
- [x] 2.2 Commit the owner's `---` divider in `roadmap.md` (owner answer A).

## 3. Guard

- [x] 3.1 `lib/auth/guards.ts`: `requireRole(minRole, { fresh? })` with the result type, the 2FA and fresh checks, the `env.cms` short-circuit, and `guardResponse()` (D1–D3). The session reader is injectable for unit tests.
- [x] 3.2 `hasMinRole()` in `roles.ts`, with tests over all 9 role pairs.
- [x] 3.3 `auth.forbidden` in `security-log.ts`, written on every 403 (D12).
- [x] 3.4 Unit tests `guards.test.ts`: signed out, deactivated, CMS off → 401; each role below, at and above the minimum; no 2FA → 403 `"2fa"` at every level; stale session with `fresh` → 403 `"reauth"`, without `fresh` → ok; `guardResponse()` statuses and body.

## 4. Audit

- [x] 4.1 `lib/audit/audit.ts` (server-only): `audit(db, event)` for a client or transaction client, with a JSON-only `diff` type, and `auditBestEffort()` for events with no change of their own (D5).
- [x] 4.2 Unit tests: the event shape, a refused `diff` key list (`password`, `secret`, `token`, `backupCodes` and similar), and best-effort logging without throwing.
- [x] 4.3 `auth.lockout` from the lockout hook (`lockout.ts` / `lockout-store.ts`) via `auditBestEffort` (D7).
- [x] 4.4 Find out whether the `twoFactor` plugin's `accountLockout` is visible to a hook. If it is, audit it as `auth.lockout` with `diff: { via: "2fa" }`; if not, record the deviation (D7).
- [x] 4.5 `auth.2fa_enabled` when TOTP set-up is confirmed (an after hook on the verify endpoint that sees `twoFactorEnabled` turn true) (D7).
- [x] 4.6 The owner scripts write `auth.admin_seeded` and `auth.password_reset` (`diff: { reset2fa }`) in the same transaction as their change (D7).

## 5. Session endpoint and header icon

- [x] 5.1 `app/api/cms/session/route.ts`: `GET` only, `no-store`, `{ role, authenticated }`, no database read without a session cookie, 404 while the CMS is off (D8).
- [x] 5.2 `StaffLink` reads `/api/cms/session`; it clears the hint only when `authenticated` is false (D9).
- [x] 5.3 `e2e/admin.spec.ts` and the public-crawl checks updated for the new request (the icon still appears for staff, and visitors make no request).

## 6. Test helpers

- [x] 6.1 `lib/auth/testing/`: the jar, `call()` and `fullSignIn()` moved out of `auth.db.test.ts`; `staffUser({ role, twoFactor })`; `fakeSession()` and `fakeStaff()` (D10). Excluded from the build's type roots if needed so that nothing in `app/` can import them (an ESLint `no-restricted-imports` rule outside tests).
- [x] 6.2 `auth.db.test.ts` moved onto the helpers; same tests, same results.

## 7. Database tests

- [x] 7.1 `lib/auth/guards.db.test.ts`, through the real handler: sales, editor and admin each against `requireRole("sales" | "editor" | "admin")`; a user without 2FA → `"2fa"`; a deactivated user → 401; a session older than 15 min (its `createdAt` moved back) with `fresh` → `"reauth"`.
- [x] 7.2 `app/api/cms/session` database test: anonymous → `{ role: null, authenticated: false }`; no 2FA → `{ role: null, authenticated: true }`; each role → its role; `no-store` header.
- [x] 7.3 Audit database tests: a change plus `audit()` in a `$transaction` that throws afterwards leaves neither row; the lockout writes `auth.lockout`; set-up writes `auth.2fa_enabled`; the scripts' events (through their core functions).

## 8. Unguarded-mutation check

- [x] 8.1 `lib/auth/public-mutations.ts`: the allowlist with a reason per entry (D11).
- [x] 8.2 `lib/auth/guard-coverage.ts`: the checker (TypeScript compiler API), as a pure function over source text.
- [x] 8.3 `guard-coverage.test.ts`: the fixture cases (D11), then the real scan of `app/` and `lib/` passes today.
- [x] 8.4 Red-CI proof: push a throwaway commit with an unguarded `"use server"` action, record the failed `ci` run, then drop the commit (validation).

## 9. Close-out

- [x] 9.1 Typecheck, lint, format, unit tests, builds with the CMS on and off (route table: public modes unchanged, C2).
- [x] 9.2 `roadmap.md` Phase 25 row: dated *Built* note.
- [x] 9.3 PR into `develop`; CI and preview-e2e green.
- [x] 9.4 **(owner)** The preview check (validation), then merge.
