# Implementation log — Phase 17 Inquiry data model

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

- **2026-10-20** — Branch `feature/phase-17-inquiry-model` created from `develop` at `3ec01ff`. Spec, plan and validation drafted for approval.
  - Owner answers A–C (budget bands, timeline, phone required) given before drafting; they close roadmap open question 8 and the budget/timeline half of open question 7.
  - `rhm_readonly` is used only by the monitor (`pg_stat_*` views) and the restore runbook (`PortfolioItem` / `MediaItem` counts), so D4's `REVOKE` on `Inquiry` breaks neither.
  - Zod 4.6 error customisation checked on context7 (`/colinhacks/zod/v4.6.5`): every check takes a message string or `{ error }`, and `.refine` takes `{ error, path }`.
- **2026-10-20** — Owner approved the spec ("go ahead"). Built plan sections 0–3.
  - Constitution: roadmap open questions 7 (answered for Phase 17; packages stay open) and 8 (answered); README §5 enums and phone comment; `tech-stack.md` *Schema decisions* row and the `rhm_readonly` note on the least-privilege roles row (now "7 / 17").
  - Migration `20261020000000_inquiry` created on Neon `dev` (`ep-purple-mountain`) with `--create-only`, folder renamed from the generated timestamp, header comment and `REVOKE` appended, then applied to `dev`. Prisma 7's `migrate dev` does not regenerate the client, so `prisma generate` was run by hand.
  - **Departure (D6, spec amended):** `toE164` checks `+234` numbers for exactly 10 digits after the country code and drops the trunk `0` written after it (`+234 (0)803…`). Without this, `+234 0803 123 4567` would have been stored as a 14-digit number nobody can dial.
  - **Spec wording (D5):** `consent` is a boolean that Phase 18 builds from the checkbox; blank optionals parse to `undefined` and are saved as `NULL` by `toInquiryData`.
  - Control-character checks use Unicode property classes (`\p{Cc}`, `\p{Zl}`, `\p{Zp}`) rather than `\u` ranges, so the source holds no raw separator characters.
  - Checks so far: `tsc` 0 errors; ESLint 0 warnings; Prettier clean; `vitest run` 29 files, **1,036 passed** (inquiry 64); `next build` passes with the same routes as before (no new route, C3).
  - `test:db` run locally as a copy of the CI `db` job, on a throwaway `postgres:17` container (port 55432; every URL checked to be `localhost` first): roles bootstrapped, `migrate deploy` applied all 4 migrations, the drift check found no difference, seed ran twice, **5 files, 30 tests passed**, including `rhm_readonly has no privilege on Inquiry`. Container and credentials file removed afterwards.
  - `test:e2e` against `next start` on port 3217 (`PW_CHANNEL=msedge`, `--workers=1`; run by a delegated subagent, result and server shutdown checked): **381 passed, 11 skipped, 0 failed** in 8.2 min. The skips are the conditional ones (unavailable-state, production-release and dev-page tests). Plan 4.1 done.
