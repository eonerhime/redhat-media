# Plan — Phase 24 Better Auth + roles

Scope, decisions (D1–D21) and constraints (C1–C6) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md). Steps marked **(owner)** are the owner's (C5).

## 1. Expand PR (`feature/phase-24-auth-schema`, merged first; C1)

- [x] 1.1 `tech-stack.md`: the *Auth* stack row and `qrcode` row, the Abuse, Authentication and least-privilege rows, *Environment variables*, and *In-place CMS* 4–7 (✎ icon) (spec → *Constitution changes*).
- [x] 1.2 Add `better-auth` 1.7.12 (exact). Write `lib/auth/options.ts` (plugins, `additionalFields` and sessions, with no env or database) and `lib/auth/roles.ts`, so the Better Auth CLI can read them. Generate the models into `schema.prisma` with `npx auth@1.7.12 generate`, then check the output by hand (D1).
- [x] 1.3 Migration `…_auth`: the generated tables, the three `user` columns, the `role` CHECK constraint and the `rhm_readonly` revokes (D1, D15). Add the hand-written SQL to the generated migration.
- [x] 1.4 Database test `auth-grants.db.test.ts`: `rhm_readonly` cannot select from any auth table; `rhm_app` can insert, select, update and delete; the CHECK constraint rejects `role = 'owner'`.
- [x] 1.5 `pnpm db:migrate` on `dev`. PR #60 into `develop`, merged by the owner (`88603c0`); `migrate-preview` green (run 40333165097).

## 2. Auth server (feature PR, after `develop` is merged in)

- [x] 2.1 `lib/env.ts`: `CMS_ENABLED` and `BETTER_AUTH_SECRET` (≥ 32 characters, required when `CMS_ENABLED=1`; `CMS_ENABLED=1` refused in production until Phase 34), `VERCEL_URL` for the preview origins, with tests. `.env.example` updated. CI needs no change: the `ci` job runs with the CMS off on purpose (5.4), and the database tests pass their own values.
- [x] 2.2 `lib/auth/core.ts` (`createAuth`, testable) and `lib/auth/server.ts` (`server-only`, `getAuth()`): the Prisma adapter, `emailAndPassword` (sign-up off, 12–128), `admin` (`defaultRole: "sales"`, generic banned message), `twoFactor` (issuer, 10 backup codes, `accountLockout` 5 / 15 min), `haveIBeenPwned`, `disabledPaths` (D10, D19), sessions (D8), `trustedOrigins` and `baseURL` (D9), IP headers (D2), and origin and CSRF checks pinned on (D21).
- [x] 2.3 `lib/auth/rate-limit-storage.ts`: `consume()` backed by `rateLimit("auth", …)`, plus `customRules` (D2, D3). Unit-tested.
- [x] 2.4 `lib/auth/lockout.ts` and `lockout-store.ts`: the before and after hooks on `/sign-in/email` (password count and lock, refusal while the user or 2FA lock is active, the deactivated check, the trusted-device refusal) (D4, D7). Unit-tested decisions; the database tests cover the hooks.
- [x] 2.5 `lib/auth/security-log.ts` (D20), with a test that no email address or password reaches the log.
- [x] 2.6 `app/api/auth/[...all]/route.ts`: 404 when `CMS_ENABLED` is off or the path is not on the allowlist, 403 for a POST from an untrusted origin (D11, D21).
- [x] 2.7 ESLint: `no-restricted-syntax` bans `….api.signInEmail`, `verifyTOTP` and `verifyBackupCode` outside `scripts/`, `e2e/` and tests (D5); `lib/auth/lint-rules.test.ts` shows that it fires, and that the client API's `verifyBackupCode` is allowed.

## 3. `/cms` entry

- [x] 3.1 `lib/auth/client.ts`: `createAuthClient` with `twoFactorClient`. The login form handles the 2FA redirect itself; `adminClient` waits for Phase 33, which uses it.
- [x] 3.2 `app/(cms)/cms/layout.tsx`: 404 when off, `robots` noindex metadata, a plain staff header. The session checks are in each page (`getStaffSession()` in `lib/auth/session.ts`, which also 404s while off): signed out → `/cms/login`; 2FA not set up → `/cms/2fa/setup` (D7, D13).
- [x] 3.3 `lib/security/headers.ts`: `X-Robots-Tag: noindex, nofollow` on `/cms/:path*`, with its test (D13). `sitemap.ts` and `robots.ts` don't mention `/cms` (the existing seo e2e checks the sitemap).
- [x] 3.4 `/cms/login`: email and password form (client API only), generic errors and the 429 message (D3, D14), labels, `autocomplete`, an alert that takes focus.
- [x] 3.5 `/cms/2fa`: TOTP code or backup code (D7, D14), with a "sign in again" link when the 2FA step has timed out.
- [x] 3.6 `/cms/2fa/setup`: password confirm → QR (`qrcode` matrix as one SVG path) and text key → confirm a code → backup codes shown once (D7). `qrcode` 1.5.4 and `@types/qrcode` 1.5.6 (dev).
- [x] 3.7 `/cms` placeholder: "Signed in as {name} ({role})", Sign out → `/cms/login` (D13).
- [x] 3.8 Build and check the route table: `/cms` and `/cms/2fa/setup` are partial prerenders, `/cms/login` and `/cms/2fa` static, `/api/auth/[...all]` dynamic; no public route changed mode (C2). Built both with the CMS on and off.

## 4. Owner scripts

- [x] 4.1 `scripts/auth-seed-admin.mts` (D12): random 24-character password to `.env.admin-<branch>.local`, never printed; refuses production; stops if the email exists. `.gitignore`'s `.env*` already covers the file (the script checks with `git check-ignore`). `pnpm auth:seed-admin`.
- [x] 4.2 `scripts/auth-reset-password.mts` (D10): new random password to the same file, revoke sessions, clear both lockouts, `--reset-2fa`. `pnpm auth:reset-password`.
- [x] 4.3 `CLAUDE.md` *Commands* table: the two scripts.
- [ ] 4.4 **(owner)** Vercel Preview: `CMS_ENABLED=1` and a `BETTER_AUTH_SECRET` (Sensitive). **Before the feature PR is pushed**, because preview-e2e runs `cms.spec.ts` in on-mode. Production: neither is set.
- [ ] 4.5 **(owner)** Seed your admin on `dev` and `preview`; sign in on the preview with your authenticator app and set up 2FA.

## 5. Tests

- [x] 5.1 `lib/auth/auth.db.test.ts` (21 tests, real Postgres, Better Auth through `auth.handler`): the full 2FA flow and backup codes; trusted device refused; the 6th sign-in from one IP inside 60 s → 429; 5 wrong passwords → locked, and the right password refused with the generic error; unlock after 15 min; the count resets after a correct password; 5 wrong TOTP codes → locked; a deactivated user refused; a breached and a short new password refused at `/change-password` (breach API stubbed); an expired session refused; 8-hour sessions; a password reset ends sessions; disabled paths 404; a cookie-bearing request from another origin refused.
- [x] 5.2 `RateLimitHit` holds only salted hashes after auth requests, and no `rateLimit` table exists (in 5.1) (D2).
- [x] 5.3 `e2e/cms.spec.ts` (D17, amended): in on-mode (`E2E_CMS=on`, preview-e2e) the login page's noindex, the signed-out redirects, the generic error, the closed endpoints, the 403 for another origin, and axe on `/cms/login` and `/cms/2fa`; the full set-up, sign-in and sign-out flow when `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` are given (run locally against Neon `dev`). Added to the preview-e2e list.
- [x] 5.4 e2e: with `CMS_ENABLED` off (the `ci` job), `/cms`, `/cms/login`, `/cms/2fa`, `/cms/2fa/setup` and `/api/auth/*` return 404 (D11).
- [x] 5.5 e2e: no public route links to `/cms` (roadmap check). `/cms/login` sends `X-Robots-Tag` and has the meta tag.
- [x] 5.6 axe (WCAG 2.2 A/AA, contrast included) on `/cms/login` and `/cms/2fa` at 360 and 1440 px, in on-mode.

## 6. Close-out

- [x] 6.1 `docs/runbooks/secret-rotation.md`: the `BETTER_AUTH_SECRET` row. Rotation ends sessions and breaks each 2FA set-up (TOTP secrets are encrypted with it), so the row resets each user's 2FA; versioned rotation (`BETTER_AUTH_SECRETS`) is to be decided before Phase 34 (D18).
- [x] 6.2 `roadmap.md` Phase 24 row: the dated note (D10, D11, D17), staged as its own hunk (C4).
- [x] 6.3 Run `/security-review` over the branch's diff. Resolve each finding, or record the owner's written acceptance (D18).
- [ ] 6.4 Lighthouse on the preview's `/cms/login` (D18).
- [ ] 6.5 Security checklist: record the lockout and rate-limit items in `validation.md` (D18).
- [ ] 6.6 Feature PR into `develop`: `ci`, `db`, `gitleaks` and preview-e2e green. **(owner)** Merge.
