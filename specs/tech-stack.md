# Tech Stack — RedHat Media Platform

This file is the approved list of technologies. Adding a library that is not listed here needs this file to be updated first (see README §2).

The current site is one static `index.html` with inline CSS and no build step. It is replaced in full by the stack below. Its copy, contact details and brand colours are carried over (see *Design tokens*).

## Core

Versions were checked against the npm registry on 2026-10-09. Phase 0 pins exact versions in `package.json` and the lockfile; later upgrades go through Dependabot PRs.

| Concern | Choice | Version line | Notes |
| --- | --- | --- | --- |
| Runtime | **Node.js LTS** | 24.x | Same major on local machines, CI and Vercel (`engines` field). |
| Framework | **Next.js (App Router)** + React | Next 16.4 / React 19.3 | Server Components by default, Server Actions for mutations. Turbopack is the default bundler for dev and build, so there is **no custom `webpack` config**. In Next 16 the request interceptor file is `proxy.ts` (formerly `middleware.ts`). |
| Language | **TypeScript**, `strict: true` | 6.0.x | No implicit `any`. Every server action's input and output is typed with Zod. **Do not adopt TS 7 yet**: `typescript-eslint` currently supports `<6.1.0`. Revisit when its peer range includes 7. |
| Styling | **Tailwind CSS** v4 | 4.3 | CSS-first configuration: `@import "tailwindcss"` plus an `@theme` block in `app/globals.css`, compiled by the `@tailwindcss/turbopack` loader (the Next 16.4 template default, wired in `next.config.ts`). There is no `tailwind.config.js` or PostCSS config. Design tokens are defined once in `@theme`. |
| Database | **Neon** (serverless PostgreSQL) | — | Separate branches for `main` (prod) and preview/dev. |
| ORM | **Prisma 7** | 7.10 | npm's `latest` tag currently points at **8.0.0-rc**. Pin `prisma` and `@prisma/client` to `^7`. Prisma 7 style:<br>• Schema in `prisma/schema.prisma`, with generator `prisma-client` (output `lib/generated/prisma`, git-ignored and generated in CI).<br>• CLI/migration URL in `prisma.config.ts` (`MIGRATOR_DATABASE_URL`, CI only).<br>• Runtime client through `@prisma/adapter-neon` + `@neondatabase/serverless` with `DATABASE_URL`. The exact `PrismaNeon` constructor is confirmed in the Phase 7 spec.<br>• Migrations are committed. |
| Validation | **Zod** | 4.6 | Shared schemas in `lib/validation/`, used by both forms and server actions. Env vars are validated with Zod at startup. |
| Auth (staff only) | **Better Auth** (email + password, Prisma adapter, `admin` and `twoFactor` plugins) | 1.7 | Built-in session handling and rate limiting (database storage). Roles are `admin`, `editor` and `sales`. Public sign-up is disabled (`emailAndPassword.disableSignUp: true`). |
| Media: images | **Cloudinary** (`next-cloudinary`, `cloudinary` SDK on the server) | 6.19 / 2.11 | Signed uploads go straight from the browser to Cloudinary, which then handles delivery and responsive transforms. The database stores **public IDs**, not URLs. |
| Media: video | **Video by URL** (YouTube, Vimeo) | — | No video files are hosted. Videos are embedded with a lightweight click-to-play facade (see *In-place CMS* → video). |
| Email | **Resend** + React Email | 6.32 / 1.0 | Sends the team notification and the client acknowledgment. Requires a **verified sending domain**. `vercel.app` cannot be verified, so this depends on a custom domain (roadmap open question 2). |
| Bot protection | **Cloudflare Turnstile** (`@marsidev/react-turnstile`) | 1.6 | The widget runs on high-intent forms, and the token is verified on the server against `challenges.cloudflare.com`. |
| Hosting | **Vercel** (existing project `redhat-media`) | — | Preview deploy per branch, production from `main`. |

## Supporting tools

| Concern | Choice |
| --- | --- |
| Package manager | pnpm 12 (version pinned through `packageManager`). Dependency build scripts are denied by default; each one is listed in `pnpm-workspace.yaml` → `allowBuilds`. |
| Lint / format | ESLint 10 (flat config, `eslint-config-next`, `typescript-eslint`) + Prettier |
| Unit tests | Vitest (validation, utilities, video-URL parsing, rate limiter, server-action logic, auth guards) |
| E2E / smoke tests | Playwright (`@playwright/test`, Chromium), run in the CI `ci` job after `pnpm build`. From Phase 1: layout at 360/768/1440px, rendered contrast, reduced motion and mobile nav. Later: smoke test (Phase 15), portfolio → inquiry submit and edit-mode happy paths. |
| Fonts | `next/font` (self-hosted at build time, so there is no third-party font request and the CSP has no font host). **Archivo** (wordmark and headings) and **Inter** (body), both variable, `latin` subset, `display: swap`. |
| Analytics | Vercel Analytics + Speed Insights |
| Bot / spam protection | Turnstile (verified on the server) + honeypot + minimum time-to-submit + database-backed rate limit on every public form, from the first form (Phase 18). |
| Edge protection | Vercel Firewall (managed bot rules, plus custom rate-limit rules where the plan allows) and an Attack Challenge Mode runbook. |
| Git hooks | **lefthook** pre-commit: `gitleaks git --pre-commit --staged` (`protect` is deprecated), plus Prettier and ESLint on staged files. Contributors install the gitleaks binary locally (see `CLAUDE.md`). |
| Supply chain | Dependabot, **gitleaks** (CI + pre-commit), `pnpm audit --prod` in CI, pinned lockfile, GitHub Actions pinned to commit SHAs. The repo is **public**, so GitHub's native secret-scanning **push protection** and **rulesets** are used as well, with the CI checks kept as defence in depth. |

## Architectural rules

1. **Server-first rendering.** Public pages are Server Components, statically generated or ISR. **Public server components never read the login session**, so the pages stay static (see *In-place CMS*). Use client components only where interaction requires them: filters, the inquiry stepper, the lightbox, video facades and edit controls.
2. **Filter state lives in the URL** (`/portfolio?category=web-apps`). Filtered views can then be shared and indexed. Portfolio items have real pages at `/portfolio/[slug]`; the in-grid modal (Phase 22) is an intercepting route over the same URL, so deep links always work.
3. **Services are configuration, not database rows.** The six services are a typed config in `content/services.ts`, keyed by `ServiceCategory`, grouped into three pillars, with their copy read through `block()`:
   - **Production:** Photography, Videography.
   - **Growth:** Digital Marketing, Social Media Marketing, Online Presence Management.
   - **Build:** Web & App Development.
4. **Save first, then email.** The inquiry server action writes to Neon *before* calling Resend. An email failure is logged and shown to admins, and is never shown to the client as a lost submission.
5. **Server-side authorisation everywhere.** Every mutation (server action or route handler) starts with `requireRole(minRole)` from `lib/auth/guards.ts`. The role hierarchy is `sales` < `editor` < `admin`. The check re-reads the session and role from the database and returns a typed 401/403 result. `proxy.ts` may redirect `/cms` for UX only. The role the browser receives only decides whether edit controls appear; it is never trusted.
6. **Hidden staff entry at `/cms`.** The public site has **no login link, button or footer mention** of staff access.
   - A visitor who is not signed in and opens any `/cms/*` page is sent to `/cms/login`. After sign-in they go to the `/cms` dashboard, where "Edit site" opens `/` with editing turned on.
   - Every `/cms` page sends `noindex, nofollow` (both the meta tag and the `X-Robots-Tag` header) and is left out of `sitemap.ts`. It is **not** listed in `robots.txt`, because a `Disallow: /cms` line would advertise the path.
   - Login errors are generic ("Invalid email or password").
   - Hiding the path only reduces bot noise and is **not** a security control. Rule 5 still applies.
7. **Secrets** live only in Vercel environment variables. `.env.example` is committed and `.env*` files are git-ignored. Nothing prefixed `NEXT_PUBLIC_` may be a secret.
8. **Errors.** Every data-fetching route has a `loading.tsx` and an `error.tsx`. Server actions return typed `{ ok, error }` results and do not throw to the client. The client **always** checks the result, keeps the editor or form open on failure, and shows the error.
9. **SEO.** Use the Metadata API on every route, plus:
   - dynamic OpenGraph images for portfolio items and services;
   - `sitemap.ts` and `robots.ts`;
   - JSON-LD: `Organization` / `LocalBusiness` (Lagos), `Service` per service page, `CreativeWork` / `SoftwareApplication` per portfolio item, and `VideoObject` for embedded videos.
10. **Accessibility.** Semantic HTML, visible focus states, WCAG 2.2 AA contrast and `prefers-reduced-motion` respected. Every image has alt text, and the editor requires it. Every edit control is keyboard-reachable and labelled.
11. **Performance budget.** Mobile Lighthouse ≥ 90 on every public template. The LCP image is prioritised, every other image is lazy-loaded through Cloudinary responsive transforms, and no iframe loads before a click.
12. **Content Security Policy.** `img-src` allows Cloudinary and video-thumbnail hosts. `frame-src` allows only `www.youtube-nocookie.com`, `player.vimeo.com` and, from Phase 18, `challenges.cloudflare.com`.
13. **Cache refresh after writes.** Every CMS mutation refreshes the affected routes with `revalidatePath` / tag APIs. Next 16 offers `updateTag` for read-your-own-writes inside Server Actions; the exact API is confirmed in the Phase 27 spec.

## Design tokens (carried over from the current site)

Defined once in the `app/globals.css` `@theme` block. Tailwind's default colour palette is removed (`--color-*: initial`), so these are the only colours available.

| Token | Value | Use |
| --- | --- | --- |
| `--color-brand` | `#ed1c24` | Wordmark "RED", large display accents, focus rings |
| `--color-brand-deep` | `#d0181f` | Primary button fills |
| `--color-ink` | `#1a1a1a` | Page background (dark theme base) |
| `--color-fg` | `#f5f5f5` | Body text, headings, button labels |
| `--color-muted` | `#808285` | Wordmark "HAT", secondary text ≥ 16px, on `ink` only |
| `--color-line` | `#2e2e2e` | Decorative dividers and borders only, never text |

**Contrast (WCAG 2.x ratios, measured in Phase 1):**

| Pairing | Ratio | Allowed use |
| --- | --- | --- |
| `fg` on `ink` | 15.96 | Any text |
| `muted` on `ink` | 4.52 | Text ≥ 16px only. It drops to 4.03 on a lighter surface such as `#242424`, so it is never used off `ink`. |
| `brand` on `ink` | 3.97 | Large text (≥ 24px, or ≥ 18.66px bold), focus rings and UI parts only |
| `fg` on `brand` | 4.02 | Not for text. Buttons use `brand-deep`. |
| `fg` on `brand-deep` | 5.03 | Button labels |
| `brand-deep` against `ink` | 3.18 | Button edge (meets 3:1 for UI parts) |

An automated check (a Vitest pairing test plus a Playwright test of every rendered text element) enforces these from Phase 1.

**Logo:** there is no logo file (roadmap open question 1, answered 2026-10-09). The header keeps the CSS wordmark from the current site ("RED" in `brand`, "HAT" in `muted`, "MEDIA" underneath), set in Archivo. The favicon and Apple touch icon are generated with `next/og` `ImageResponse`.

## Security baseline (built in from Phase 0, not bolted on)

Every control below has a **"from" phase**. A phase is not done until its controls exist *and* are tested.

### Edge & transport

| Control | From |
| --- | --- |
| HTTPS only and HSTS (`max-age=63072000; includeSubDomains`). Add `preload` only once a custom domain exists and every subdomain is confirmed HTTPS. | 0 |
| Headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, mic and geolocation off) | 0 |
| Anti-framing, enforced from day one: browsers ignore `frame-ancestors` in a report-only policy, so a small **enforced** CSP (`frame-ancestors 'none'; object-src 'none'; base-uri 'self'`) and `X-Frame-Options: DENY` are sent alongside the report-only policy | 0 |
| CSP: a **static header CSP** set in `next.config.ts`, with no nonces, so pages stay static/ISR. `script-src` allows `'unsafe-inline'` for the Next.js bootstrap; Phase 14 assesses hash-based alternatives before enforcing. Report-only from Phase 0. **Enforced** from Phase 14 (self, Cloudinary, YouTube/Vimeo frames). Turnstile is added in Phase 18 along with its test. | 0 → 14 → 18 |
| Vercel Firewall bot rules, plus a runbook for Attack Challenge Mode during an attack | 15 |

### Abuse & brute-force protection

| Control | From |
| --- | --- |
| `lib/security/rate-limit.ts`: a Postgres-backed fixed-window limiter (`RateLimitHit` table). IPs are stored as SHA-256 hashes salted with `RATE_LIMIT_SALT`. **No in-memory limiters**, because each serverless instance would keep its own counts. | 7 |
| Public forms: Turnstile + honeypot + minimum time-to-submit + 5 per 10 min / 20 per day per IP. Errors are generic. | 18 |
| Auth (Better Auth): `rateLimit.storage: "database"`, plus strict `customRules` on `/sign-in/*`, `/forget-password`, `/reset-password` and `/two-factor/*` | 24 |
| Per-account lockout: 5 failed sign-ins lock the account for 15 min, whatever the IP. The lock is written to security logs (alerting from Phase 15) and becomes an `AuditEvent` once Phase 25 lands. An admin can unlock early from Phase 33. | 24 / 25 / 33 |
| Sign-in happens **only** through the client API to `/api/auth/*`. Never call `auth.api.signIn*` from a server action, because server-side calls skip Better Auth's rate limiting. | 24 |
| Every CMS mutation has a per-user rate limit (e.g. 60/min) to limit damage from a stolen session | 27+ |

### Authentication & sessions

| Control | From |
| --- | --- |
| No public sign-up. Staff join through single-use invite links that expire after 48h. | 24 / 33 |
| Passwords: minimum 12 characters, checked against breach lists (`haveIBeenPwned` plugin), hashed by Better Auth | 24 |
| **TOTP 2FA required for all staff.** Sales staff see client personal data, and editors can change the public site. | 24 |
| Sessions: secure, httpOnly, `SameSite=Lax` cookies with an 8h lifetime. A fresh session is required for sensitive actions (role changes, user management). Sessions are revoked when a user is deactivated or resets their password. | 24 / 33 |
| `trustedOrigins` pinned to the production and preview domains. Next.js server actions also check the request origin, which blocks cross-site form attacks (CSRF). | 24 |

### Authorization & application

| Control | From |
| --- | --- |
| `requireRole()` at the start of every mutation, plus a **CI check that fails on unguarded server actions** (with an allowlist for public actions such as the inquiry form) | 25 |
| Zod on every input, with explicit length caps. Fixed lists of allowed keys and fields for CMS writes. | 17 / 27 / 31 |
| `AuditEvent` on every mutation (actor, action, entity, diff) | 25 |
| Uploads: server-signed Cloudinary uploads with a fixed folder, format and size limit. The folder is checked again before attaching. | 28 |
| No fetches to user-supplied URLs (prevents SSRF). Video handling extracts the ID and calls only fixed endpoints (`img.youtube.com`, `vimeo.com/api/oembed.json?url=https://vimeo.com/{id}`). | 8 / 30 |
| `dangerouslySetInnerHTML` is banned by lint; React escapes all rendered output, and the bold-only renderer builds elements, not HTML. Email templates escape user input and never place it in headers or the subject line. | 0 / 20 |
| External portfolio links (`liveUrl`, `repoUrl`) must be `https:`, are validated with Zod, and are rendered with `rel="noopener noreferrer"` | 9 |

### Database security & data protection (Neon + Prisma)

| Control | From |
| --- | --- |
| **Least-privilege roles:**<br>• `rhm_app` (runtime) has SELECT/INSERT/UPDATE/DELETE on app tables only. It has no DDL rights and owns no table.<br>• `rhm_migrator` owns the schema and is used **only** by CI migrations. Its direct connection string is a GitHub Actions secret and is never set in Vercel.<br>• `rhm_readonly` is for support and reporting. | 7 |
| The migrator runs `ALTER DEFAULT PRIVILEGES`, so tables created later automatically grant DML to `rhm_app`. Better Auth tables are generated into `schema.prisma` with the Better Auth CLI and applied through **Prisma migrations**. Better Auth's own migrate command is never run against the database. | 7 / 24 |
| TLS is required on every connection (`sslmode=require`), and Neon encrypts data at rest | 7 |
| **SQL injection:** Prisma queries are parameterised. `$queryRawUnsafe` and `$executeRawUnsafe` are **banned by ESLint**; raw SQL is allowed only through tagged `$queryRaw` templates. | 0 / 7 |
| The DB client module imports `server-only`, so it can never reach a client bundle | 7 |
| Migrations run as `prisma migrate deploy` from CI only, and are reviewed in PRs. **`prisma db push` and manual DDL against production are forbidden.** | 7 |
| Production is a Neon **protected branch**. Preview and dev branches hold **seed data only**. | 7 / 16 |
| Backups: Neon point-in-time restore (window confirmed for the chosen plan), a **restore rehearsal** before go-live, then a quarterly drill | 7 / 16 / 35 |
| Neon and Vercel console access: named accounts only, 2FA required, fewest possible members | 7 |
| **Personal data (Nigeria Data Protection Act 2023):**<br>• Inquiries hold personal data, so access is restricted to `sales` and above.<br>• IPs are stored only as salted hashes.<br>• Consent to the privacy notice is recorded on submit (`consentAt`).<br>• **Retention:** closed inquiries are anonymised after 24 months, and rate-limit rows are purged after 30 days (scheduled job). | 17 / 18 / 23 / 32 |
| Monitoring: alerts on Neon connection saturation and unusual query volume. Failed logins appear in security logs. | 15 |

### Supply chain & secrets

| Control | From |
| --- | --- |
| Secrets only in Vercel env (separate values for Production and Preview), Zod-validated at startup, never `NEXT_PUBLIC_*` | 0 |
| gitleaks secret scanning (CI + lefthook pre-commit) and GitHub secret-scanning push protection. `pnpm audit --prod` in CI fails on high/critical findings. Dependabot is configured from Phase 0, but GitHub reads its config from the default branch (`main`), so it only becomes active at Phase 16. Until then `pnpm audit` is the dependency gate. | 0 / 16 |
| GitHub **rulesets** on `main` and `develop`: a PR is required, required status checks must pass, and force-push and deletion are blocked. `main` additionally requires the CI `branch-check`, so only PRs from `develop` can merge. Required approvals are 0, because a sole owner cannot approve their own PR; the owner reviews by merging. | 0 |
| Vercel preview responses are checked by CI for the required headers, using a "Protection Bypass for Automation" secret held only in GitHub Actions | 0 |
| Secret rotation runbook (DB, Better Auth, Cloudinary, Resend, Turnstile) | 15 |

### Pre-launch security checklist (Phase 15 gate, repeated at 23 and 34)

- [ ] All headers present, and the CSP enforced with no violations
- [ ] Rate-limit, Turnstile, honeypot and lockout tests green (where the feature exists)
- [ ] Authorization tests cover every server action, and the unguarded-action CI check passes
- [ ] Least-privilege DB role in use, migrator credentials absent from the runtime, production branch protected, restore rehearsed
- [ ] No `*RawUnsafe`, `dangerouslySetInnerHTML` or `NEXT_PUBLIC_` secrets
- [ ] Dependency audit clean (no high or critical findings)
- [ ] Alerting tested, and the Firewall and rotation runbooks written
- [ ] `/security-review` findings resolved or accepted in writing

## In-place CMS ("Editing: On/Off")

This follows the same pattern as the Epenal Group platform, which fixed known gaps in the `memories-r-us` and `cecilia-onerhime` reference projects.

### Roles

| Role | Can do |
| --- | --- |
| `sales` | Inquiry inbox in `/cms`: view inquiries and change their status. No edit toggle. |
| `editor` | Everything `sales` can, plus the edit toggle: text blocks, images, videos and portfolio items. |
| `admin` | Everything `editor` can, plus staff user management and the audit log. |

### How it works

1. **`EditModeProvider`** (client) is mounted in the `(public)` layout. After the page loads in the browser, it calls `GET /api/cms/session`, which is `no-store` and returns `{ role }` or `{ role: null }` with a 200. Public pages therefore stay static.
2. When the role is `editor` or higher, a fixed bottom-right **"Editing: On / Off"** pill appears, with "CMS" and "Sign out" links. Its state and the last-known role are cached in `sessionStorage` and read only after the page has loaded, so the pill does not flicker on navigation.
3. Only one editor popover can be open at a time. Escape closes it.
4. **Text, `<Editable blockKey fallback multiline richText>`**:
   - Saves through server action `updateContentBlock`. The action checks `requireRole("editor")`, then a Zod check that the key matches `^(home|about|services|portfolio|contact|footer)\.[a-zA-Z0-9.]+$` and that the value is ≤ 5,000 characters. It then upserts and refreshes the affected routes.
   - Saving an empty value deletes the row, so the page falls back to its default.
   - Defaults live in `content/defaults.ts`, read through `block(key)`. This applies from Phase 2, so turning on editing later needs no rewrite.
5. **Images, `<EditableImage slot>` and `<EditableGallery owner>`**:
   - Editors can upload, replace, delete, drag-to-reorder, and edit **alt text** (required) and captions.
   - The server action `signCloudinaryUpload` **fixes the folder** (`rhm/{ownerType}/{ownerId}`), the allowed formats (jpg, png, webp, avif) and a 15 MB maximum.
   - `attachMedia` verifies the returned public ID sits under that folder before saving.
   - Replace and delete call Cloudinary `destroy` on the old asset after the database change, and any failure is logged.
6. **Video by URL**:
   - Server action `attachVideo` accepts only YouTube (`watch`, `youtu.be`, `/shorts/`, `/embed/`) and Vimeo (`vimeo.com/{id}`, `player.vimeo.com/video/{id}`). Anything else is rejected with a clear error.
   - The database stores the provider, the video ID and the canonical URL, never embed HTML.
   - Public rendering is a thumbnail facade. The `<iframe>` (`youtube-nocookie.com`, `player.vimeo.com`) is injected only on click.
7. **Portfolio items in place**:
   - Pencils on detail fields map to `updateRecordField`, with a fixed list of editable fields and a typed Zod schema per field.
   - Editors toggle Draft/Published and Featured on cards.
   - "Add item" opens a modal. Delete asks for confirmation and removes the item's Cloudinary assets.
8. **After every change:** refresh the affected routes (rule 13) and write an `AuditEvent`.

## Schema decisions (changes vs. README §5)

These are deliberate departures from the README blueprint. README §5 is updated to match in Phase 0.

| Change | Reason |
| --- | --- |
| `ServiceCategory` gains **`ONLINE_PRESENCE`**. `BRANDING` is kept out until confirmed (roadmap open question 6). | The current site sells Online Presence Management, and the README enum omitted it. Enums list only services RHM actually sells. |
| `Inquiry.selectedService` becomes **`services ServiceCategory[]`** (at least one) | The scope selector lets a client ask for several services at once (e.g. a launch video plus a website). |
| `Inquiry.budgetRange` becomes a **`BudgetRange` enum**. Add `timeline` (enum), `consentAt` (DateTime) and `ackSentAt` (DateTime?); keep `emailSentAt` for the team notification. | Gives typed, reportable scope. Records consent under NDPA, and tracks both emails separately. |
| `PortfolioItem` adds `client String?`, `credit String?` (e.g. "Technical lead: Emo Onerhime"), `highlights String[]` (architecture / outcome bullets) and `publishedAt DateTime?`. `repoUrl` is shown only for public repositories. | Supports the "RHM Web & App work, credited" framing and drafts before publishing. |
| README's `StaffRole` enum is replaced by Better Auth's `user` / `session` / `account` / `verification` / `twoFactor` tables. The `role` text column is restricted to `admin`, `editor` or `sales` by a CHECK constraint and a TS union. Add `failedSignInCount`, `lockedUntil` and `deactivatedAt` on `user`. | These tables are generated by the Better Auth CLI, and the `admin` plugin stores the role as text. The lockout hook API is confirmed in the Phase 24 spec. |
| `requireRole(minRole)` uses a **hierarchy** instead of the README's role arrays | One guard style that is simple to audit. `requireRole("sales")` lets editors and admins through as well. |
| `MediaOwner.SERVICE` media uses `ownerId = ServiceCategory` value. There is **no `Service` model**. | Services are config (rule 3). Only their media and copy are editable. |
| `RateLimitHit`, `ContentBlock`, `MediaItem` and `AuditEvent` stay as in the README | Already match the Epenal-proven design. |

## Environment variables

`lib/env.ts` validates variables with Zod at build time. The schema **grows per phase**: a variable becomes required in the phase that first uses it, never earlier. `NEXT_PUBLIC_SITE_URL` is required when `VERCEL_ENV=production`. On previews it falls back to `https://$VERCEL_BRANCH_URL`, and locally to `http://localhost:3000`.

GitHub Actions-only secrets (never in Vercel): `MIGRATOR_DATABASE_URL` (Phase 7) and `VERCEL_AUTOMATION_BYPASS_SECRET` (Phase 0, used by the preview header check).

```dotenv
NEXT_PUBLIC_SITE_URL=          # canonical origin, e.g. https://redhat-media.vercel.app
DATABASE_URL=                  # Neon pooled connection, rhm_app role (runtime)
# Migrations: CI runs `prisma migrate deploy`; prisma.config.ts reads MIGRATOR_DATABASE_URL
# (rhm_migrator direct connection, GitHub Actions secret only, never in Vercel).
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_API_KEY=  # public; required by the signed upload widget
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
INQUIRY_NOTIFICATION_EMAIL=    # team inbox(es) for new inquiries
EMAIL_FROM=                    # e.g. "RedHat Media <hello@<verified-domain>>"
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
RATE_LIMIT_SALT=               # random 32+ bytes; used to hash IPs
```
