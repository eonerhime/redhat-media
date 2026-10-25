# Validation — Phase 23 Homepage live data + Milestone 2 release

## Roadmap success check ("Done when", verbatim)

> The homepage reflects the `featured` flags. A test inquiry succeeds in production, and the retention job runs on a schedule.

- [x] **Featured flags:** on the seeded preview and on production, `/` shows the featured, published items (SportsPred, AfroJamz, toutMessages today) in portfolio order, at most 3, and no unfeatured item (D1).
- [x] **Test inquiry:** a production inquiry is saved, `emailSentAt` is set, and the Gmail notification arrives. The row is then deleted and the next monitor run is green (D13).
- [ ] **Scheduled job:** a dispatched `retention` run and the next scheduled run are both green, and each prints only the two counts (D8, D9).

## Homepage

- [x] With no database (the `ci` build), `/` shows the heading, body and "See the portfolio" link, no cards and no error (D2).
- [x] Each card links to `/portfolio/{slug}`, and following it from `/` opens the full page with no dialog (D4).
- [x] The build's route table shows `/` as `○` and no other route changed mode (C2).
- [x] `/` passes the existing a11y and contrast e2e checks at 360px, 768px and 1440px, with no horizontal scroll.
- [x] PageSpeed Insights mobile on production `/`: ≥ 90 performance, no audit skipped (C5).

## Retention job

- [x] `retention.db.test.ts` passes in the `db` job: the anonymise and purge cases of plan 3.2, including idempotence.
- [x] `retention-grants.db.test.ts` passes: `rhm_retention` cannot read personal columns, cannot delete inquiries, cannot read other tables, and cannot run DDL (C4).
- [x] A dispatch with `test_alert` fails with "TEST ALERT — not an incident", and the failure email reaches the owner (D10).
- [x] The workflow log holds no personal data, only the counts (C4).
- [x] `RETENTION_DATABASE_URL` exists only in the `retention` GitHub environment, which is limited to `main`, and not in Vercel.

## Release

- [x] The expand PR merged and `migrate-preview` applied it before the feature PR (C3).
- [x] The pre-migration branch existed before migrate-production applied `…_inquiry_retention` to production.
- [x] Main CI green, migrate-production green, production deploy Ready, production-checks green.
- [x] Resend sending region recorded in `spec.md` D14; `before-45` deleted after the owner's confirmation (D14).
- [x] Open question 9 updated in `roadmap.md`, and the owner's `---` edit not committed (C6).

## Pre-launch security checklist (Phase 23 run, D12)

Each item is marked done with evidence, N/A until a named phase, or deferred to a named phase.

- [x] All headers present, and the CSP enforced with no violations — **done:** `preview-headers` and `e2e/csp.spec.ts` (in preview-e2e) green on PR #56 (run 40098528832). Production is checked again by production-checks at the release.
- [x] Rate-limit, Turnstile, honeypot and lockout tests green (where the feature exists) — **done:** `rate-limit.db.test.ts`, `submit.db.test.ts`, the Turnstile and submit-core unit tests, and `e2e/inquiry.spec.ts` green in CI. Lockout: **N/A until Phase 24** (no sign-in yet).
- [x] Authorization tests cover every server action, and the unguarded-action CI check passes — **N/A until Phase 24:** the only server action, `app/(public)/contact/actions.ts`, is public by design (guarded by the kill switch, honeypot, Zod, rate limits and Turnstile). Authorization tests and the unguarded-action check arrive with the first authenticated action.
- [x] Least-privilege DB role in use, migrator credentials absent from the runtime, production branch protected, restore rehearsed — **done:** `rhm_app` at runtime, `rhm_readonly` for the monitor and `rhm_retention` for the job, each proven by `roles.db.test.ts` and `retention-grants.db.test.ts`. `lib/env.ts` fails a Vercel build that holds `MIGRATOR_DATABASE_URL`, `BOOTSTRAP_DATABASE_URL` or `RETENTION_DATABASE_URL`. Restore rehearsed 2026-10-19 (`docs/runbooks/restore.md`). Protected branch: **deferred to Milestone 3**, since Neon Free has none (D11, open question 9).
- [x] No `*RawUnsafe`, `dangerouslySetInnerHTML` or `NEXT_PUBLIC_` secrets — **done:** banned by lint; a grep of `app`, `components`, `lib` and `scripts` finds only comments saying they are not used. The `NEXT_PUBLIC_` values are the site URL, the Cloudinary cloud name and API key (public by design; the secret is `CLOUDINARY_API_SECRET`) and the Turnstile site key.
- [x] Dependency audit clean (no high or critical findings) — **done:** the `ci` job's `pnpm audit --prod --audit-level high` passed on PR #56. The one ignored advisory, GHSA-mrhx-c7xc-m3w5 (zod 3 inside next-cloudinary), is recorded in `pnpm-workspace.yaml` (#54).
- [x] Alerting tested, and the Firewall and rotation runbooks written — **done:** runbooks written (`firewall.md`, `secret-rotation.md` with `rhm_retention`, `monitoring.md` with the retention job). Monitor alerting tested in Phases 15 and 16. The retention test alert (run 40236289742, 2026-10-25) reached the owner's mailbox and, through the widened Gmail filter, `redhatmediang@gmail.com`.
- [x] `/security-review` findings resolved or accepted in writing — **done 2026-10-24:** run over `218d02c..HEAD` (all of Milestone 2). **No findings** at HIGH or MEDIUM. It checked the submit path, Turnstile, client IP, email templates and headers, SQL, DB grants, workflows, CSP and env, and the portfolio, prefill and media inputs.

## Before each merge

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass locally.
- [x] `ci`, `db` and `gitleaks` green on the PR; preview-e2e green (or, for the expand PR only, a failure explained on the PR).
- [ ] Every box in `plan.md` ticked.
