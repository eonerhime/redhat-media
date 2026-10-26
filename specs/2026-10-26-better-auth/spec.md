# Phase 24 — Better Auth + roles, hardened from the first commit

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 3, Phase 24
- **Branch:** `feature/phase-24-better-auth` (from `develop` at `e7b028b`)
- **Started:** 2026-10-26
- **Status:** owner answers A–K given 2026-10-26 (L during the build); approved to build 2026-10-26 ("build it")

## What and why

Milestone 3 gives staff an in-place CMS and a back office. Every later phase (guards, edit mode, editable content, the inquiry inbox) needs a signed-in staff member with a role. This phase builds only that: staff accounts, sign-in with TOTP 2FA, and sign-out at a hidden `/cms`, with every brute-force control in place before the first login exists (mission principle 9).

Nothing here is editable yet, and production does not expose it (D11).

## Constitution sections this phase relies on

- `mission.md` → *Who we serve* 4 (RHM staff) and *Guiding principles* 9 (secure from the first commit) and 10 (staff self-service, in place).
- `tech-stack.md`:
  - the *Auth (staff only)* stack row (Better Auth 1.7, Prisma adapter, `admin` and `twoFactor` plugins);
  - *Architectural rules* 5 (server-side authorisation) and 6 (hidden staff entry at `/cms`);
  - *Security baseline* → *Abuse & brute force*, *Authentication & sessions*, *Database security & data protection* (least-privilege roles, Better Auth tables through Prisma migrations, CI-only migrations), *Supply chain & secrets* (rotation runbook) and the *Pre-launch security checklist*;
  - *In-place CMS* → *Roles* and *How it works* 2 (the Editing pill), 4–7 (edit affordances);
  - *Schema decisions*: the Better Auth tables row (`role` CHECK, `failedSignInCount`, `lockedUntil`, `deactivatedAt`).
- `roadmap.md` → Phase 24; Phases 25 (guards), 33 (staff management, 2FA reset, unlock) and 34 (Milestone 3 release); open question 2 (domain).
- Phase 7 spec D4 (default privileges), Phase 17 spec D4 (`rhm_readonly` kept off personal data), Phase 18 spec D6 and D10 (client IP, the `INQUIRY_FORM_ENABLED` flag pattern).

## Scope

1. **Constitution first** (listed below).
2. **Expand PR**: the Better Auth tables, the extra `user` columns and the grants (D1, D15). It ships and is migrated before the feature PR (C1).
3. **Auth server and client** (D2–D10, D14, D16).
4. **`/cms` entry**: login, 2FA set-up and challenge, and the placeholder dashboard (D7, D12, D13).
5. **Owner scripts**: seed admin and reset password (D10, D12).
6. **Tests and the merge gate** (D17, D18).

## Constitution changes (in the PRs, before the code)

- **`tech-stack.md`:**
  - *Abuse & brute force* → the Auth row: `rateLimit.customStorage` backed by `rateLimit()` instead of `storage: "database"` (D2). The lockout row: wrong 2FA codes count too (D4).
  - *Authentication & sessions*: the session row gets the absolute 8h lifetime and the 15-minute fresh age (D8); `trustedOrigins` lists exact origins only (D9); password reset is admin-run until the domain amendment (D10); no trusted devices for 2FA (D7).
  - *Database security* → least-privilege roles: `rhm_readonly` has no access to the auth tables (D15).
  - *Environment variables*: `CMS_ENABLED` and `BETTER_AUTH_SECRET`; `BETTER_AUTH_URL` is dropped, because the base URL is the site URL (D9, D11).
  - The stack table: add **`qrcode`** 1.5 (D7).
  - *In-place CMS* → *How it works* 4–7: every editable block shows an always-visible ✎ button while editing is on (D16).
  - *Supply chain & secrets* → rotation runbook: `BETTER_AUTH_SECRET`.
- **`roadmap.md`:** the Phase 24 row gets a dated note that password reset is admin-run until the domain amendment, and that `/cms` is off in production until Phase 34 (D10, D11). The owner's uncommitted `---` edit is not part of this phase: stage only this phase's hunks (C4).
- **`mission.md`:** no change.

## Out of scope

- `requireRole()`, `AuditEvent`, `GET /api/cms/session` and the unguarded-action CI check (Phase 25). Until then, the lockout is written to security logs only (`tech-stack.md`, lockout row).
- The Editing pill and anything editable (Phases 26–31).
- Invites, role changes, 2FA reset, unlock and session revocation from the UI (Phase 33). Until then, the owner uses the scripts (D10, D12).
- Self-service password reset by email (the domain amendment, D10).
- A change-password page. The endpoint exists and is tested through the API (D6); its page arrives with Phase 33.
- `/cms` in production (Phase 34, D11).
- `proxy.ts`. The `/cms` layout checks the session on the server (Phase 14 spec, D10, chose no proxy).

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **Better Auth 1.7**, pinned at 1.7.12 (1.7.13 was a day old, inside pnpm 12's default release-age cooldown; see implementation.md), with `emailAndPassword` (`disableSignUp: true`), and the `admin`, `twoFactor` and `haveIBeenPwned` plugins, on the Prisma adapter. The Better Auth CLI (the `auth` package, same version) generates the models into `schema.prisma` from `lib/auth/options.ts` (run through `npx`, not added as a dependency). A Prisma migration applies them, plus a CHECK constraint restricting `user.role` to `admin`, `editor` or `sales`, and `user.failedSignInCount Int @default(0)`, `lockedUntil DateTime?` and `deactivatedAt DateTime?` (declared as `additionalFields` with `input: false`). The admin plugin's `defaultRole` is `sales`. | The tech-stack *Auth* and *Schema decisions* rows. The least-powerful role is the safe default. | tech-stack |
| D2 | **Rate limiting uses our own limiter.** `rateLimit.customStorage.consume(key, rule)` calls `rateLimit("auth", key, { max: rule.max, windowSec: rule.window })`, so the key (Better Auth builds it from the IP and path) is stored only as a salted SHA-256 hash in `RateLimitHit`. Better Auth's own `rateLimit` table is not created. `rateLimit.enabled` is `true` everywhere, including dev and CI, so the tests exercise it. The IP comes from `x-real-ip`, then `x-forwarded-for` (`advanced.ipAddress.ipAddressHeaders`), the same as `lib/security/client-ip.ts`. | Better Auth's `storage: "database"` keeps the raw IP in its key, which breaks "IPs are stored only as salted hashes" (NDPA). The Phase 23 retention job already purges `RateLimitHit` after 30 days. Better Auth 1.7 requires an atomic `consume`, which our single-statement upsert provides. | Owner answer B |
| D3 | **`customRules`** (per IP): `/sign-in/email` 5 per 60 s; `/two-factor/*` 5 per 60 s; `/change-password` 5 per 10 min; `/request-password-reset` and `/reset-password` 3 per hour (ready for the domain amendment, though disabled now, D10). The default for every other auth path is 30 per 60 s. Over the limit, Better Auth answers **429** and the form says "Too many attempts. Try again in a minute." | "Strict `customRules` on sign-in and password reset" (roadmap). Five a minute is plenty for a person and far too few for guessing. | Claude's call (values open to change) |
| D4 | **Per-account lockout.** A wrong password adds 1 to `user.failedSignInCount`; at 5, `user.lockedUntil` is set to now + 15 min, and a correct password resets the count. Wrong TOTP and backup codes are counted by the `twoFactor` plugin's own `accountLockout` (set to 5 and 15 min; it keeps `failedVerificationCount` and `lockedUntil` on the `twoFactor` row and resets on a correct code). While **either** lock is active, sign-in fails with the **same generic error** as a wrong password, even with the right password. Built with `hooks.before` / `hooks.after` on `/sign-in/email`. A deactivated user (`deactivatedAt` set) is refused the same way. *(Amended 2026-10-26 during the build: Better Auth 1.7 has a tested per-account lockout for codes, so it is used instead of a hand-written one.)* | Otherwise someone holding a password could guess 6-digit codes, limited only by the per-IP rate. Same-message refusal means a lockout doesn't confirm that an account exists. | Owner answer H; tech-stack lockout row |
| D5 | **Sign-in only through the client API** (`authClient.signIn.email` to `/api/auth/*`). ESLint bans `auth.api.signInEmail` and `auth.api.verifyTOTP` / `verifyBackupCode` outside `scripts/` and tests. | Server-side calls skip Better Auth's rate limiting (tech-stack). A lint rule makes the rule hold. | tech-stack |
| D6 | **Passwords:** 12 to 128 characters; checked by `haveIBeenPwned` (k-anonymity range API) wherever a password is set or changed; hashed by Better Auth's default (scrypt). If the breach API can't be reached, the change is refused (fails closed). In Phase 24 a password is set only by the owner scripts (random, D12) and by `/change-password` (API, behind the fresh-session rule), which is where the breached-password test runs. | The roadmap's "refusal of a breached password". No page needs a password form until Phase 33. | tech-stack; Claude's call (where to test) |
| D7 | **TOTP 2FA for everyone, set up on first sign-in.** Until 2FA is on, every `/cms` page except `/cms/login` and `/cms/2fa/setup` redirects to the set-up page. Set-up shows a QR code, the text key, a "confirm one code" step, and then 10 backup codes, shown once, with a button that downloads them as a text file built in the browser (`redhat-media-backup-codes.txt`, naming the site and the time; owner, 2026-10-26). There is no "trust this device": every sign-in asks for a code. The issuer is "RedHat Media". The QR code is drawn by **`qrcode`** (`QRCode.create()` returns the module matrix, rendered on the server as React `<rect>`s), so there is no `dangerouslySetInnerHTML`, no `data:` URL and no CSP change. | Sales staff see client data and editors change the public site (tech-stack). Scanning a QR code is how staff expect to add an authenticator. | Owner answers C, K |
| D8 | **Sessions:** an 8h **absolute** lifetime (`expiresIn` 8h with session refresh off), so a stolen cookie dies by the end of the working day. The fresh age is 15 min (needed by `/change-password` now and by Phase 33's sensitive actions). Cookies are `httpOnly`, `SameSite=Lax`, and `Secure` with the `__Secure-` prefix on https. The cookie cache is off, so a revoked session ends on its next request. Every session is revoked when a password is reset (D10) or a user is deactivated. | tech-stack *Authentication & sessions*. A sliding session would never end for someone who uses the CMS daily. | tech-stack; Claude's call (absolute, 15 min) |
| D9 | **`trustedOrigins` are exact origins, no wildcards:** the site URL; on Vercel Preview also `https://$VERCEL_URL` and `https://$VERCEL_BRANCH_URL`; locally `http://localhost:3000`. Better Auth's `baseURL` is the site URL from `lib/env.ts`, so `BETTER_AUTH_URL` is dropped. | A `*.vercel.app` pattern would trust every Vercel customer's site. One source for the origin avoids drift. | Claude's call |
| D10 | **No password-reset email until the domain amendment.** `/request-password-reset`, `/reset-password` and `/sign-up/email` are in `disabledPaths` (404). The owner resets a password with `scripts/auth-reset-password.mts --branch <b> --email <e>`: it writes a new random password to `.env.admin-<branch>.local`, revokes every session, clears the lockout, and with `--reset-2fa` also removes the user's 2FA so they set it up again. | Resend's shared sender reaches only the account owner's inbox (open question 2). One reset path that works beats an email flow that silently doesn't. The script also covers a lost phone until Phase 33. | Owner answer D |
| D11 | **`CMS_ENABLED` switch** (server-only, `1` = on), following `INQUIRY_FORM_ENABLED`: `1` in dev, Vercel Preview, CI and `.env.example`; **unset in Production until the Phase 34 release**. When it is off, `/cms/*` and `/api/auth/*` return 404. When it is on, `BETTER_AUTH_SECRET` is required (at least 32 characters). `lib/env.ts` refuses `CMS_ENABLED=1` in production until Phase 34, so a mistaken setting fails the build. The static `/cms` pages take the switch at build time, so changing it needs a redeploy (as for `INQUIRY_FORM_ENABLED`). *(CI amended in the build: the `ci` job runs with it off, to test the 404s; preview-e2e tests it on.)* | A develop → main release before Phase 34 would otherwise put a login page in production with nothing behind it. | Owner answer E |
| D12 | **First admin:** `scripts/auth-seed-admin.mts --branch <dev|preview> --email <e> --name <n>` creates an `admin` with a random 24-character password, written to the git-ignored `.env.admin-<branch>.local` and never printed (the `db-bootstrap` pattern, so it works with `!`). It connects with `MIGRATOR_DATABASE_URL`, stops if the email exists (use the reset script), and **refuses production** in Phase 24 (Phase 34 lifts this). The admin then signs in and sets up 2FA (D7). | Nothing prompts, and the password never lands in shell history. | Owner answer F |
| D13 | **`/cms` in Phase 24** is a minimal page in the site's dark theme: "Signed in as {name} ({role})", a Sign out button, and a note that the tools arrive in later phases. `/cms` lives in its own route group, outside `(public)`, with no site header or footer links to it. Every `/cms` response carries `X-Robots-Tag: noindex, nofollow` (added in `lib/security/headers.ts` for `/cms/:path*`, with its test) and the `robots` meta tag. It is not in `sitemap.ts` or `robots.txt`. Signed-out visitors to `/cms/*` go to `/cms/login`, and after sign-in to `/cms`. | tech-stack rule 6. No navigation for features that don't exist yet. | Owner answer G; tech-stack |
| D14 | **Generic errors.** The login form says "Invalid email or password" (the wording in `tech-stack.md` rule 6) for an unknown email, a wrong password, a locked account and a deactivated account. The 2FA step says "That code didn't work." The 429 message is D3's. | No account enumeration (roadmap: "generic login errors"). | roadmap |
| D15 | **Database grants.** The expand migration revokes all privileges on `user`, `session`, `account`, `verification` and `twoFactor` from `rhm_readonly` (the default privileges grant it SELECT on new tables, Phase 7 D4). `rhm_app` keeps its default DML. `rhm_retention` gets nothing. A database test proves `rhm_readonly` cannot read them. | These tables hold password hashes, session tokens and TOTP secrets. The monitor credential must not expose them (as with `Inquiry`, Phase 17 D4). | Claude's call |
| D16 | **✎ edit icon (constitution fix, built in Phases 26–31).** While editing is on, every editable text block, image, gallery, video and portfolio field shows a ✎ button that is **always visible** (not hover-only), keyboard-focusable, and labelled "Edit {label}". | The memories-r-us and cecilia-onerhime CMSs and the Epenal spec all have a per-block pencil; ours had dropped the line. Always visible works on touch and for keyboard users. | Owner answer A (2026-10-26, after a check of MRU, cecilia-onerhime and Epenal) |
| D17 | **The login is proven at three levels** *(amended 2026-10-26 during the build; owner answer L)*. (1) `lib/auth/auth.db.test.ts` drives the real Better Auth handler, the one `/api/auth` passes requests to, through the whole flow (sign-in, 2FA set-up, code, session, sign-out) against the CI `db` job's Postgres. (2) `e2e/cms.spec.ts` checks in a browser everything that needs no staff account: off-mode 404s in the `ci` job; on preview-e2e the login page, noindex, axe, signed-out redirects, the generic error and the closed endpoints. Its full browser flow runs when an admin's credentials are given, which is done locally against Neon `dev`. (3) The owner signs in once on the preview with a real authenticator app. No e2e staff account or TOTP secret exists on preview. | The original plan (Playwright in the `db` job) cannot work: the runtime database client is `@prisma/adapter-neon`, which reaches Neon over WebSockets only, so `next start` in CI cannot use a plain Postgres. This keeps the owner's intent: no standing preview account or extra secret. | Owner answers I, L |
| D18 | **Merge gate** beyond the roadmap check: `/security-review` on the branch's diff; Lighthouse on `/cms/login` (accessibility and best practices ≥ 90, SEO skipped because it is `noindex`); the rotation runbook gets `BETTER_AUTH_SECRET`; the security checklist records the lockout and rate-limit items. | The owner's choice. A keyboard and NVDA pass was not chosen. | Owner answer J |
| D19 | **Impersonation is switched off for good.** The admin plugin's `/admin/impersonate-user` and `/admin/stop-impersonating` are in `disabledPaths`. Its other endpoints stay, admin-only, for Phase 33. | Impersonation would let one admin act as another staff member, outside the audit trail. | Claude's call |
| D20 | **Security logs.** Failed sign-ins, failed 2FA codes, lockouts and 429s are logged as one structured line each (`auth.sign_in_failed`, `auth.2fa_failed`, `auth.lockout`, `auth.rate_limited`), with the user ID when known and the hashed IP, and never an email address or a password. | "Failed logins appear in security logs from Phase 24" (tech-stack, Monitoring row). On Vercel Hobby, runtime logs last 1 hour, so `AuditEvent` (Phase 25) is the lasting record. | tech-stack |
| D21 | **Defence in depth on `/api/auth`** *(added 2026-10-26 during the build)*. (a) The route passes only an **allowlist** of endpoints to Better Auth (`lib/auth/paths.ts`): get-session, sign-in, sign-out, change-password, and the 2FA set-up and verify endpoints. Every other path is a 404, including any endpoint a Better Auth upgrade adds, and `/two-factor/disable` and the OTP endpoints join `disabledPaths`. (b) A POST whose `Origin` is not in `trustedOrigins` gets 403 before Better Auth sees it, because Better Auth checks the Origin only on requests that carry cookies. (c) `advanced.disableOriginCheck` and `disableCSRFCheck` are set to `false` explicitly, because Better Auth skips its origin check by default when it detects a test run. | Better Auth registers about 50 endpoints (social sign-in, account deletion, email change, the admin API); Phase 24 uses 9. A denylist would quietly open whatever an upgrade adds. Staff must not switch their own 2FA off. | Claude's call |

### Owner answers (2026-10-26)

| | Question | Answer |
| --- | --- | --- |
| A | ✎ icon on every editable block | Always visible |
| B | Rate-limit storage | Our own limiter (salted hashes) |
| C | 2FA set-up | Forced on first sign-in, no trusted devices |
| D | Password reset | Admin script, no email |
| E | Production | `CMS_ENABLED` off in production |
| F | First admin | Random password written to a file |
| G | `/cms` after sign-in | Minimal placeholder |
| H | Lockout counts | Passwords and 2FA codes |
| I | Proving the login | CI Playwright plus the owner's check on preview |
| J | Merge gate | `/security-review`, Lighthouse on `/cms/login`, runbook and checklist |
| K | QR code | Add `qrcode` |
| L | Proving the login, once CI's Playwright couldn't reach a database (asked during the build) | API tests, plus CI browser checks that need no database, plus the owner's sign-in on the preview |

## Constraints

- **C1 Expand first.** The Better Auth tables, columns and grants ship in their own PR (`feature/phase-24-auth-schema`) and are migrated on `preview` before the feature PR, because schema PRs fail preview-e2e until their migration is live (Phases 12, 19, 23). The expand PR contains no code that reads the tables.
- **C2 Public pages stay static.** The build's route table shows no public route changing mode. `/cms/*` is dynamic.
- **C3 Dependencies:** only `better-auth` 1.7.x, `qrcode` 1.5.x and its `@types/qrcode` (dev). The Better Auth CLI runs through `pnpm dlx`.
- **C4** The owner's uncommitted `---` edit in `roadmap.md` is never staged.
- **C5** Steps marked **(owner)** are the owner's: running the scripts with branch credentials, setting Vercel env vars and merging.
- **C6 For Phase 25:** `requireRole()` must also refuse a session whose user has not finished setting up 2FA (D7). Phase 24 enforces this only in the `/cms` layout.
