# Validation — Phase 20 Resend emails

## Roadmap success check ("Done when", verbatim)

Before this phase:

> Both emails arrive and pass DMARC. With Resend unreachable, the inquiry is still saved and the failure is logged.

As amended by this phase (spec D1, owner answer A):

> The team notification arrives in the team inbox and passes DMARC, and the client acknowledgment is accepted for Resend's test inbox. With Resend unreachable, the inquiry is still saved and the failure is logged. The acknowledgment reaching clients and DMARC on RHM's own domain move to the domain amendment (open question 2).

- [x] **The team notification arrives and passes DMARC:** the production test inquiry reaches `redhatmediang@gmail.com`. Gmail's *Show original* shows SPF, DKIM and DMARC all `PASS` (D11).
- [x] **The acknowledgment is accepted for Resend's test inbox:** a preview submission's row on Neon `preview` has `ackSentAt` set. The agent checks this with a read on the preview branch (D8).
- [x] **Resend unreachable → the inquiry is saved and the failure is logged:** unit and DB tests with a failing sender. The row is saved, `success` is returned, `emailSentAt` stays NULL, and `[email] team notification failed` is logged with the id only (D3, D14).
- [ ] *Moved to the domain amendment:* the acknowledgment reaching a real client address, and DMARC on RHM's own domain.

## Email content and safety

- [x] **Escaping:** hostile input is inert in both the HTML and the plain text (D7, D14).
- [x] **No user input in the subject or any header** (C2).
- [x] **The acknowledgment carries no free text:** no name, company or notes (D5).
- [x] **Per-recipient limit:** a fourth acknowledgment to one address within 24 h is skipped, while the inquiry is saved and the team notified (D6).
- [x] **No personal data in logs** or monitor output (C3).
- [x] The copy matches Appendices A–C as approved.

## Configuration

- [x] The `env.test.ts` D9 rules pass:
  - the variables are required on Vercel when the form is on;
  - the redirect is refused in production;
  - the acknowledgment is refused in production on `@resend.dev`.
- [x] `/contact` is still prerendered (`○`) (C4).
- [x] The new dependencies are at exact versions, at least two weeks old, and listed in `tech-stack.md`. `pnpm audit --prod` is clean (C5).

## Monitor

- [x] The migration is grant-only (C6). `rhm_readonly` can count by `createdAt` and `emailSentAt`, and is still refused `email` and `clientName` (DB test).
- [x] The `monitor-core` tests cover the check: it passes with none unsent, fails with an unsent row in the 15 min to 24 h window, and ignores rows outside the window (D10).
- [x] The monitoring runbook covers the response.

## CI and merge

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:db` and `pnpm build` all pass locally.
- [x] PR checks are green: `ci`, `db`, `gitleaks`, `preview-headers`, `preview-e2e`, `lighthouse` and Vercel.
- [x] The constitution changes (spec → *Constitution changes*) are in the PR.
- [x] The rotation and release runbooks are updated.

## Production (at the release, D11)

- [x] The owner has added to Vercel Production:
  - the Turnstile production keys;
  - `RESEND_API_KEY`, `EMAIL_FROM`, `INQUIRY_NOTIFICATION_EMAIL`;
  - `INQUIRY_FORM_ENABLED=1`.
  `INQUIRY_ACK_ENABLED` is unset.
- [x] Production `/contact` shows the form, and the build passed `lib/env.ts`.
- [x] A test inquiry on production: the success panel has **no** confirmation sentence, the email arrives, and `emailSentAt` is set.
- [x] **Owner check:** the team email reads well in Gmail on the web and on a phone, including its layout, the "Service: Type" lines and the reply link (owner answer I).
- [x] The test inquiry row is deleted from production, and the next monitor run is green.
