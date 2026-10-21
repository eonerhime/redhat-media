# Plan — Phase 20 Resend emails

Scope, decisions (D1–D14) and constraints (C1–C6) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 0. Constitution first

- [x] 0.1 `specs/roadmap.md`: Phase 20 row and its amended "Done when"; open question 2 (domain amendment scope); open question 3 answered (D1, D2).
- [x] 0.2 `specs/tech-stack.md`:
  - the Email row (versions, staged sending);
  - *Security baseline*: least-privilege, monitoring, abuse and rotation rows;
  - *Environment variables* (D1, D6, D9, D10).

## 1. Dependencies

- [x] 1.1 Add `resend` 6.32.1 and `@react-email/components` 1.0.12 at exact versions (both at least two weeks old). Run `pnpm audit --prod` (C5).

## 2. Environment

- [x] 2.1 `lib/env.ts`: the D9 variables and rules; an `email` section on the parsed env. Tests in `env.test.ts`.
- [x] 2.2 `.env.example`: the new variables, commented as in Phase 18.

## 3. Email layer

- [x] 3.1 `lib/email/send.ts` (`server-only`): `sendEmail`, the missing-key skip and the redirect. Tests with a mocked SDK (D8).
- [x] 3.2 `lib/email/templates/team-notification.tsx` and `client-ack.tsx` from Appendices A and B (as approved) (D4, D5, D7).
- [x] 3.3 `lib/email/render.ts`: HTML and plain text, label resolution (`projectTypeLabel`, budget and timeline labels) and the Lagos time format.
- [x] 3.4 Template tests: hostile input escaped, no input in subject or headers, field coverage, no free text in the acknowledgment (D14).

## 4. Sending

- [x] 4.1 `submit-core.ts`: `save` returns the id; the per-recipient acknowledgment limit; `acknowledgment` on `success`. Tests (D3, D6).
- [x] 4.2 `lib/inquiry/notify-core.ts` and its tests (D3, D14).
- [x] 4.3 `app/(public)/contact/actions.ts`: real deps, `after(() => notifyInquiry(…))`, and `markSent` with an `updateMany` guarded by `IS NULL`.
- [x] 4.4 `submit.db.test.ts`: the sender throws and the row is still saved; `markSent` sets each column once.

## 5. Copy

- [x] 5.1 `contact.form.success.ack` and the success panel's conditional sentence (D13).
- [x] 5.2 `privacy.processors.body` with Resend and the confirmed region (D12).

## 6. Monitor

- [x] 6.1 Migration `20261020…_readonly_inquiry_monitor`: column-level `GRANT SELECT ("createdAt", "emailSentAt")` (C6). DB test: the grant works and the personal columns are still refused.
- [x] 6.2 `lib/monitor/monitor-core.ts`: the unsent-notification check. `scripts/monitor.mts`: the query (count only). Tests (D10).
- [x] 6.3 `docs/runbooks/monitoring.md`: what to do when the check fails.

## 7. Runbooks

- [x] 7.1 `docs/runbooks/secret-rotation.md`: the Resend keys, Production and Preview.
- [x] 7.2 `docs/runbooks/release.md`: the Phase 20 go-live steps (D11).

## 8. Preview

- [x] 8.1 Vercel Preview: the owner adds `RESEND_API_KEY`. The agent sets `EMAIL_FROM`, `INQUIRY_NOTIFICATION_EMAIL`, `INQUIRY_ACK_ENABLED=1` and `EMAIL_REDIRECT_TO=delivered@resend.dev`.
- [x] 8.2 E2E: the saved preview submission shows the confirmation sentence (D14).

## 9. Close-out

- [x] 9.1 Every box in [`validation.md`](validation.md) through *CI and merge*, then the PR into `develop`.
- [ ] 9.2 Release (`develop` → `main`): the D11 production variables (owner), the test inquiry and the Gmail check, then the *Production* boxes in `validation.md`.
