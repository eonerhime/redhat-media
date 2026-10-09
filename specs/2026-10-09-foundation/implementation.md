# Implementation log — Phase 0 foundation

## Progress

- **2026-10-09** — Plan groups 1–8 done locally.
  - Constitution amended first: `tech-stack.md` updated for D3, D4, D6, D7 and D8, and for the deviations below.
  - Scaffolded with `pnpm create next-app@16.4.0 rhm --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm --skip-install --disable-git --yes` in a scratch directory, then copied in. `create-next-app` refuses a non-empty directory.
  - `lib/env.ts` (Zod, D7), `lib/security/headers.ts` (scope 4, D8) and their Vitest suites (17 tests).
  - ESLint bans: `react/no-danger`, plus `no-restricted-properties` on `$queryRawUnsafe` and `$executeRawUnsafe`.
  - lefthook pre-commit (gitleaks, Prettier, ESLint), installed by `scripts/install-hooks.mjs` through `prepare`. It is skipped in CI, on Vercel, and when there is no `.git`.
  - Workflows: `ci.yml` (jobs `ci` and `gitleaks`), `branch-check.yml` and `preview-headers.yml`. `preview-headers.yml` runs `scripts/check-preview-headers.mts`, which imports the same headers module as the unit test.
  - Also added Dependabot config, a project `CLAUDE.md`, `.env.example`, and README §5 (D2) plus §7 Getting Started.
- **Local results:**
  - `pnpm install --frozen-lockfile`, `typecheck`, `lint`, `format:check`, `test` (17/17) and `build` all pass.
  - `pnpm audit --prod --audit-level high` reports no known vulnerabilities.
  - `/` is prerendered as static.
  - `pnpm start` plus `node scripts/check-preview-headers.mts http://localhost:3123/` shows all 7 headers served with their exact values.
- **Negative tests run locally:**
  - The production build without `NEXT_PUBLIC_SITE_URL` fails ("Required when VERCEL_ENV=production").
  - `NEXT_PUBLIC_SITE_URL=not-a-url` fails ("Invalid URL").
  - Lint reports 3 errors on a probe file (both raw-unsafe calls, including the destructured form, and `dangerouslySetInnerHTML`).
  - Deleting the `X-Content-Type-Options` header fails the Vitest suite.

## Deviations from plan

| Item | Planned | Actual | Reason |
| --- | --- | --- | --- |
| pnpm pin (C1, plan 2.3) | `pnpm@12.10.1` | `pnpm@12.9.1` | The owner's organisation **Device Guard policy blocks the pnpm 12.10.1 binary** that pnpm downloads to honour `packageManager`. 12.9.1 is the installed, permitted version. Revisit when IT allows newer pnpm builds. |
| Tailwind integration | `@tailwindcss/postcss` | `@tailwindcss/turbopack` loader in `next.config.ts` | This is the Next 16.4 template default, and it needs no PostCSS config. `tech-stack.md` is updated. |
| gitleaks hook command | `gitleaks protect --staged` | `gitleaks git --pre-commit --staged` | `protect` is deprecated in gitleaks 8.x (gitleaks docs via ctx7). |
| `typecheck` script | `tsc --noEmit` | `next typegen && tsc --noEmit` | `LayoutProps` and other route types are generated globals, so tsc fails without typegen. |
| Next config | Not specified | Kept the template's `cacheComponents: true` and `partialPrefetching: true` | Upstream 16.4 defaults. Static header CSP is compatible: nonces would force dynamic rendering (bundled Next CSP guide). |
| lefthook build script | Not specified | Denied in `pnpm-workspace.yaml` → `allowBuilds`. Hooks are installed by `prepare` instead. | pnpm 12 fails installs on unreviewed build scripts. The hook installer runs lefthook's JS entry with `node`, so no shell is needed. |
| Vercel framework | Project setting | `vercel.json` with `"framework": "nextjs"` | The project was created for the static site. A per-branch file avoids breaking `main` redeploys before Phase 16. |
| `tsconfig.json` | Template | Added `allowImportingTsExtensions` | `scripts/check-preview-headers.mts` imports `../lib/security/headers.ts` with its extension, so Node 24 can run it with native type stripping. |

## Issues and fixes

- `pnpm add` failed with `ERR_PNPM_IGNORED_BUILDS` for lefthook. Fixed by listing it as `false` under `allowBuilds` (see deviations).
- The first version of `install-hooks.mjs` used `shell: true` on Windows, which triggers Node's DEP0190 warning. It now calls `process.execPath` with lefthook's JS entry.
- Node prints `MODULE_TYPELESS_PACKAGE_JSON` when the header-check script imports `headers.ts`. This is harmless, and the CI log will show it. A `"type": "module"` switch was not made in Phase 0.
- While `pnpm format` was running, the harness reported that `../epenal/specs/tech-stack.md` had changed. Investigation showed its mtime (18:19:02) was before the format run, and `git status` in epenal shows no content change. It was caused by activity in that repo, not by this phase. This repo has no symlinks.

### 2026-10-09 (cont.)

- gitleaks 8.30.1 installed with `winget install Gitleaks.Gitleaks --source winget`. The `msstore` source failed with a certificate mismatch, so the winget source was used. Device Guard did not block it.
- **Hook bug found by the negative test:** the multi-line `run:` block in `lefthook.yml` failed with a shell syntax error on Windows. The "blocked" result was therefore a false pass. The gitleaks step moved to `scripts/gitleaks-staged.mjs` (no shell; fails closed on `ENOENT`). Re-tested with three cases:
  - gitleaks missing from PATH: blocked, with a setup message.
  - Random fake AWS key staged: "leaks found: 2", hook exit 1.
  - Clean file staged: "no leaks found", exit 0.

  The probe file was unstaged and deleted, and was never committed.
- The owner confirmed that Vercel is already connected to GitHub, with `main` as the production branch (plan 9.2).
- PR #1 opened. On the first run `ci` (every step, confirmed in the log) and `gitleaks` passed.
- **Vercel preview failed** with: `No Output Directory named "public" found`. The Vercel project still had the old static-site preset (`framework: null`). Fixed with a committed `vercel.json` (`"framework": "nextjs"`) rather than a project-wide setting change. `main` (still the static site) keeps its current behaviour until Phase 16, when `vercel.json` reaches it. Added to the deviations below.
- Vercel CLI logged in by the owner. The project has `ssoProtection: all_except_custom_domains`, so previews need the bypass. An automation bypass was generated with `vercel api PATCH /v1/projects/{id}/protection-bypass` (note "GitHub Actions preview-headers check (Phase 0)") and piped straight into `gh secret set VERCEL_AUTOMATION_BYPASS_SECRET`. The value was never printed or written to disk (plan 9.3).
