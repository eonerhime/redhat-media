# Phase 17 — Inquiry data model

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 2, Phase 17
- **Branch:** `feature/phase-17-inquiry-model` (from `develop` at `3ec01ff`)
- **Started:** 2026-10-20
- **Status:** approved by the owner, 2026-10-20

## What and why

Milestone 2 turns `/contact` into the inquiry flow. Before any form exists, this phase lays down the data it saves: the `Inquiry` table, its enums, and one shared Zod schema that both the Phase 18 form and its server action will use. Getting the contract right first means the form, the stepper (Phase 19), the emails (Phase 20) and the inbox (Phase 32) all build on one tested definition of a valid inquiry.

This phase ships **no UI and no route**. Its output is a migration, a validation module and tests.

## Constitution sections this phase relies on

- `mission.md` → *Primary success metric* (an inquiry counts once it is saved), *Supporting metrics* (share of inquiries with a complete scope; zero lost inquiries) and *Guiding principles* 1 (inquiry first) and 9 (validate every input with Zod).
- `tech-stack.md` → *Schema decisions* (`services ServiceCategory[]`, `BudgetRange` enum, `timeline`, `consentAt`, `ackSentAt`, `emailSentAt`); *Security baseline* (Zod on every input with explicit length caps, Phase 17; least-privilege roles, Phase 7); *Architectural rules* 3 (services are config) and 4 (save first, then email); the Validation row (shared schemas in `lib/validation/`).
- `README.md` §5 (the `Inquiry` blueprint).
- `roadmap.md` → Phase 17; Phase 18 (form, muted-service rejection); Phase 19 (stepper, packages); Phase 23 (retention); Phase 32 (inbox); open questions 7 (budget bands), 8 (phone) and 10 (data protection).
- Phase 7 spec D3, D4 (roles and default privileges), D9 (`*.db.test.ts`), D11 (migrations reach Neon only from CI); Phase 9 spec D2 (`lib/validation/` style, relative imports).

## Scope

1. **Constitution first** (listed below).
2. **Schema** (D1, D2): `InquiryStatus`, `BudgetRange` and `InquiryTimeline` enums and the `Inquiry` model in `prisma/schema.prisma`.
3. **Migration** (D3, D4): `prisma/migrations/20261020000000_inquiry/`, created on the Neon `dev` branch.
4. **Validation** (D5–D8): `lib/validation/inquiry.ts`, with the shared Zod schema, phone normalisation and the mapper to a database row.
5. **Tests** (D9).

## Constitution changes (in this PR, before the code)

- **`roadmap.md`** → open question 7: record the budget bands and timeline choices (owner answers A, B). Packages per service stay open for Phase 19. Open question 8: phone is **required** on the inquiry (owner answer C).
- **`README.md`** §5: replace the commented-out `BudgetRange` / `InquiryTimeline` placeholders with the real enums (D2), and replace the phone comment ("required-ness confirmed in Phase 17") with "required; stored as E.164 (Phase 17 spec, D6)".
- **`tech-stack.md`** → *Schema decisions*: add a row for the enum values and E.164 phone (D2, D6). *Security baseline*, least-privilege roles row: `rhm_readonly` has no access to `Inquiry` (D4).
- **`mission.md`:** no change.

## Out of scope

- Any form, server action, route or copy (Phase 18). Budget and timeline **labels**, including the approximate USD hint, are copy and arrive with the stepper (Phase 19).
- Rejecting a **muted** service. The schema here accepts any `ServiceCategory`; Phase 18's server action narrows it to `visibleServices()` (`tech-stack.md` → *Architectural rules* 3).
- Turnstile, the honeypot, minimum time-to-submit and `rateLimit("inquiry", …)` (Phase 18).
- Packages or tiers per service (Phase 19, open question 7).
- Indexes for the inbox list (Phase 32 adds what its queries need).
- The retention job (Phase 23). Note for it: anonymising overwrites values (for example `phone = "redacted"`), so required columns do not need to become nullable.
- Any change to `lib/env.ts`, Vercel, CI workflows or the seed.

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **The `Inquiry` model follows README §5**, with no field added or dropped:<br>`id` (cuid), `clientName`, `companyName?`, `email`, `phone`, `services ServiceCategory[]`, `budgetRange BudgetRange?`, `timeline InquiryTimeline?`, `projectNotes`, `status InquiryStatus @default(NEW)`, `consentAt`, `emailSentAt?`, `ackSentAt?`, `createdAt`, `updatedAt`.<br>• `InquiryStatus { NEW REVIEWING PROPOSAL_SENT CLOSED }` arrives now, as the blueprint has it, so `status` has its type from the first row.<br>• `budgetRange` and `timeline` are **nullable**: the Phase 18 form does not ask for them; the Phase 19 stepper does. Every inquiry saved from Phase 19 on has both.<br>• Columns are plain `text`, like every other model. Length caps live in Zod (D5), the only writer being the server action. | The blueprint is the contract, and the schema-decisions table already settled the shape. Nullable scope columns let Phase 18 ship before the stepper without a later migration. | README §5; *Schema decisions* |
| D2 | **Enum values** (owner answers A, B):<br>`BudgetRange { UNDER_500K FROM_500K_TO_1_5M FROM_1_5M_TO_5M FROM_5M_TO_15M OVER_15M NOT_SURE }` — Naira bands: under ₦500k, ₦500k–₦1.5M, ₦1.5M–₦5M, ₦5M–₦15M, over ₦15M, not sure yet.<br>`InquiryTimeline { ASAP WITHIN_1_MONTH ONE_TO_THREE_MONTHS OVER_THREE_MONTHS FLEXIBLE }` — as soon as possible (within 2 weeks), within a month, 1–3 months, more than 3 months, flexible / not sure.<br>The identifiers name the band, not its wording. International clients pick a Naira band; the label shows an approximate USD range (Phase 19 copy), so there is no currency column. | Fixed bands give typed, reportable scope ("share of inquiries with a complete scope"). Wording and the USD hint can change as copy without a migration; the bands themselves cannot, so they are the owner's call. | Open question 7; owner answers A, B |
| D3 | **Migration `20261020000000_inquiry`.** Created with `prisma migrate dev --create-only` against the Neon `dev` branch, reviewed, then applied there. It is **additive**: three `CREATE TYPE`, one `CREATE TABLE`, nothing altered on existing tables. D4's statement is appended by hand. CI's `db` job checks there is no drift, `migrate-preview` applies it to `preview` on the push to `develop`, and `migrate-production` applies it with the next release. | Phase 7 D11: migrations reach shared branches only from CI. Additive means a rollback is a revert plus a follow-up drop, and no existing row is touched. | Phase 7 D11; CLAUDE.md *Commands* |
| D4 | **`rhm_readonly` gets no access to `Inquiry`.** The migration ends with `REVOKE ALL ON TABLE "Inquiry" FROM rhm_readonly;`, undoing the default-privileges grant for this table only. `rhm_app` keeps SELECT/INSERT/UPDATE/DELETE through default privileges, unchanged.<br>`rhm_readonly`'s production credential lives in the GitHub Environment `monitor`, and the monitor reads only `pg_stat_*` views. Nothing that uses the role needs client names, emails or phone numbers. The restore runbook verifies `PortfolioItem` and `MediaItem` counts, which it can still read. | Data minimisation (NDPA 2023, open question 10): personal data is readable only by the role that serves it. A leaked monitor secret then exposes no client details. | *Security baseline*; mission principle 9 |
| D5 | **One shared schema, `inquiryInputSchema`, in `lib/validation/inquiry.ts`.** It parses what the form submits (Phase 18 builds the object from `FormData`: strings, `services` from `getAll`, and `consent` as a boolean from the checkbox) and returns typed, normalised values. Every field has a cap and a **field-specific message** (Appendix A). Rules common to all fields:<br>• Strings are trimmed before checks.<br>• **Single-line fields** (name, company, email, phone) refuse line breaks and other control characters. `projectNotes` allows line breaks and tabs and refuses other control characters.<br>• **Optional fields** (`companyName`, `budgetRange`, `timeline`) treat an empty string as absent (`undefined`, saved as `NULL` by D7), because an untouched `<select>` or input submits `""`.<br>• **Unknown keys are dropped**, so a crafted `status`, `consentAt`, `emailSentAt` or `id` never reaches the database (D7 builds the row from known fields only).<br>Relative imports only, like `https-url.ts`, so seed scripts and tests can run it under plain Node. Messages are plain English in the module, as in `https-url.ts`, not `block()` copy. | One definition of "valid" for client and server (*tech-stack.md* Validation row). Refusing control characters in single-line fields keeps them safe for the Phase 20 email templates and the CMS list. | *Security baseline* (Zod with explicit caps); Phase 9 D2 |
| D6 | **Phone is required and stored as E.164** (owner answer C). Accepted input: digits with optional spaces, hyphens, dots and brackets, at most 32 characters, then normalised:<br>• `0` + 10 digits (a Nigerian local number, e.g. `0803 123 4567`) → `+234` + the 10 digits;<br>• `234` + 10 digits → `+234…`;<br>• `+` followed by 8 to 15 digits, the first not `0` → kept as `+` and the digits.<br>• *(Added in the build, 2026-10-20.)* A `+234` number must have exactly 10 digits after the country code, and the trunk `0` often written after it (`+234 (0)803…`) is dropped first.<br>Anything else is refused with one message that shows both formats. No library: the rules above cover local and international numbers well enough for a human to call back, and the inbox shows the number as stored. | One stored format makes `tel:` and `wa.me` links in the inbox and emails trivial and keeps duplicates comparable. Full per-country validation would need a library the tech stack does not list (C1). | Open question 8; owner answer C |
| D7 | **`toInquiryData(input, now)`** maps a parsed input to the Prisma create data: the D5 fields plus `consentAt: now`. It never sets `id`, `status`, `emailSentAt`, `ackSentAt` or timestamps, so the database defaults apply. `consent: true` in the input is required by the schema and becomes `consentAt`; it is not stored as a boolean. | Keeps "what the client sent" separate from "what we store", and puts the consent timestamp on the server clock. Phase 18's action is then parse → map → `create`. | *Schema decisions* (`consentAt`) |
| D8 | **Enum values have one source each, and a test proves they match.** `lib/validation/inquiry.ts` exports `budgetRanges` and `inquiryTimelines` as `as const` tuples and reuses `serviceCategories` from `content/services.ts`. A unit test compares each tuple (and `InquiryStatus`) with the generated `lib/generated/prisma/enums.ts`. The shared schema therefore never imports generated Prisma code, which keeps it light in the Phase 18 client bundle. | The same pattern `content/services.ts` already uses for `ServiceCategory`. If the schema and Prisma ever disagree, `pnpm test` fails instead of a production insert. | Phase 2 D6; *Architectural rules* 3 |
| D9 | **Tests.**<br>• **Unit** `lib/validation/inquiry.test.ts`: a minimal valid inquiry and a full one parse; **each invalid case is refused with its own message on its own path** (one `it.each` row per Appendix A message); phone normalisation for each accepted shape and refusal of the others; empty optional strings become absent; unknown keys are dropped; `toInquiryData` sets `consentAt` to `now` and nothing else beyond the input fields; the enum-drift check (D8).<br>• **DB** `lib/db/inquiry.db.test.ts` (`pnpm test:db`): as `rhm_app`, create an inquiry from `toInquiryData` and read it back (status `NEW`, every enum and the services array round-trip, `createdAt` set), then delete it.<br>• **Roles** `lib/db/roles.db.test.ts`: `"Inquiry"` joins `TABLES` for `rhm_app`'s grants and the migrator's ownership; a new test shows `rhm_readonly` is **refused** `SELECT` on `"Inquiry"` (D4). | Proves "Done when" (valid inquiries accepted, each invalid field rejected with a specific message) and the D4 privilege boundary on a real Postgres. | Roadmap Phase 17 "Done when"; Phase 7 D9 |

## Constraints

- **C1 — No new libraries.** Zod 4.6 and Prisma 7.10 only; no phone library.
- **C2 — Additive migration.** No change to existing tables, no data migration, no seed change.
- **C3 — No UI.** No route, component, copy key, CSP or env change. The build's route table is unchanged.
- **C4 — Existing suites hold.** `pnpm test`, `pnpm test:db` and `pnpm test:e2e` pass. Existing tests change only where `roles.db.test.ts` adds `"Inquiry"` (D9).
- **C5 — Spec and schema agree.** README §5, `prisma/schema.prisma` and the D8 tuples list the same fields and values. CI's drift check passes.
- **C6 — Migrations from CI only.** `prisma migrate dev` runs only against the Neon `dev` branch; `preview` and `production` are migrated by CI (Phase 7 D11).

## Owner answers

Given 2026-10-20:

- **A. Budget bands:** five Naira bands plus "not sure yet": under ₦500k, ₦500k–₦1.5M, ₦1.5M–₦5M, ₦5M–₦15M, over ₦15M. International clients see an approximate USD hint in the label (for example "₦1.5M – ₦5M (about $1,000 – $3,300)"), with no separate currency.
- **B. Timeline:** as soon as possible (within 2 weeks), within a month, 1–3 months, more than 3 months, flexible / not sure.
- **C. Phone:** required on the inquiry; local and international formats accepted and stored normalised.

---

## Appendix A — Field rules and messages

Messages are drafts for the owner to accept or reword. Phase 18 shows them under each field.

| Field | Rule | Message when refused |
| --- | --- | --- |
| `clientName` | required; 2–100 characters | missing or too short: "Enter your name." · too long: "Your name must be at most 100 characters." · line break or control character: "Your name must be on one line." |
| `companyName` | optional; at most 120 characters | too long: "Company name must be at most 120 characters." · line break or control character: "Company name must be on one line." |
| `email` | required; a valid address; at most 254 characters | missing or invalid: "Enter a valid email address, like name@example.com." · too long: "Email addresses must be at most 254 characters." |
| `phone` | required; D6 shapes; at most 32 characters as typed | missing: "Enter a phone number we can reach you on." · any other failure: "Enter a phone number like 0803 123 4567, or with a country code like +44 20 7946 0000." |
| `services` | 1–6 values, each a `ServiceCategory`, no repeats | none: "Choose at least one service." · unknown value: "Choose services from the list." · repeat: "Choose each service only once." |
| `budgetRange` | optional; a `BudgetRange` value | "Choose a budget range from the list." |
| `timeline` | optional; an `InquiryTimeline` value | "Choose a timeline from the list." |
| `projectNotes` | required; 10–5,000 characters; line breaks allowed | missing or too short: "Tell us a little about your project (at least 10 characters)." · too long: "Project details must be at most 5,000 characters." · control character: "Project details contain characters we can't accept." |
| `consent` | must be `true` | "Please agree to the privacy notice so we can keep your details." |
