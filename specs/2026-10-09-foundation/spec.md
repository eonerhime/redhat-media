# Phase 0 — Project foundation + security baseline

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 1, Phase 0
- **Branch:** `feature/phase-00-foundation` (from `develop`)
- **Started:** 2026-10-09

## What and why

Replace the static `index.html` with an empty Next.js 16 application that has the full security and quality baseline in place **before any feature exists**. Every later phase then inherits typed config, CI, secret scanning, security headers and a report-only CSP, and cannot ship without them (mission principle 9, "Secure from the first commit").

`main` keeps serving the current static page. This branch merges into `develop` only, and production changes at Phase 16.

## Constitution sections this phase relies on

- `tech-stack.md` → *Core* (version lines), *Supporting tools*, *Architectural rules* 7 (secrets) and 12 (CSP)
- `tech-stack.md` → *Security baseline*: every row with a "From" value of `0`. That covers Edge & transport (HSTS, headers, report-only CSP), Authorization & application (`dangerouslySetInnerHTML` ban), Database (`*RawUnsafe` lint ban) and Supply chain & secrets.
- `tech-stack.md` → *Schema decisions* (folded into README §5, see D2)

## Scope

1. **Scaffold.** Next.js 16.4, React 19.3, TypeScript 6.0.x (`strict: true`), Tailwind 4.3 (CSS-first) and ESLint 10 with `eslint-config-next` and `typescript-eslint`. Also Prettier, Vitest, pnpm (pinned through `packageManager`) and Node 24 (`engines`). Use the App Router with no `src/` directory and an `@/*` import alias. The page at `/` is an empty placeholder.
2. **Remove the static site from this branch.** Delete `index.html` and the empty `assets/`. Their copy is already recorded in the specs, and Phase 2 ports it.
3. **Env validation.** `lib/env.ts` validates with Zod, and `next.config.ts` imports it, so a bad env fails `pnpm build`. Phase 0 defines only `NEXT_PUBLIC_SITE_URL`. Later phases add their own variables when they need them (D7).
4. **Security headers and CSP** in a typed `lib/security/headers.ts`, consumed by `next.config.ts` `headers()` for all routes (D5):
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains`, with no `preload`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - `X-Frame-Options: DENY`
   - an **enforced** minimal CSP: `frame-ancestors 'none'; object-src 'none'; base-uri 'self'`
   - the full **`Content-Security-Policy-Report-Only`**:
     - `default-src 'self'`
     - `script-src 'self' 'unsafe-inline'`
     - `style-src 'self' 'unsafe-inline'`
     - `img-src 'self' data: blob: https://res.cloudinary.com https://i.ytimg.com https://i.vimeocdn.com`
     - `font-src 'self'`
     - `connect-src 'self'`
     - `frame-src https://www.youtube-nocookie.com https://player.vimeo.com`
     - `object-src 'none'`
     - `base-uri 'self'`
     - `form-action 'self'`
     - `frame-ancestors 'none'`
     - `upgrade-insecure-requests`
5. **Lint bans.** `react/no-danger` (`dangerouslySetInnerHTML`), plus `no-restricted-properties` / `no-restricted-syntax` on `$queryRawUnsafe` and `$executeRawUnsafe`, all as errors.
6. **Git hooks.** lefthook pre-commit runs `gitleaks git --pre-commit --staged`, and Prettier and ESLint on staged files (D4).
7. **CI (GitHub Actions, actions pinned to commit SHAs):**
   - `ci.yml`: on PRs into `develop` and `main`, and on pushes to `develop`. Runs `pnpm install --frozen-lockfile`, typecheck, lint, test, build, `pnpm audit --prod --audit-level high` and gitleaks.
   - `branch-check.yml`: a PR into `main` fails unless its head branch is `develop`.
   - `preview-headers.yml`: on a successful Vercel `deployment_status`, curls the preview URL and asserts the Phase 0 headers are served (D6).
8. **Dependabot.** `.github/dependabot.yml` for `npm` and `github-actions`, targeting `develop` (see constraint C2).
9. **Docs:**
   - Project `CLAUDE.md`: specs are the contract, commands, branch flow, local gitleaks install, "no secrets in `NEXT_PUBLIC_*`".
   - `.env.example`.
   - README: run instructions, plus §5 updated per D2.
10. **Constitution updates first** (spec-driven rule). `tech-stack.md` is amended for D3, D4, D5 and D6 before the matching code lands.

## Out of scope

- Design tokens, fonts, layout, header and footer (Phase 1). Copy and the `block()` helper (Phase 2).
- Database, Prisma, `RateLimitHit` and DB roles (Phase 7). The `*RawUnsafe` lint ban is added now, ahead of Prisma.
- A CSP reporting endpoint. Reports go to the browser console only. An endpoint would need rate limiting, which arrives in Phase 7.
- CSP enforcement beyond the minimal framing/object/base set (Phase 14). Turnstile sources (Phase 18).
- Vercel Analytics, Firewall rules, alerting and runbooks (Phase 15).
- Merging to `main`, and any production change (Phase 16).

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | Discard the uncommitted `.gitignore` change (it only duplicated `.vercel`). Phase 0 writes the Next.js `.gitignore`, which keeps `.vercel`, `.env*` (except `.env.example`) and `lib/generated/`. | Clean base for the branch. | User, kickoff Q (Spec) |
| D2 | README §5 gets only the **decided** schema changes: `ONLINE_PRESENCE`, `Inquiry.services[]`, the new `PortfolioItem` fields, `consentAt`/`ackSentAt`, and Better Auth tables in place of `StaffRole`. `BudgetRange` and the timeline enum appear with values marked "defined in the Phase 17 spec". `BRANDING` stays out until open question 6 is answered. The temporary "spec wins" note is removed. | Keeps the README contract accurate without guessing open answers. | User, kickoff Q (Spec) |
| D3 | The repo is **public**, so use native GitHub controls: rulesets on `main` and `develop` (PR required, required status checks, no force-push or deletion) and secret-scanning **push protection**. **Keep** the CI branch-name check and gitleaks as defence in depth. Required approvals are 0, because a sole owner cannot approve their own PR; the owner reviews by merging. | The private-repo workaround copied from Epenal does not apply. Layered controls still catch mistakes if the repo goes private. | User, kickoff Q (Spec) |
| D4 | Pre-commit via **lefthook** (dev dependency), running gitleaks plus Prettier and ESLint on staged files. Contributors install the gitleaks binary locally, as documented in `CLAUDE.md`. | Single fast binary that works well on Windows. | User, kickoff Q (Plan) |
| D5 | Scaffold with `pnpm create next-app@16.4` (TS, Tailwind, ESLint, App Router, no `src/`, `@/*`), then pin versions per `tech-stack.md`, downgrade TypeScript to 6.0.x and strip the demo assets. | Fastest, and matches upstream defaults. | User, kickoff Q (Plan) |
| D6 | Header test in two layers. (a) **Vitest** asserts every header and CSP directive in `lib/security/headers.ts`. (b) A CI job **curls the Vercel preview**. Previews sit behind Vercel Deployment Protection, so the job sends `x-vercel-protection-bypass` with a "Protection Bypass for Automation" secret stored as a GitHub Actions secret. | A fast unit check plus proof that the deployed response carries the headers. | User, kickoff Q (Plan); bypass detail added at kickoff |
| D7 | Env schema grows per phase. Phase 0 requires only `NEXT_PUBLIC_SITE_URL` when `VERCEL_ENV=production`. On previews and locally it falls back to `https://$VERCEL_BRANCH_URL` or `http://localhost:3000`. | Validating variables that no code uses yet would block builds for no benefit. Previews have per-branch URLs. | Kickoff analysis |
| D8 | Send an **enforced** minimal CSP (`frame-ancestors 'none'; object-src 'none'; base-uri 'self'`) and `X-Frame-Options: DENY` alongside the report-only policy. | Browsers ignore `frame-ancestors` in a report-only policy, so `tech-stack.md`'s "`frame-ancestors 'none'` from Phase 0" would otherwise not take effect. These three directives cannot break a Next.js page. | Kickoff analysis |
| D9 | Connect the Vercel project `redhat-media` to the GitHub repo, so each pushed branch gets a preview and `main` stays the production branch. | Preview deploys per branch are required for every phase's "Done when". | User, kickoff Q (Plan) |

## Constraints

- **C1 — Versions** (checked against npm 2026-10-09): `next` 16.4.0, `react`/`react-dom` 19.3.0, `typescript` 6.0.x (`typescript-eslint` peer `<6.1.0`), `tailwindcss`/`@tailwindcss/postcss` 4.3.3, `eslint` 10.x, `eslint-config-next` 16.4.0, `vitest` 5.x, `prettier` 3.x, `zod` 4.6.x, pnpm 12.9.1 (12.10.1 is blocked by the owner's Device Guard policy; see `implementation.md`).
- **C2 — Dependabot reads config from the default branch (`main`).** It stays inactive until Phase 16. Until then `pnpm audit` in CI is the dependency gate.
- **C3 — `develop` exists only locally.** Pushing it to `origin` (needed for the PR and the rulesets) requires the owner's go-ahead during implementation.
- **C4 — Turbopack is the default bundler.** No custom `webpack` config is allowed.
- **C5 — Vercel preview pages include the Vercel toolbar**, which can trigger report-only CSP console reports. These are expected and not counted as errors.
