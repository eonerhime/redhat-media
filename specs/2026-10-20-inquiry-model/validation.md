# Validation — Phase 17 Inquiry data model

## Roadmap success check ("Done when", verbatim)

> Unit tests accept valid inquiries and reject each invalid field with a specific message.

- [x] **Valid inquiries accepted:** a minimal inquiry (required fields only) and a full one (every field, several services) parse, with the phone normalised to E.164 (D5, D6, D9) — `inquiry.test.ts` › valid inquiries (6 tests) and `toE164` accepts (9 shapes), locally 2026-10-20
- [x] **Each invalid field rejected with a specific message:** one test per Appendix A message, each asserting the message text and the field path (D9) — `inquiry.test.ts` › each invalid field has its own message (30 rows, each asserting exactly one message on its own path), locally 2026-10-20

## Data model

- [x] **Schema matches the contract:** `Inquiry`, `InquiryStatus`, `BudgetRange` and `InquiryTimeline` in `prisma/schema.prisma` match README §5 and the D2 values (D1, D2, C5) — README §5 updated in this PR; the drift check (below) ties the migration to the schema
- [x] **Enum drift check:** the validation tuples equal the generated Prisma enums (D8) — `inquiry.test.ts` › enum values match the Prisma schema (4 tests), locally 2026-10-20
- [x] **Migration is additive:** `20261020000000_inquiry` only creates types and the table, plus the `REVOKE` (D3, D4, C2) — SQL reviewed (plan 1.2); applied to Neon `dev` and to a local `postgres:17`, with no difference reported by `prisma migrate diff`
- [x] **Round trip:** as `rhm_app`, an inquiry built by `toInquiryData` is saved and read back with status `NEW`, `consentAt` set and every enum intact (D7, D9) — `inquiry.db.test.ts` (2 tests), local copy of the CI `db` job, 2026-10-20
- [x] **No mass assignment:** `status`, `consentAt`, `emailSentAt`, `ackSentAt` and `id` in the input are dropped (D5, D7) — `inquiry.test.ts` › drops keys the client must not set; `toInquiryData` › never sets server-owned fields

## Privileges

- [x] **`rhm_app`:** SELECT/INSERT/UPDATE/DELETE on `Inquiry`, and no TRUNCATE/REFERENCES/TRIGGER (D4, D9) — `roles.db.test.ts` with `"Inquiry"` in `TABLES`, local copy of the CI `db` job, 2026-10-20
- [ ] **`rhm_readonly`:** refused `SELECT` on `Inquiry`; the monitor's checks still pass (D4) — refusal: `roles.db.test.ts` › has no privilege on Inquiry, locally 2026-10-20; monitor: after the release to `main`
- [x] **`rhm_migrator`** owns `Inquiry` (D9) — `roles.db.test.ts` › owns every app table, locally 2026-10-20

## Gates

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass; the route table is unchanged (C3) — locally 2026-10-20 (unit 1,036; no new route) and the `ci` job in CI run 39397756294 (PR #36)
- [x] `pnpm test:db` passes locally and in the CI `db` job, with no schema drift (C5) — locally 30 passed, no drift; the `db` job in CI run 39397756294
- [x] `pnpm test:e2e` passes locally and in CI; `preview-e2e` passes on the Vercel preview (C4) — locally (ready, Edge, `--workers=1`) 381 passed, 11 skipped (state- and release-conditional), 0 failed, 2026-10-20; `ci` in run 39397756294; `preview-e2e`, `preview-headers` and `lighthouse` in preview run 39397795249
- [ ] `migrate-preview` applies the migration to the Neon `preview` branch after the merge (C6) —
- [ ] Owner review —
