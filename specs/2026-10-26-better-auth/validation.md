# Validation — Phase 24 Better Auth + roles

## Roadmap success check ("Done when", verbatim)

> A seeded admin logs in with 2FA and logs out at `/cms/login`. No public page links to `/cms`. Tests show 429 on repeated IP failures, lockout after 5 account failures, refusal of a breached password, and refusal of an expired session.

- [ ] **Seeded admin, 2FA, sign-out:** `e2e/cms-auth.spec.ts` green in the `db` job (D17), **and** the owner seeds an admin on preview, sets up 2FA with a real authenticator app, signs in, reaches `/cms` and signs out.
- [ ] **No public link:** the public-crawl e2e finds no link to `/cms` on any public page (plan 5.5).
- [ ] **429 on repeated IP failures:** `auth.db.test.ts` (plan 5.1).
- [ ] **Lockout after 5 account failures:** `auth.db.test.ts`, for passwords and for TOTP codes, with the right password refused while locked (D4).
- [ ] **Breached password refused:** `auth.db.test.ts` via `/change-password` (D6).
- [ ] **Expired session refused:** `auth.db.test.ts` (D8).

## Auth hardening

- [ ] `/sign-up/email`, `/request-password-reset`, `/reset-password`, `/admin/impersonate-user` and `/admin/stop-impersonating` return 404 (D10, D19).
- [ ] Every login failure (unknown email, wrong password, locked, deactivated) shows the same message (D14).
- [ ] `RateLimitHit` holds only hashed keys after auth requests; no `rateLimit` table exists (D2).
- [ ] The ESLint ban on server-side sign-in fires on its fixture (D5).
- [ ] Security log lines appear for a failed sign-in and a lockout, with no email address or password (D20).
- [ ] The session cookie is `httpOnly`, `Secure`, `SameSite=Lax` and `__Secure-`-prefixed on the preview (D8).
- [ ] A request from an origin outside `trustedOrigins` is refused (D9).
- [ ] `auth-grants.db.test.ts`: `rhm_readonly` cannot read any auth table (D15).

## `/cms` entry and the switch

- [ ] With `CMS_ENABLED` off, `/cms`, `/cms/login` and `/api/auth/*` return 404 (D11).
- [ ] `/cms/*` sends `X-Robots-Tag: noindex, nofollow` and the meta tag; neither `sitemap.xml` nor `robots.txt` mentions `/cms` (D13).
- [ ] A signed-in user without 2FA is sent to `/cms/2fa/setup` from every other `/cms` page (D7).
- [ ] The build's route table shows no public route changing mode (C2).
- [ ] Vercel Production has neither `CMS_ENABLED` nor `BETTER_AUTH_SECRET` (D11).
- [ ] Lighthouse on the preview's `/cms/login`: accessibility and best practices ≥ 90 (D18).

## Scripts

- [ ] `auth:seed-admin` writes the password to `.env.admin-<branch>.local` and prints nothing secret; it refuses production and refuses an existing email (D12).
- [ ] `auth:reset-password` revokes sessions and clears the lockout; `--reset-2fa` sends the user back to set-up (D10).
- [ ] `.env.admin-*.local` is git-ignored, and gitleaks is clean.

## Constitution and docs

- [ ] `tech-stack.md`, `roadmap.md` (Phase 24 note only; the owner's `---` edit not committed, C4), `CLAUDE.md` and `.env.example` updated.
- [ ] `docs/runbooks/secret-rotation.md` has the `BETTER_AUTH_SECRET` section (D18).
- [ ] The expand PR merged and `migrate-preview` applied `…_auth` before the feature PR (C1).

## Pre-launch security checklist (items this phase touches)

- [ ] Rate-limit, Turnstile, honeypot and lockout tests green: record the evidence here.
- [ ] `/security-review` findings resolved, or accepted in writing by the owner (D18).

## Merge

- [ ] Every box in `plan.md` ticked.
- [ ] Feature PR: `ci`, `db`, `gitleaks` and preview-e2e green.
