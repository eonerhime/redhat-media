# Plan — Phase 0 foundation

Scope, decisions (D1–D9) and constraints (C1–C5) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 1. Constitution first

- [x] 1.1 `tech-stack.md` *Supporting tools*: add lefthook (D4). Update the supply-chain row for a public repo (rulesets + push protection + CI branch check, D3).
- [x] 1.2 `tech-stack.md` *Security baseline*, Edge & transport: add the enforced minimal CSP + `X-Frame-Options` row (D8). Supply chain & secrets: replace the "`main` only accepts PRs from `develop`" row with the D3 controls, and note Dependabot activation at Phase 16 (C2).
- [x] 1.3 `tech-stack.md` *Environment variables*: document the per-phase env growth and the `NEXT_PUBLIC_SITE_URL` fallback (D7). Add `VERCEL_AUTOMATION_BYPASS_SECRET` as a GitHub Actions-only secret (D6).

## 2. Scaffold

- [x] 2.1 Delete `index.html` and `assets/` (scope 2).
- [x] 2.2 Run `pnpm create next-app@16.4` in place (D5), keeping `specs/`, `README.md` and `.vercel/`.
- [x] 2.3 Pin versions per C1. Set `packageManager` to `pnpm@12.9.1` (see implementation log) and `engines.node` to `>=24 <25`.
- [x] 2.4 Downgrade to TypeScript 6.0.x. Confirm `strict: true` and the `@/*` alias.
- [x] 2.5 Strip the demo content. `/` renders an empty placeholder (`<main>` with a heading "RedHat Media").
- [x] 2.6 Replace `.gitignore` per D1.

## 3. Tooling

- [x] 3.1 Add `pnpm` scripts: `dev`, `build`, `start`, `typecheck` (`tsc --noEmit`), `lint`, `test` (`vitest run`), `format`, `format:check`.
- [x] 3.2 ESLint flat config: `eslint-config-next` + `typescript-eslint`, `react/no-danger: error`, and bans on `$queryRawUnsafe` and `$executeRawUnsafe` (scope 5).
- [x] 3.3 Prettier config and ignore file. Run `pnpm format` once.
- [x] 3.4 Vitest config (node environment, `@/*` alias).

## 4. Env validation

- [x] 4.1 `lib/env.ts` with a Zod schema and the D7 fallback logic.
- [x] 4.2 Import it from `next.config.ts` so validation runs at build time.
- [x] 4.3 Unit tests: valid env passes; production without `NEXT_PUBLIC_SITE_URL` throws; a non-URL value throws.

## 5. Security headers

- [x] 5.1 `lib/security/headers.ts`: typed header list and CSP builders (report-only and enforced-minimal) per scope 4 / D8.
- [x] 5.2 Wire them into `next.config.ts` `headers()` for `/:path*`.
- [x] 5.3 Vitest: assert every required header, every report-only directive and the enforced-minimal directives. Also assert there is no `preload` in HSTS.

## 6. Git hooks

- [x] 6.1 Add lefthook. `lefthook.yml` pre-commit runs `gitleaks git --pre-commit --staged --redact`, plus Prettier check and ESLint on staged files.
- [x] 6.2 Add `.gitleaks.toml` (extends the default rules; allowlist `.env.example`).
- [x] 6.3 Make `pnpm install` install the hooks (`prepare` script or lefthook postinstall).

## 7. CI and Dependabot

- [x] 7.1 Add `.github/workflows/ci.yml` per scope 7, with actions pinned to commit SHAs, `permissions: contents: read` and pnpm caching.
- [x] 7.2 Add `.github/workflows/branch-check.yml` (a PR into `main` must have `develop` as its head).
- [x] 7.3 Add `.github/workflows/preview-headers.yml`, triggered on `deployment_status` with state `success` and a Preview environment. It curls the URL with the bypass header and asserts the headers (D6).
- [x] 7.4 Add `.github/dependabot.yml` (`npm` + `github-actions`, weekly, `target-branch: develop`).

## 8. Docs

- [x] 8.1 Add a project `CLAUDE.md` (scope 9).
- [x] 8.2 Add `.env.example` with `NEXT_PUBLIC_SITE_URL` and comments pointing to `tech-stack.md` for the variables later phases add.
- [x] 8.3 README: add a "Getting started" section with the commands, update §5 per D2, and remove the temporary "spec wins" note.

## 9. GitHub and Vercel setup (owner-confirmed steps)

- [ ] 9.1 **Ask the owner first:** push `develop` and the feature branch to `origin` (C3).
- [x] 9.2 Connect the Vercel project to the GitHub repo and confirm the production branch is `main` (D9).
- [ ] 9.3 Create the Vercel "Protection Bypass for Automation" secret and store it as the GitHub Actions secret `VERCEL_AUTOMATION_BYPASS_SECRET`.
- [x] 9.4 Turn on secret scanning and push protection in the repo settings.
- [ ] 9.5 Create rulesets for `main` and `develop` (D3), with required checks `ci` and `branch-check` (`main`) or `ci` (`develop`).

## 10. Verify and open the PR

- [ ] 10.1 Work through every item in [`validation.md`](validation.md).
- [ ] 10.2 Open the PR `feature/phase-00-foundation` → `develop`, linking this spec folder.
