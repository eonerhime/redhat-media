# Implementation log — Phase 24 Better Auth + roles

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

## Progress

- **2026-10-26** — Branch `feature/phase-24-better-auth` created from `develop` at `e7b028b`. Before the interview, the in-place CMS design was checked against memories-r-us, cecilia-onerhime and the Epenal spec. All three match ours (an Editing: On/Off pill and a separate back office), but our spec had lost the per-block ✎ icon (D16). Owner answers A–K given; spec, plan and validation drafted for approval.
- **2026-10-26** — Owner approved the build ("build it"). Expand PR built on `feature/phase-24-auth-schema` (plan 1.1–1.4):
  - `tech-stack.md`: the Auth and `qrcode` stack rows, the Abuse, Authentication and least-privilege rows, *Environment variables* (`CMS_ENABLED`, `BETTER_AUTH_SECRET`; `BETTER_AUTH_URL` dropped) and *In-place CMS* 3 (the ✎ button).
  - `lib/auth/options.ts` and `lib/auth/roles.ts`; the models generated with `npx auth@1.7.12 generate`, then tidied by hand: `role` is required with default `sales`, `failedSignInCount` is non-null, and the CLI's CRLF line endings and detached comments were reverted.
  - Migration `20261026000000_auth`: `prisma migrate diff` output for the five tables, plus hand-written CHECK constraints (`role`, `failedSignInCount ≥ 0`) and `REVOKE ALL … FROM rhm_readonly` (D15). New `lib/db/auth-grants.db.test.ts`.
  - Checked locally on a throwaway Postgres 18 cluster with the CI `db` job's steps (bootstrap, `migrate deploy`, no drift, seed, `test:db`: 11 files / 64 tests passed). Unit tests (37 files / 1,524), typecheck, lint and format pass. `pnpm db:migrate` applied `…_auth` to Neon `dev`.

## Deviations from plan

- **Better Auth 1.7.12, not 1.7.13.** `pnpm add better-auth@1.7.13` added `minimumReleaseAgeExclude` entries to `pnpm-workspace.yaml`, because 1.7.13 (2026-10-25) was inside pnpm 12's default release-age cooldown. Rather than weaken that supply-chain control, the change was reverted and 1.7.12 (2026-10-20) pinned. Move to a newer 1.7.x through Dependabot.
- **The CLI is the `auth` package.** `@better-auth/cli` stops at 1.4; from 1.5 the CLI is published as `auth` from the better-auth repository. `npx auth@1.7.12` was used, matching the library.
- **Wrong 2FA codes use the plugin's lockout (spec D4 amended).** Better Auth 1.7's `twoFactor` plugin has a per-account `accountLockout` for codes (default 10 / 15 min). It is set to 5 / 15 min instead of hand-writing hooks on the verify paths. The sign-in hook refuses while either lock is active, so owner answer H still holds. One difference: password and code failures are counted separately (5 of each), not in one shared count.

## Issues and fixes

- **pnpm hangs after writing the lockfile** (as on 2026-10-20). `pnpm add` and `pnpm install` wrote `pnpm-lock.yaml` and `node_modules`, then sat idle until the timeout, and `--frozen-lockfile --offline` hung the same way. The `better-auth` entry in `package.json` was added by hand. CI's `pnpm install --frozen-lockfile` is the lockfile check.
