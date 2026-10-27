# Phase 25 — Guards, audit and session endpoint

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 3, Phase 25
- **Branch:** `feature/phase-25-guards-audit` (from `develop` at `cff93e0`); the schema ships first from `feature/phase-25-audit-schema` (C1)
- **Started:** 2026-10-27
- **Status:** owner answers A–I given 2026-10-27; approved to build 2026-10-27 ("build it")

## What and why

Phase 24 gave staff a sign-in. Every later Milestone 3 phase adds a mutation, and each one must start with a server-side role check and leave an audit record (roadmap, Milestone 3 intro). This phase builds those shared pieces before the first CMS mutation exists (Phase 27):

- `requireRole(minRole)`;
- the `AuditEvent` model and an `audit()` helper;
- `GET /api/cms/session`, the browser's one way to ask "which staff role am I?";
- auth test helpers;
- a CI check that fails when a server action or mutating route handler skips the guard.

No staff-facing feature changes, except that the header admin icon reads the new endpoint (D9).

## Constitution sections this phase relies on

- `mission.md` → *Guiding principles* 9 (secure from the first commit) and 10 (staff self-service, in place).
- `tech-stack.md`:
  - *Architectural rules* 1 (public server components never read the session) and 5 (server-side authorisation everywhere);
  - *Security baseline* → *Authorization & application* (`requireRole()` + CI check, `AuditEvent` on every mutation), *Abuse & brute force* (the lockout row: "becomes an `AuditEvent` once Phase 25 lands"), *Authentication & sessions* (15-minute fresh session), *Database security* (least-privilege roles, default privileges) and the *Pre-launch security checklist* ("the unguarded-action CI check passes");
  - *In-place CMS* → *Roles* and *How it works* 1 (`GET /api/cms/session`) and 9 (an `AuditEvent` after every change);
  - *Schema decisions*: the `requireRole` hierarchy row and the `AuditEvent` row.
- `README.md` §5 (`AuditEvent` model) and §6.3 (authorisation).
- Phase 24 spec: D7 (2FA for all staff), D8 (sessions, fresh age), D11 (`CMS_ENABLED`), D13 (header icon, sign-in hint), D15 (`rhm_readonly` kept off auth tables), D20 (security logs), C6 (`requireRole()` refuses a user without 2FA).
- MRU (`memories-r-us`), read before this spec, per the owner's rule that staff UX mirrors MRU:
  - `src/app/api/tenants/[tenantId]/edit-session/route.ts`: always 200, `{ role, authenticated, pendingCount }`, "no role" is an answer, not an error;
  - `src/lib/auth/admin-auth.ts` `requireSession(minRole, …)`: returns either a ready 401/403 or the resolved context;
  - `src/components/edit-mode.tsx`: reads the endpoint after load and caches the role in `sessionStorage` (Phase 26 reuses this);
  - `src/lib/platform/audit.ts`: a best-effort `logAuditEvent`. Ours differs on purpose (D5).

## Scope

1. **Constitution first** (listed below).
2. **Schema PR**: the `AuditEvent` model, its migration and grants (D4, D6). Merged and migrated on `preview` before the feature PR (C1).
3. **`requireRole()`**, with the 2FA and fresh-session checks and a route-handler adapter (D1–D3).
4. **`audit()`**, and the Phase 24 auth events that now write one (D5, D7).
5. **`GET /api/cms/session`**; the header icon moves to it (D8, D9).
6. **Auth test helpers** (D10).
7. **The unguarded-mutation check** in `pnpm test` (D11).

## Constitution changes (in the PRs, before the code)

- **`tech-stack.md`:**
  - *Architectural rules* 5: `requireRole()` also refuses a user without 2FA, takes `{ fresh: true }`, and its typed result (D1–D3).
  - *In-place CMS* → *How it works* 1: the endpoint's shape `{ role, authenticated }`, `role` null until 2FA is set up, 404 while the CMS is off, and the header icon reads it too (D8, D9).
  - *Authorization & application*: the CI check's mechanism and allowlist (D11); the `AuditEvent` row gets "in the same transaction as the change" and "append-only" (D5, D6).
  - *Abuse & brute force* → the lockout row: the lock is now an `AuditEvent` (D7).
  - *Database security* → least-privilege roles: on `AuditEvent`, `rhm_app` has INSERT and SELECT only, and `rhm_readonly` has no access (D6).
  - *Schema decisions*: the `AuditEvent` row records the nullable `actorId`, no foreign key, and the added index (D4).
- **`README.md` §5:** the `AuditEvent` model as built (D4).
- **`roadmap.md`:** a dated *Built* note on the Phase 25 row. The owner's `---` divider before Milestone 2 is committed with this phase (owner answer A).
- **`mission.md`:** no change.

## Out of scope

- Any CMS mutation. The first is Phase 27's `updateContentBlock`, which also brings the per-user mutation rate limit (tech-stack, *Abuse & brute force*, "27+").
- `EditModeProvider` and the Editing pill (Phase 26). Phase 26 reads this phase's endpoint.
- The audit log view, and how long audit rows are kept (Phase 33, with the view).
- The new-lead count on the endpoint and icon (Phase 32), like MRU's `pendingCount`.
- Auditing successful sign-ins, sign-outs and failed attempts. Failures stay in security logs only (owner answer E).
- Moving the `/admin` pages' own session checks onto `requireRole()`. Pages are not mutations; they keep `getStaffSession()` and redirects (Phase 24, D7, D13).

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **`requireRole(minRole, options?)` in `lib/auth/guards.ts`** (server-only). It re-reads the session and user from the database on every call (no cookie cache, Phase 24 D8) and uses the hierarchy `sales` < `editor` < `admin` from `roles.ts`. It returns a discriminated result: `{ ok: true, staff }`, where `staff` holds `userId`, `role` and `name`, or `{ ok: false, status: 401 \| 403, reason }`. **401** means not signed in, deactivated, an unknown role, or the CMS switched off: the guard checks `env.cms` first and never builds Better Auth when it is off (Phase 24 D11). **403** has a reason: `"role"`, `"2fa"` or `"reauth"`. A server action returns a generic error from it. `guardResponse(result)` turns a refusal into a `NextResponse` with `{ error }` for route handlers, so no caller builds its own 401 or 403. | One guard for both kinds of mutation. MRU's `requireSession` hands back a ready response; a result type also works inside server actions, which cannot return a `Response`. | tech-stack rule 5; MRU `admin-auth.ts`; Claude's call |
| D2 | **2FA is required by the guard.** A signed-in user whose `twoFactorEnabled` is false gets 403 `"2fa"` at every role level. | Until set-up is finished, the account is protected by its password alone. | Phase 24 C6 |
| D3 | **`{ fresh: true }`** refuses with 403 `"reauth"` when the session was created more than 15 minutes ago (Better Auth's `freshAge`, Phase 24 D8). It is built and tested now, and Phase 33's role changes and user management use it. | Sensitive actions need a recent sign-in (tech-stack, *Authentication & sessions*). Building it with the guard means Phase 33 adds no guard code. | Owner answer H |
| D4 | **`AuditEvent` model**: `id` (cuid), `actorId String?`, `action String`, `entityType String`, `entityId String`, `diff Json?`, `createdAt`. Indexes: `[entityType, entityId]` (README) and `[actorId, createdAt]` (Phase 33: "see that editor's edits"). `actorId` is **null** for the system (a lockout) and the owner scripts. There is **no foreign key** to `user`, so history survives any later removal of a user, as MRU keeps `target_id`. Action names are `area.verb`, e.g. `auth.lockout`, `content.update`. | The README model assumed every event has an actor; the owner scripts and lockouts do not. A plain id keeps the table append-only (D6): an `ON DELETE SET NULL` would need UPDATE. | README §5; owner answer E; Claude's call |
| D5 | **Same transaction.** `audit(db, event)` takes a Prisma client *or* transaction client. A database change and its `AuditEvent` are written in one `$transaction`, so either both commit or neither does. An event with no change of its own (a lockout, 2FA set-up recorded by a hook) is written best-effort: a failure is logged as one structured line (`audit.write_failed`, action and entity only) and never breaks sign-in. `diff` is typed as plain JSON values. Its tests check that a password, TOTP secret, backup code or session token never reaches it. | No unaudited edits. MRU's best-effort write can lose the record of a change that did happen. | Owner answer C |
| D6 | **Append-only, app-only.** The migration revokes UPDATE and DELETE on `AuditEvent` from `rhm_app` (leaving INSERT and SELECT) and revokes everything from `rhm_readonly`, overriding the default privileges (Phase 7 D4). `rhm_retention` has no default privileges and gets nothing. Rows are kept indefinitely until Phase 33 decides retention with its view. | A hijacked app cannot rewrite history. Diffs will hold client details (Phase 32) and staff emails, which `rhm_readonly` must never read (Phase 17 D4, Phase 24 D15). | Owner answer D |
| D7 | **Auth events that become `AuditEvent`s now:**<br>• `auth.lockout`: the password lockout (Phase 24 D4) from the lockout hook, actor null, entity the user. The 2FA-code lockout is Better Auth's own; it is audited too if the plugin exposes it to a hook. If it doesn't, that is logged as a deviation.<br>• `auth.2fa_enabled`: set-up finished, actor the user.<br>• `auth.admin_seeded` and `auth.password_reset` (`diff: { reset2fa }`): the owner scripts, actor null. They write as `rhm_migrator`, in the same transaction as their change.<br>Security-log lines stay as they are (Phase 24 D20). | The tech-stack lockout row requires it. Set-up and the out-of-band scripts are rare security changes worth a lasting record. On Hobby, runtime logs last 1 hour. Sign-ins and failures are left out (volume, and a flood vector). | Owner answer E; tech-stack |
| D8 | **`GET /api/cms/session`** (`app/api/cms/session/route.ts`): `Cache-Control: no-store`, and always 200 with `{ role, authenticated }`. `authenticated` is true for any signed-in, non-deactivated staff member. `role` is their role once 2FA is on, otherwise null, so no staff UI appears before set-up. A request with no session cookie is answered without a database read. While `CMS_ENABLED` is off it returns 404, like `/api/auth` (Phase 24 D11). It uses `getStaffSession()`, the same read as the guard, and is not a mutation. | MRU's edit-session shape: "no role" is an answer, not an error. One endpoint decides all staff UI; Phase 26's `EditModeProvider` reads it, and Phase 32 adds the new-lead count. | Owner answer B; tech-stack *In-place CMS* 1; MRU |
| D9 | **The header icon (`StaffLink`) reads `/api/cms/session`** instead of `/api/auth/get-session`. It still asks only when the sign-in hint is set. It clears the hint only when `authenticated` is false, so a user midway through set-up keeps it. | One source of truth. `/api/auth/get-session` returns the role even before 2FA is set up. | Owner answer B |
| D10 | **Auth test helpers** in `lib/auth/testing/` (excluded from the app bundle; imported only by tests):<br>• for database tests: the cookie jar, `call()` and `fullSignIn()` taken out of `auth.db.test.ts`, plus `staffUser({ role, twoFactor })`, which creates a user and returns a signed-in cookie jar through the real handler;<br>• for unit tests: `fakeSession()` and `fakeStaff()`, used with the guard's injected session reader.<br>`auth.db.test.ts` moves onto them with no change in behaviour. | Every Milestone 3 phase writes "visitor refused, wrong role refused, right role passes" tests. One helper set keeps those short and uses the real sign-in, not a forged cookie. | Roadmap; Claude's call |
| D11 | **The unguarded-mutation check** is a Vitest test (`lib/auth/guard-coverage.test.ts`), so it runs in `pnpm test` in the `ci` job. It uses the TypeScript compiler API, which is already a dependency, to parse every file with a `"use server"` directive and every `app/**/route.ts` exporting `POST`, `PUT`, `PATCH` or `DELETE`. Each exported function's first statement must await `requireRole(...)`, either bare or assigned to a variable. Anything else fails, with a message naming the file and function. The allowlist `lib/auth/public-mutations.ts` names each public entry with its reason: `submitInquiry` (Turnstile, honeypot, per-IP limits; Phase 18) and `app/api/auth/[...all]` (Better Auth's own limits, Phase 24 D21). The checker is a function, tested against fixture sources: guarded, unguarded, guard not first, guard in a helper only, an arrow-function export, an inline `"use server"` function, and an allowlisted entry. | It is a real parse, not a regex, so a `requireRole` call elsewhere in the file can't satisfy it. It needs no new dependency and no ESLint plugin to maintain. "First statement" keeps the rule simple to audit. | Owner answer F; tech-stack |
| D12 | **Refusals are security-logged.** A 403 from the guard writes one `auth.forbidden` line (user ID, reason, the action name), never the input. A 401 is not logged: it is the normal answer to a signed-out request. | A staff member probing above their role is worth seeing in logs. | Claude's call; Phase 24 D20 |

### Owner answers (2026-10-27)

| # | Question | Answer |
| --- | --- | --- |
| A | The uncommitted `---` in `roadmap.md` | Carry it into Phase 25 |
| B | `GET /api/cms/session` | Build it; the header icon moves to it |
| C | When the audit write fails | Same transaction as the change |
| D | Access to `AuditEvent` | Append-only (`rhm_app` INSERT and SELECT), no `rhm_readonly` access |
| E | Auth events audited now | 2FA set-up and the owner scripts (with the lockout tech-stack already requires); not sign-in, sign-out or failures |
| F | The CI check | A Vitest scan with the TypeScript compiler API |
| G | Shipping the schema | Migration PR first |
| H | Fresh-session option | Build it now |
| I | Merge checks beyond the roadmap's | Database tests through real auth, a red-CI proof of the check, and the owner's preview check |

## Constraints

- **C1 Schema first.** `AuditEvent`, its migration and grants ship in their own PR (`feature/phase-25-audit-schema`) and are migrated on `preview` before the feature PR, because schema PRs fail preview-e2e until their migration is live (Phases 12, 19, 24). The schema PR has no code that reads the table (owner answer G).
- **C2 Public pages stay static.** The build's route table shows no public route changing mode. `/api/cms/session` is dynamic.
- **C3 No new dependencies.** The TypeScript compiler API comes from the existing `typescript` dev dependency.
- **C4** Steps marked **(owner)** are the owner's: running scripts with branch credentials, the preview check and merging.
- **C5** `CMS_ENABLED` stays off in production (Phase 24 D11); nothing here changes that.
