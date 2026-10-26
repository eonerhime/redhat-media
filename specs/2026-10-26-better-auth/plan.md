# Plan — Phase 24 Better Auth + roles

Scope, decisions (D1–D20) and constraints (C1–C6) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md). Steps marked **(owner)** are the owner's (C5).

## 1. Expand PR (`feature/phase-24-auth-schema`, merged first; C1)

- [x] 1.1 `tech-stack.md`: the *Auth* stack row and `qrcode` row, the Abuse, Authentication and least-privilege rows, *Environment variables*, and *In-place CMS* 4–7 (✎ icon) (spec → *Constitution changes*).
- [x] 1.2 Add `better-auth` 1.7.12 (exact). Write `lib/auth/options.ts` (plugins, `additionalFields` and sessions, with no env or database) and `lib/auth/roles.ts`, so the Better Auth CLI can read them. Generate the models into `schema.prisma` with `npx auth@1.7.12 generate`, then check the output by hand (D1).
- [x] 1.3 Migration `…_auth`: the generated tables, the three `user` columns, the `role` CHECK constraint and the `rhm_readonly` revokes (D1, D15). Add the hand-written SQL to the generated migration.
- [x] 1.4 Database test `auth-grants.db.test.ts`: `rhm_readonly` cannot select from any auth table; `rhm_app` can insert, select, update and delete; the CHECK constraint rejects `role = 'owner'`.
- [ ] 1.5 `pnpm db:migrate` on `dev`. Open the PR into `develop`, noting that preview-e2e may fail until it's migrated. **(owner)** Merge; `migrate-preview` green.

## 2. Auth server (feature PR, after `develop` is merged in)

- [ ] 2.1 `lib/env.ts`: `CMS_ENABLED` and `BETTER_AUTH_SECRET` (≥ 32 characters, required when `CMS_ENABLED=1`), with tests. Update `.env.example` and CI env (D11).
- [ ] 2.2 `lib/auth/server.ts` (`server-only`): `betterAuth()` with the Prisma adapter, `emailAndPassword` (sign-up off, 12–128), `admin` (`defaultRole: "sales"`), `twoFactor` (issuer, no trusted devices), `haveIBeenPwned`, `disabledPaths` (D10, D19), sessions (D8), `trustedOrigins` and `baseURL` (D9), and IP headers (D2).
- [ ] 2.3 `lib/auth/rate-limit-storage.ts`: `consume()` backed by `rateLimit("auth", …)`, plus `customRules` (D2, D3). Unit-test the mapping and the 429.
- [ ] 2.4 `lib/auth/lockout.ts`: the before and after hooks on `/sign-in/email` (password count and lock, refusal while the user or 2FA lock is active, the deactivated check) (D4). Unit-test the count, the lock, the reset on success and the same-error refusal.
- [ ] 2.5 Security log lines (D20), with a test that no email address or password reaches the log.
- [ ] 2.6 `app/api/auth/[...all]/route.ts`: `toNextJsHandler`, 404 when `CMS_ENABLED` is off (D11).
- [ ] 2.7 ESLint: ban `auth.api.signInEmail`, `verifyTOTP` and `verifyBackupCode` outside `scripts/` and tests (D5), with a lint fixture showing that it fires.

## 3. `/cms` entry

- [ ] 3.1 `lib/auth/client.ts`: `createAuthClient` with `twoFactorClient` (`onTwoFactorRedirect` → `/cms/2fa`) and `adminClient`.
- [ ] 3.2 `app/(cms)/cms/layout.tsx`: 404 when off; server session check; signed out → `/cms/login`; 2FA not set up → `/cms/2fa/setup` (D7, D13). `robots` metadata `noindex, nofollow`.
- [ ] 3.3 `lib/security/headers.ts`: `X-Robots-Tag: noindex, nofollow` on `/cms/:path*`, with its test (D13). Check that `sitemap.ts` and `robots.ts` don't mention `/cms`.
- [ ] 3.4 `/cms/login`: email and password form (client API only), generic errors and the 429 message (D3, D14), keyboard and screen-reader labels.
- [ ] 3.5 `/cms/2fa`: TOTP code or backup code (D7, D14).
- [ ] 3.6 `/cms/2fa/setup`: password confirm → QR (`qrcode` matrix as SVG `<rect>`s) and text key → confirm a code → backup codes shown once (D7). `pnpm add qrcode@1.5` and `-D @types/qrcode`.
- [ ] 3.7 `/cms` placeholder: "Signed in as {name} ({role})", Sign out → `/cms/login` (D13).
- [ ] 3.8 Build and check the route table: no public route changed mode (C2).

## 4. Owner scripts

- [ ] 4.1 `scripts/auth-seed-admin.mts` (D12): random 24-character password to `.env.admin-<branch>.local`, never printed; refuses production; stops if the email exists. Add `.env.admin-*.local` to `.gitignore` and a `pnpm auth:seed-admin` script.
- [ ] 4.2 `scripts/auth-reset-password.mts` (D10): new random password to the same file, revoke sessions, clear the lockout, `--reset-2fa`. `pnpm auth:reset-password`.
- [ ] 4.3 `CLAUDE.md` *Commands* table: the two scripts.
- [ ] 4.4 **(owner)** Vercel Preview: `CMS_ENABLED=1` and a `BETTER_AUTH_SECRET` (Sensitive). Production: neither is set.
- [ ] 4.5 **(owner)** Seed your admin on `dev` and `preview`; sign in on the preview with your authenticator app and set up 2FA.

## 5. Tests

- [ ] 5.1 `auth.db.test.ts` (real Postgres, Better Auth through `auth.handler` with a test request): 6th sign-in from one IP inside 60 s → 429; 5 wrong passwords → locked, and the right password is refused with the generic error; 5 wrong TOTP codes → locked; a locked account unlocks after 15 min (clock moved); a deactivated user is refused; `/change-password` with a breached password is refused (breach API mocked to report a hit); an expired session (`expiresAt` in the past) is refused by `getSession`; reset revokes sessions; `/sign-up/email` and the reset paths return 404.
- [ ] 5.2 `RateLimitHit` holds no raw IP after a sign-in attempt (only hashes) (D2).
- [ ] 5.3 `e2e/cms-auth.spec.ts` in the `db` job: build with `CMS_ENABLED=1`, seed a test admin with a fixed test TOTP secret, then sign in → code → `/cms` → sign out → `/cms` redirects to `/cms/login` (D17). Add the build, start and Playwright steps to the `db` job in `ci.yml`.
- [ ] 5.4 e2e: with `CMS_ENABLED` off (the `ci` job build), `/cms`, `/cms/login` and `/api/auth/get-session` return 404 (D11).
- [ ] 5.5 e2e: no page in the public crawl links to `/cms` (roadmap check). `/cms/login` sends `X-Robots-Tag` and has the meta tag.
- [ ] 5.6 Existing a11y and contrast checks extended to `/cms/login` (with `CMS_ENABLED=1`).

## 6. Close-out

- [ ] 6.1 `docs/runbooks/secret-rotation.md`: the `BETTER_AUTH_SECRET` section. Before writing it, check what rotation does to the TOTP secrets Better Auth encrypts with it, and to sessions (D18).
- [ ] 6.2 `roadmap.md` Phase 24 row: the dated note (D10, D11), staged as its own hunk (C4).
- [ ] 6.3 Run `/security-review` over the branch's diff. Resolve each finding, or record the owner's written acceptance (D18).
- [ ] 6.4 Lighthouse on the preview's `/cms/login` (D18).
- [ ] 6.5 Security checklist: record the lockout and rate-limit items in `validation.md` (D18).
- [ ] 6.6 Feature PR into `develop`: `ci`, `db`, `gitleaks` and preview-e2e green. **(owner)** Merge.
