# Plan — Phase 23 Homepage live data + Milestone 2 release

Scope, decisions (D1–D14) and constraints (C1–C7) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md). Steps marked **(owner)** are the owner's (C7).

## 1. Expand PR (`feature/phase-23-retention-schema`, merged first; C3)

- [x] 1.1 `tech-stack.md`: the `rhm_retention` role in the least-privilege row, and its credential in the rotation runbook row.
- [x] 1.2 `scripts/db-bootstrap.mts`: add `rhm_retention` and a `--role rhm_retention` option that creates or rotates only that role (D7). Writes `RETENTION_DATABASE_URL` (direct) to the branch's `.env.neon-<branch>.local`.
- [x] 1.3 `lib/db/test-client.ts` and `ci.yml`: a `TEST_RETENTION_DATABASE_URL` from the CI bootstrap.
- [x] 1.4 `schema.prisma`: `Inquiry.closedAt DateTime?` and `Inquiry.anonymisedAt DateTime?`. Migration `…_inquiry_retention`: the two columns, then the column-level grants of D7 (hand-written).
- [x] 1.5 Database test `retention-grants.db.test.ts`: `rhm_retention` can update the personal columns and delete rate-limit rows, but cannot `SELECT` `email` (or any personal column), cannot `DELETE` from `Inquiry`, cannot read `PortfolioItem`, and cannot run DDL (C4).
- [x] 1.6 `docs/runbooks/secret-rotation.md`: the `rhm_retention` section.
- [ ] 1.7 **(owner)** Create the role on `dev` and `preview`: `node scripts/db-bootstrap.mts --branch <dev|preview> --role rhm_retention` with the owner credential. Verify with `neon roles list --branch preview`.
- [ ] 1.8 `pnpm db:migrate` on `dev`. PR into `develop`, noting that preview-e2e may fail until it's migrated (C3). **(owner)** Merge; `migrate-preview` green.

## 2. Homepage featured work (feature PR, after `develop` is merged in)

- [ ] 2.1 `featuredCards(cards, limit = 3)` in `lib/portfolio/read-core.ts`, with unit tests: featured only, portfolio order, the cap, an empty result (D1).
- [ ] 2.2 `components/home/featured-work.tsx`: read `getPublishedPortfolio()`, render up to 3 `PortfolioCard`s above the link, and fall back to the text and link (D2, D3). The card grid's loading and error behaviour follows rule 8 through the fallback.
- [ ] 2.3 Phase 3 spec D5: the dated note. Update the component's header comment.
- [ ] 2.4 Build and check the route table: `/` still `○`, every other route unchanged (C2).
- [ ] 2.5 `e2e/home.spec.ts`: the no-DB build shows the text-and-link fallback. A preview-e2e case: three cards in portfolio order, each linking to `/portfolio/{slug}` and opening the full page, not a dialog (D4).

## 3. Retention job

- [ ] 3.1 `lib/retention/core.ts`: `anonymiseClosedInquiries(client, now)` and `purgeRateLimitHits(client, now)` as tagged SQL, each returning a count (D5, D6, D9). The cut-offs are exactly 24 months and 30 days before `now`.
- [ ] 3.2 `retention.db.test.ts` (as `rhm_retention`): a closed row past 24 months is anonymised with scope and dates kept; a closed row inside 24 months, an open old row, and a row already anonymised are left alone; a second run changes nothing; rate-limit rows older than 30 days go, newer ones stay.
- [ ] 3.3 `scripts/retention.mts`: connect with `RETENTION_DATABASE_URL`, run both, print counts only, exit non-zero on any error, and fail on purpose with "TEST ALERT — not an incident" when `RETENTION_TEST_ALERT=1` (D8, D10).
- [ ] 3.4 `.github/workflows/retention.yml`: daily `41 3 * * *` plus `workflow_dispatch` with `test_alert`, environment `retention`, pinned actions as in `monitor.yml` (D8).
- [ ] 3.5 `tech-stack.md`: the Personal data and Monitoring rows (D5, D6, D8, D10). `docs/runbooks/monitoring.md`: the *Retention job* section (D10).
- [ ] 3.6 `roadmap.md` open question 9: the dated answer (D11), staged as its own hunk (C6).

## 4. Security checklist (D12)

- [ ] 4.1 Run `/security-review` over `218d02c..HEAD`. Resolve each finding, or record the owner's written acceptance.
- [ ] 4.2 Record every checklist item in `validation.md`, with evidence, N/A, or a deferral to a named phase.

## 5. Merge into `develop`

- [ ] 5.1 Feature PR into `develop`: `ci`, `db`, `gitleaks` and preview-e2e green.
- [ ] 5.2 **(owner)** Preview check of `/` (cards, links, 360px and 1440px). **(owner)** Merge.

## 6. Milestone 2 release (D11, D13, D14)

- [ ] 6.1 **(owner)** Create `rhm_retention` on `production`: `node scripts/db-bootstrap.mts --branch production --role rhm_retention`. Create the GitHub environment `retention` (branch `main` only) holding `RETENTION_DATABASE_URL`.
- [ ] 6.2 Release PR `develop` → `main`. **(owner)** Take the pre-migration branch from `production` (`docs/runbooks/release.md`), merge, and approve migrate-production. It applies `…_inquiry_retention`.
- [ ] 6.3 Production deploy Ready; production-checks green; `pnpm test:e2e` on `home.spec.ts` against production (`PW_BASE_URL`).
- [ ] 6.4 Production test inquiry: row, `emailSentAt`, Gmail notification. Then delete the row and confirm the next monitor run is green (D13).
- [ ] 6.5 Dispatch `retention` once (green, counts printed), then a dispatch with `test_alert` (the failure email arrives), then confirm the next scheduled run is green (D10).
- [ ] 6.6 PageSpeed Insights mobile on `/` in production: ≥ 90 (C5).
- [ ] 6.7 Confirm the Resend sending region and record it in `spec.md` D14. **(owner)** Confirm, then delete Neon branch `before-45` (D14).
- [ ] 6.8 Close-out PR into `develop` with the final ticks.
