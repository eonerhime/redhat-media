# Plan — Phase 17 Inquiry data model

Scope, decisions (D1–D9) and constraints (C1–C6) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 0. Constitution first

- [x] 0.1 `specs/roadmap.md` open questions 7 and 8: record owner answers A, B (budget bands, timeline; packages stay open for Phase 19) and C (phone required).
- [x] 0.2 `README.md` §5: the real `BudgetRange` and `InquiryTimeline` enums; the phone comment (D2, D6).
- [x] 0.3 `specs/tech-stack.md`: a *Schema decisions* row for the enum values and E.164 phone; the least-privilege roles row notes `rhm_readonly` has no access to `Inquiry` (D4).

## 1. Schema and migration

- [x] 1.1 `prisma/schema.prisma`: `InquiryStatus`, `BudgetRange`, `InquiryTimeline` and `Inquiry` (D1, D2).
- [x] 1.2 `prisma migrate dev --create-only --name inquiry` against the Neon `dev` branch; rename the folder to `20261020000000_inquiry`; append the `REVOKE` with a comment (D3, D4). Review the SQL: additive only (C2). — three `CREATE TYPE`, one `CREATE TABLE`, the `REVOKE`; nothing else.
- [x] 1.3 Apply it to `dev` (`pnpm db:migrate`) and confirm the table in Prisma Studio. Record it. — confirmed with `prisma migrate status` on `ep-purple-mountain` (`dev`): 4 migrations, up to date. `prisma generate` run by hand (Prisma 7's `migrate dev` no longer generates).

## 2. Validation

- [x] 2.1 `lib/validation/inquiry.ts`: `budgetRanges`, `inquiryTimelines`, `inquiryInputSchema` with the Appendix A rules and messages, phone normalisation and `toInquiryData` (D5–D8). — also exports `inquiryStatuses` for the drift check and `toE164`; D6 gained the `+234` rule.

## 3. Tests

- [x] 3.1 `lib/validation/inquiry.test.ts`: valid inquiries, one row per Appendix A message, phone shapes, empty optionals, dropped keys, `toInquiryData`, enum drift (D9). — 64 tests.
- [x] 3.2 `lib/db/inquiry.db.test.ts`: create and read back as `rhm_app` (D9).
- [x] 3.3 `lib/db/roles.db.test.ts`: `"Inquiry"` in `TABLES` and the ownership list; `rhm_readonly` refused `SELECT` on it (D4, D9).

## 4. Close

- [x] 4.1 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:db`, `pnpm build` (route table unchanged, C3), `pnpm test:e2e --workers=1`. — unit 1,036; db 30; e2e (ready, Edge) 381 passed + 11 skipped, 0 failed.
- [x] 4.2 PR into `develop`: CI green (`ci`, `db` with the drift check, `gitleaks`, preview jobs); after the merge, `migrate-preview` applies the migration to `preview`. — PR #36, merge `67a8510`; develop run 39398766440 applied it to `preview`.
- [x] 4.3 Every `validation.md` box ticked; owner review. — all but the monitor half of the `rhm_readonly` box, which can only be shown on production after the next `develop` → `main` release.
