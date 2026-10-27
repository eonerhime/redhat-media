# Validation — Phase 25 Guards, audit and session endpoint

## Roadmap success check ("Done when", verbatim)

> Guard tests pass, and the endpoint returns `null` for anonymous visitors. CI fails when a new unguarded action is added.

- [ ] **Guard tests pass:** `guards.test.ts` green in the `ci` job and `guards.db.test.ts` green in the `db` job (plan 3.4, 7.1).
- [ ] **The endpoint returns `null` for anonymous visitors:** the database test gets `{ role: null, authenticated: false }` with `Cache-Control: no-store` (plan 7.2).
- [ ] **CI fails on a new unguarded action:** the fixture tests are green (plan 8.3), **and** a throwaway commit with an unguarded `"use server"` action turned the PR's `ci` job red. The run ID is recorded in `implementation.md`, and the commit was then dropped (plan 8.4; owner answer I).

## Database tests through the real auth (owner answer I)

- [ ] Sales, editor and admin, each signed in through the real handler, pass or are refused at every minimum role exactly as the hierarchy says.
- [ ] A signed-in user without 2FA gets 403 `"2fa"` from the guard and `{ role: null, authenticated: true }` from the endpoint (Phase 24 C6).
- [ ] A deactivated user gets 401. A session older than 15 minutes gets 403 `"reauth"` with `{ fresh: true }`.
- [ ] A rolled-back transaction leaves no `AuditEvent` (D5).
- [ ] `rhm_app` is refused UPDATE and DELETE on `AuditEvent`, and `rhm_readonly` and `rhm_retention` are refused SELECT (D6).
- [ ] A password lockout writes `auth.lockout`, TOTP set-up writes `auth.2fa_enabled`, and the owner scripts write their events (D7). The 2FA-code lockout is either audited or recorded as a deviation.
- [ ] `auth.db.test.ts` passes unchanged in behaviour on the new helpers (D10).

## Owner's preview check (owner answer I)

- [ ] **(owner)** On the feature PR's preview: sign in at `/admin` with 2FA, land on `/`, and the header icon shows the role label. Its request goes to `/api/cms/session` (DevTools Network).
- [ ] **(owner)** After sign-out, the icon is gone. A fresh visitor's tab makes no request to `/api/cms/session`.

## Merge gate

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` pass.
- [ ] `pnpm build` passes with the CMS on and off. The route table shows no public route changing mode, and `/api/cms/session` is dynamic (C2).
- [ ] Schema PR merged first and `migrate-preview` green for it (C1). No drift in the `db` job.
- [ ] CI on the feature PR is green: `ci`, `db`, preview headers, preview-e2e, gitleaks and the dependency audit.
- [ ] No new dependency (C3). `pnpm audit --prod` has no high or critical findings.
- [ ] `tech-stack.md`, `README.md` §5 and `roadmap.md` updated as listed in spec → *Constitution changes*.
- [ ] Every box in `plan.md` ticked, and `implementation.md` records every deviation.
