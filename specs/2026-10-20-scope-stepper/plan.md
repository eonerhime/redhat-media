# Plan — Phase 19 Scope stepper

Scope, decisions (D1–D14) and constraints (C1–C7) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 0. Constitution first

- [x] 0.1 `specs/roadmap.md`: Phase 19 row (project types, review step); open question 7 (owner answer A).
- [x] 0.2 `specs/tech-stack.md`: *Schema decisions* (`projectTypes`; budget and timeline required by the schema) (owner answers B, E).
- [x] 0.3 `README.md`: §5 `Inquiry` model gains `projectTypes String[]`.

## 1. Baseline

- [x] 1.1 Measure Phase 18's `/contact` client JS (sum of gzipped JS files `contact.html` loads, switch on) and record it in `implementation.md` (D14).

## 2. Data and validation

- [ ] 2.1 `content/project-types.ts` + `content/project-types.test.ts` (D1, D13).
- [x] 2.2 Prisma: `projectTypes String[] @default([])`, migration `20261020…_inquiry_project_types`, `prisma generate` (D2, C3).
- [ ] 2.3 `lib/validation/inquiry-messages.ts` (Zod-free); `inquiryInputSchema` project-type, budget and timeline rules; `toInquiryData`; tests (D3).
- [ ] 2.4 `lib/inquiry/fields.ts` and `submit-core.ts`: new fields in step order, echoed on `invalid`; tests (D4).
- [ ] 2.5 `submit.db.test.ts`: multi-service inquiry saved with its full scope; column default (D13).

## 3. Stepper and copy

- [ ] 3.1 Copy keys from Appendices A and B (as approved); `notes.hint` changed (D12).
- [ ] 3.2 `inquiry-copy.ts`: pass step, budget, timeline, review and project-type labels to the client form.
- [ ] 3.3 `inquiry-form.tsx`: steps, progress, focus, Back / Continue, review with Change, disabled types for unticked services (D5, D6, D8).
- [ ] 3.4 Step checks and error summaries; a server `invalid` opens the first step with an error (D9).
- [ ] 3.5 History: `pushState` / `popstate`, in-form Back via `history.back()` (D7).
- [ ] 3.6 Turnstile mounted on step 6; `<noscript>` note (D10, D11).
- [ ] 3.7 Build: `/contact` prerendered (`○`) with the switch on and off (C2). Record it.

## 4. Tests

- [ ] 4.1 `e2e/inquiry.spec.ts`: keyboard-only two-service run; Continue blocked per step; in-form and browser Back keep answers; Change; unticked service; server-invalid; preview-only success (D13, C5).
- [ ] 4.2 `e2e/a11y.spec.ts`: every step at 360 and 1440 px (D13).
- [ ] 4.3 Screenshots of each step at 360px and 1440px checked by eye.
- [ ] 4.4 Measure `/contact` client JS again; the increase is at most 15 kB gzipped (D14). Record it.

## 5. Close

- [ ] 5.1 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:db`, `pnpm build`, `pnpm test:e2e --workers=1`.
- [ ] 5.2 PR into `develop`: CI green (including Lighthouse); `migrate-preview` applies the migration; `preview-e2e` submits a multi-service inquiry.
- [ ] 5.3 NVDA pass on the preview: record what is announced at each step change, error summary and success (owner answer H).
- [ ] 5.4 Owner check on the preview: complete the stepper on a phone (including the back gesture), and see the row with its project types, budget and timeline on Neon `preview`. Then every `validation.md` box ticked.
