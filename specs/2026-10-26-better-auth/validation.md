# Validation — Phase 24 Better Auth + roles

## Roadmap success check ("Done when", verbatim)

> A seeded admin logs in with 2FA and logs out at `/cms/login`. No public page links to `/cms`. Tests show 429 on repeated IP failures, lockout after 5 account failures, refusal of a breached password, and refusal of an expired session.

- [x] **Seeded admin, 2FA, sign-out (D17, amended):** `auth.db.test.ts` "asks a user with 2FA for a code, then signs in and out" green in the `db` job; `e2e/cms.spec.ts`'s full flow green against a seeded admin (run locally on Neon `dev`); **and** the owner seeds an admin on preview, sets up 2FA with a real authenticator app, signs in, reaches `/cms` and signs out. Owner confirmed on the #61 preview on 2026-10-26.
- [x] **No public link:** the public-crawl e2e finds no link to `/cms` on any public page (plan 5.5). Green in preview-e2e on #61 (run 40334163694).

### After D13's amendment (`/admin`, owner answers M, N)

- [x] The full browser flow on a CMS-on build: sign-in at `/admin`, set-up, backup-code download, landing on `/`, the header icon "Admin panel", `/admin/panel`, sign-out, and sign-in with a code (`admin.spec.ts`, run locally on Neon `dev`, 2026-10-26; plan 3.14).
- [x] A visitor's header has no admin icon, and no public page links to `/admin` (`admin.spec.ts`, on-mode, locally; preview-e2e on the next push).
- [x] Every staff form posts and can't submit before hydration (D22): `admin.spec.ts`.
- [ ] **(owner)** On the preview: sign in at `/admin`, land on the website, open the panel from the header icon, sign out (plan 3.15).
- [x] **429 on repeated IP failures:** `auth.db.test.ts` (plan 5.1). Green in the `db` job on #61 (run 40334030629).
- [x] **Lockout after 5 account failures:** `auth.db.test.ts`, for passwords and for TOTP codes, with the right password refused while locked (D4). Green in the `db` job (run 40334030629).
- [x] **Breached password refused:** `auth.db.test.ts` via `/change-password` (D6). Green in the `db` job (run 40334030629).
- [x] **Expired session refused:** `auth.db.test.ts` (D8). Green in the `db` job (run 40334030629).

## Auth hardening

- [x] `/sign-up/email`, `/request-password-reset`, `/reset-password`, `/admin/impersonate-user` and `/admin/stop-impersonating` return 404 (D10, D19). `auth.db.test.ts` and `paths.test.ts` green; `cms.spec.ts` on the preview.
- [x] Every login failure (unknown email, wrong password, locked, deactivated) shows the same message (D14). `auth.db.test.ts`: wrong password, locked (both locks) and deactivated return the same `INVALID_EMAIL_OR_PASSWORD`; the unknown email is Better Auth`s own path.
- [x] `RateLimitHit` holds only hashed keys after auth requests; no `rateLimit` table exists (D2). `auth.db.test.ts` (D2 test).
- [x] The ESLint ban on server-side sign-in fires on its fixture (D5). `lib/auth/lint-rules.test.ts` in `ci`.
- [x] Security log lines appear for a failed sign-in and a lockout, with no email address or password (D20). `security-log.test.ts`; the `db` job log shows `auth.sign_in_failed` and `auth.lockout` lines with a user ID and key hash only.
- [x] The session cookie is `httpOnly`, `Secure`, `SameSite=Lax` and `__Secure-`-prefixed on the preview (D8). `auth.db.test.ts` signs in through an https `baseURL`, as the preview has, and checks the `__Secure-better-auth.session_token` cookie`s attributes.
- [x] A request from an origin outside `trustedOrigins` is refused (D9, D21): a cookie-bearing one by Better Auth (`auth.db.test.ts`), a cookieless POST by the route (`paths.test.ts`, and `cms.spec.ts` on the preview). Green in `db`, `ci` and preview-e2e on #61.
- [x] Only the allowlisted endpoints reach Better Auth; any other `/api/auth` path is a 404 (D21: `paths.test.ts`, `cms.spec.ts`). Green in `ci` and preview-e2e on #61.
- [x] `/two-factor/disable` is closed, and "trust this device" is refused (D7, D21). `auth.db.test.ts`.
- [x] `auth-grants.db.test.ts`: `rhm_readonly` cannot read any auth table (D15). 5 green in the `db` job.

## `/cms` entry and the switch

- [x] With `CMS_ENABLED` off, `/cms`, `/cms/login` and `/api/auth/*` return 404 (D11). `cms.spec.ts` off-mode block in the `ci` job on #61.
- [x] `/cms/*` sends `X-Robots-Tag: noindex, nofollow` and the meta tag; neither `sitemap.xml` nor `robots.txt` mentions `/cms` (D13). `cms.spec.ts` on the preview; the seo e2e checks the sitemap.
- [x] A signed-in user without 2FA is sent to `/cms/2fa/setup` from every other `/cms` page (D7). The full flow in `cms.spec.ts`, run locally against Neon `dev` (implementation.md).
- [x] The build's route table shows no public route changing mode (C2).
- [x] Vercel Production has neither `CMS_ENABLED` nor `BETTER_AUTH_SECRET` (D11). `vercel env ls production` on 2026-10-26: neither is listed; both are Preview only.
- [x] Lighthouse on the preview's `/cms/login`: accessibility and best practices ≥ 90 (D18). The `lighthouse` job on #61 (run 40335604241, mobile, median of 3): performance 99, accessibility 100, best practices 100, SEO 100.

## Scripts

- [x] `auth:seed-admin` writes the password to `.env.admin-<branch>.local` and prints nothing secret; it refuses production and refuses an existing email (D12). Run against the throwaway Postgres (implementation.md).
- [x] `auth:reset-password` revokes sessions and clears the lockout; `--reset-2fa` sends the user back to set-up (D10). Run against the throwaway Postgres; the reset test in `auth.db.test.ts`.
- [x] `.env.admin-*.local` is git-ignored, and gitleaks is clean. The scripts check with `git check-ignore`; `gitleaks` green on #61.

## Constitution and docs

- [x] `tech-stack.md`, `roadmap.md` (Phase 24 note only; the owner's `---` edit not committed, C4), `CLAUDE.md` and `.env.example` updated.
- [x] `docs/runbooks/secret-rotation.md` has the `BETTER_AUTH_SECRET` section (D18).
- [x] The expand PR merged and `migrate-preview` applied `…_auth` before the feature PR (C1).

## Pre-launch security checklist (items this phase touches)

- [x] Rate-limit, Turnstile, honeypot and lockout tests green: record the evidence here. On #61 (run 40334030629): `ci` ran `turnstile-core.test.ts`, `submit-core.test.ts` (honeypot, Turnstile, per-IP limit) and `rate-limit-storage.test.ts`; `db` ran `submit.db.test.ts` and `auth.db.test.ts` (auth 429, both lockouts, refusal while locked).
- [x] `/security-review` findings resolved, or accepted in writing by the owner (D18): **no reportable finding** (2026-10-26, over `e7b028b..559fe04`). Its one defence-in-depth note, that turning 2FA on left the user's other password-only sessions alive, is fixed: the set-up step ends them (`auth.db.test.ts`). Its other note, that `deactivatedAt` is not checked on live sessions at `/api/auth`, is for Phase 33, whose deactivation must also revoke sessions (nothing sets `deactivatedAt` before then).

## Merge

- [ ] Every box in `plan.md` ticked.
- [ ] Feature PR: `ci`, `db`, `gitleaks` and preview-e2e green.
