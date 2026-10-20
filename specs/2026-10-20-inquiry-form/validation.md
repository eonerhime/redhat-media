# Validation — Phase 18 Basic inquiry form + abuse protection

## Roadmap success check ("Done when", verbatim)

> A submission appears in the database, and invalid input shows field errors. Bot, honeypot, too-fast and over-limit submissions are rejected (429 for over-limit), and tests cover each case.

- [ ] **A submission appears in the database:** the core with the real limiter and `save` writes a row (D13); a preview submission shows the success panel and its row is visible in Prisma Studio on `preview` (plan 5.4) —
- [ ] **Invalid input shows field errors:** server field errors render under each field with a focused summary (D9, D13) —
- [ ] **Bot rejected:** a refused Turnstile token → `rejected` (403), nothing saved (D5, D13) —
- [ ] **Honeypot rejected:** a filled `website` field → `rejected`, nothing saved (D7, D13) —
- [ ] **Too fast rejected:** under 3 seconds, or a missing `startedAt` → `rejected`, nothing saved (D7, D13) —
- [ ] **Over-limit rejected with 429:** the sixth submission in 10 minutes and the 21st in a day → `rate_limited` (429), nothing saved; also on a real Postgres (D6, D13) —

## Form and pages

- [ ] **Muted service refused** on the server (D8) —
- [ ] **Generic messages** for every refusal, each offering the email address; none names the failed check (D9) —
- [ ] **Success panel** promises no email (C7) —
- [ ] **Switch:** off → `/contact` renders as before and the action answers `unavailable` (503); on in Preview and CI (D10) —
- [ ] **Turnstile keys:** test keys refused by `lib/env.ts` in production; action and hostname checked with a real secret (D5) —
- [ ] **Privacy notice** at `/privacy`: Appendix B as approved, linked from the consent label and the footer, in the sitemap (D11) —
- [ ] **Static:** `/contact` and `/privacy` prerendered (`○`) with the switch on and off (C2) —

## Security and accessibility

- [ ] **CSP:** enforced, with `https://challenges.cloudflare.com` only in `script-src`, `frame-src` and `connect-src`; no violations on `/contact` with the widget loaded (D5, C5) —
- [ ] **Accessibility:** zero axe violations on `/contact` and `/privacy`; the form completes by keyboard; the honeypot is neither focusable nor announced (D7, D9) —
- [ ] **Secrets:** no secret in `NEXT_PUBLIC_*`; the real Turnstile secret only in Vercel Production; rotation runbook entry (C6) —

## Gates

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass —
- [ ] `pnpm test:db` passes locally and in the CI `db` job —
- [ ] `pnpm test:e2e` passes locally and in CI; `preview-e2e` passes on the Vercel preview, including the successful submission —
- [ ] Owner check on the preview (plan 5.4) —
