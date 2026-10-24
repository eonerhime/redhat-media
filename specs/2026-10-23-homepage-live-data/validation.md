# Validation — Phase 23 Homepage live data + Milestone 2 release

## Roadmap success check ("Done when", verbatim)

> The homepage reflects the `featured` flags. A test inquiry succeeds in production, and the retention job runs on a schedule.

- [ ] **Featured flags:** on the seeded preview and on production, `/` shows the featured, published items (SportsPred, AfroJamz, toutMessages today) in portfolio order, at most 3, and no unfeatured item (D1).
- [ ] **Test inquiry:** a production inquiry is saved, `emailSentAt` is set, and the Gmail notification arrives. The row is then deleted and the next monitor run is green (D13).
- [ ] **Scheduled job:** a dispatched `retention` run and the next scheduled run are both green, and each prints only the two counts (D8, D9).

## Homepage

- [ ] With no database (the `ci` build), `/` shows the heading, body and "See the portfolio" link, no cards and no error (D2).
- [ ] Each card links to `/portfolio/{slug}`, and following it from `/` opens the full page with no dialog (D4).
- [ ] The build's route table shows `/` as `○` and no other route changed mode (C2).
- [ ] `/` passes the existing a11y and contrast e2e checks at 360px, 768px and 1440px, with no horizontal scroll.
- [ ] PageSpeed Insights mobile on production `/`: ≥ 90 performance, no audit skipped (C5).

## Retention job

- [ ] `retention.db.test.ts` passes in the `db` job: the anonymise and purge cases of plan 3.2, including idempotence.
- [ ] `retention-grants.db.test.ts` passes: `rhm_retention` cannot read personal columns, cannot delete inquiries, cannot read other tables, and cannot run DDL (C4).
- [ ] A dispatch with `test_alert` fails with "TEST ALERT — not an incident", and the failure email reaches the owner (D10).
- [ ] The workflow log holds no personal data, only the counts (C4).
- [ ] `RETENTION_DATABASE_URL` exists only in the `retention` GitHub environment, which is limited to `main`, and not in Vercel.

## Release

- [ ] The expand PR merged and `migrate-preview` applied it before the feature PR (C3).
- [ ] The pre-migration branch existed before migrate-production applied `…_inquiry_retention` to production.
- [ ] Main CI green, migrate-production green, production deploy Ready, production-checks green.
- [ ] Resend sending region recorded in `spec.md` D14; `before-45` deleted after the owner's confirmation (D14).
- [ ] Open question 9 updated in `roadmap.md`, and the owner's `---` edit not committed (C6).

## Pre-launch security checklist (Phase 23 run, D12)

Each item is marked done with evidence, N/A until a named phase, or deferred to a named phase.

- [ ] All headers present, and the CSP enforced with no violations
- [ ] Rate-limit, Turnstile, honeypot and lockout tests green (where the feature exists)
- [ ] Authorization tests cover every server action, and the unguarded-action CI check passes
- [ ] Least-privilege DB role in use, migrator credentials absent from the runtime, production branch protected, restore rehearsed
- [ ] No `*RawUnsafe`, `dangerouslySetInnerHTML` or `NEXT_PUBLIC_` secrets
- [ ] Dependency audit clean (no high or critical findings)
- [ ] Alerting tested, and the Firewall and rotation runbooks written
- [ ] `/security-review` findings resolved or accepted in writing

## Before each merge

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass locally.
- [ ] `ci`, `db` and `gitleaks` green on the PR; preview-e2e green (or, for the expand PR only, a failure explained on the PR).
- [ ] Every box in `plan.md` ticked.
