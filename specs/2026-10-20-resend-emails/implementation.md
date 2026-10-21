# Implementation log — Phase 20 Resend emails

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

## Progress

- **2026-10-20** — Branch `feature/phase-20-resend-emails` created from `develop` at `a360ce3`. Owner answers A–I given; spec, plan and validation drafted for approval.

- **2026-10-20** — Owner approved the spec ("GO AHEAD"). Owner added the Preview `RESEND_API_KEY` in the Vercel dashboard (confirmed with `vercel env ls preview`: Preview only).
- **2026-10-20** — Plan 0.1–0.2: roadmap Phase 20 row and amended "Done when", open questions 2 and 3; tech-stack Email row, *Security baseline* (abuse, least-privilege, monitoring and rotation rows), monitoring tool row, *Environment variables* (prose and dotenv block).
- **2026-10-20** — Plan 1.1 (partly): `resend` 6.32.1 and `@react-email/components` 1.0.12, exact. `pnpm add` wrote the lockfile, then hung idle with no child process; it was stopped, the two entries were added to `package.json` by hand, and `pnpm install --frozen-lockfile` passed ("Lockfile is up to date"). **`pnpm audit --prod` not yet run.**
- **2026-10-20** — Plan 2.1–2.2: `lib/env.ts` D9 variables and rules, an `email` section on the parsed env; `env.test.ts` (70 pass). `.env.example` email block.
- **2026-10-20** — Plan 3.1–3.4: `lib/email/send-core.ts` + `send.ts` (`server-only`), `templates/{styles,team-notification,client-ack}.tsx`, `render.ts` (labels via `block()` and `projectTypeLabel`; `BUDGET_KEYS` / `TIMELINE_KEYS` now exported from `components/contact/inquiry-copy.ts`; Lagos time with `Intl`). Plain text: notes are split into `<br>` lines so html-to-text keeps the breaks, and `tel:` / `mailto:` links hide their href. Tests: `send-core.test.ts`, `render.test.ts` (14).
- **2026-10-20** — Plan 4.1–4.4: `submit-core.ts` (`save` returns the id; `ACK_LIMIT` checked after the save, a failed check only skips the ack; `notify` dep; `acknowledgment` on `success` in `fields.ts`), `notify-core.ts` + `notify.ts`, action wired with `after()`. Tests: `notify-core.test.ts` (9), `submit-core.test.ts` (ack cases), `submit.db.test.ts` (Resend unreachable keeps the row with `emailSentAt` NULL; `markSent` once; 3-a-day ack limit).
- **2026-10-20** — Plan 5.1–5.2: `contact.form.success.ack` and the conditional sentence in the success panel; `privacy.processors.body` names Resend "hosted in the United States" (the shared `resend.dev` sender sends from Resend's US region). `block.test.ts` lists the new key.
- **2026-10-20** — Plan 6.1–6.3: migration `20261020180000_readonly_inquiry_monitor` (column-level grant); `roles.db.test.ts` now checks no table privilege, the count by the two columns, and denial of every other column; `lib/monitor/unsent.db.test.ts` (window); `monitor-core.ts` check + `scripts/monitor.mts` query as its own check; monitoring runbook section.
- **2026-10-20** — Plan 7.1–7.2: rotation runbook `RESEND_API_KEY` row; release runbook *Turning the inquiry form on*.
- **2026-10-20** — Plan 8.2 (written, not yet run on a preview): `e2e/inquiry.spec.ts` expects the ack sentence when `E2E_INQUIRY_ACK=1` (set in `preview-headers.yml`) and none otherwise; the keyboard test now types a fresh `e2e-keyboard+<time>@example.com` per run, because of the 3-a-day ack limit.
- **2026-10-20** — Checks at the break: `tsc` clean, ESLint clean, Prettier clean, `vitest run` **1,497 passed** (36 files). Local replica of the CI `db` job on a throwaway `postgres:17` (`rhm-pg20`, port 55433, URLs checked as localhost): all 6 migrations applied, drift check clean, seed twice, `test:db` **40 passed** (8 files). Container and credentials removed after. **Not yet run:** `pnpm build`, `pnpm audit --prod`, e2e.
- **2026-10-21** — Plan 1.1 done: `pnpm audit --prod` reports no known vulnerabilities (owner ran it). Plan 8.1: the owner added the four Preview variables in Vercel (`EMAIL_FROM`, `INQUIRY_NOTIFICATION_EMAIL=redhatmediang@gmail.com`, `INQUIRY_ACK_ENABLED=1`, `EMAIL_REDIRECT_TO=delivered@resend.dev`). Build as in CI (form on with Cloudflare test keys, `DATABASE_URL` blank) passed; `/contact` is `○`. E2E against `next start` on Edge with `E2E_PORTFOLIO_STATE=unavailable`: 374 passed, 44 skipped, 3 failed. All three failures came from the run, not the code: Playwright's process lacked `INQUIRY_FORM_ENABLED=1`, which CI sets job-wide, so the specs expected the form to be off. Re-run of `contact.spec.ts` and `inquiry.spec.ts` with it set: 31 passed, 1 skipped (the form-off test).
- **2026-10-21** — PR #44 (`5c30e67`). All checks passed: `ci`, `db`, `gitleaks`, `preview-headers`, `preview-e2e` (with `E2E_INQUIRY_ACK=1`, so the success panel showed the confirmation sentence; plan 8.2), `lighthouse` and Vercel. Amended Done-when (D8): the agent read Neon `preview` (endpoint `ep-broad-haze` checked, as `rhm_app`, timestamps only). The `preview-e2e` submission `cmvhs94fl000207l0ng6dal3g` was created at 06:20:42.417Z, with `emailSentAt` at 06:20:42.694Z and `ackSentAt` at 06:20:42.868Z. The two older rows are Phase 19 submissions, from before emails, so both columns are NULL. `rhm_readonly` was not used, because the grant migration reaches `preview` only on the `develop` push.

## Deviations from plan

- **D8 result shape:** `sendEmail` resolves a `status` union (`sent` / `failed` / `skipped`) rather than `{ ok }`; spec D8 updated to match. Same behaviour.
- **Resend 6.32.1, not 6.34.x:** see spec, owner answer H (6.34 was four days old).

## Issues and fixes
