# Validation — Phase 18 Basic inquiry form + abuse protection

## Roadmap success check ("Done when", verbatim)

> A submission appears in the database, and invalid input shows field errors. Bot, honeypot, too-fast and over-limit submissions are rejected (429 for over-limit), and tests cover each case.

- [x] **A submission appears in the database:** the core with the real limiter and `save` writes a row (D13); a preview submission shows the success panel and its row is visible in Prisma Studio on `preview` (plan 5.4) — `submit.db.test.ts` (local and the CI `db` job); `preview-e2e` run 39432166739 saved the keyboard submission; the owner sent an inquiry on the PR #39 preview and saw its row in `Inquiry` on the Neon `preview` branch (2026-10-20)
- [x] **Invalid input shows field errors:** server field errors render under each field with a focused summary (D9, D13) — `submit-core.test.ts` › answers 400 with one message per invalid field; `inquiry.spec.ts` › a server-invalid submit shows field errors, focuses the summary and keeps the input (local Edge, 2026-10-20)
- [x] **Bot rejected:** a refused Turnstile token → `rejected` (403), nothing saved (D5, D13) — `submit-core.test.ts` › rejects with 403 when Turnstile refuses the token; `turnstile-core.test.ts` (refused token, wrong action/hostname, timeout, network error)
- [x] **Honeypot rejected:** a filled `website` field → `rejected`, nothing saved (D7, D13) — `submit-core.test.ts` › rejects a filled honeypot with 403 before parsing or counting
- [x] **Too fast rejected:** `elapsedMs` under 3 seconds, missing or over 24 hours → `rejected`, nothing saved (D7, D13) — `submit-core.test.ts` › rejects a missing / empty / non-numeric / negative / fractional elapsedMs, a submit under 3 seconds and a form open over 24 hours
- [x] **Over-limit rejected with 429:** the sixth submission in 10 minutes and the 21st in a day → `rate_limited` (429), nothing saved; also on a real Postgres (D6, D13) — `submit-core.test.ts` › answers 429 over the 10-minute limit / over the daily limit; `submit.db.test.ts` › five saves, then 429 and exactly five rows (local Docker Postgres 17, 2026-10-20)

## Form and pages

- [x] **Muted service refused** on the server (D8) — `submit-core.test.ts` › refuses a service muted since the form was built (D8), uncounted
- [x] **Generic messages** for every refusal, each offering the email address; none names the failed check (D9) — the form maps `rejected`, `error` and `unavailable` to `errors.generic` and `rate_limited` to `errors.rateLimited`, both with the mailto link, neither naming a check; in CI (no database) `inquiry.spec.ts` › keyboard alone ends on the generic message with the mailto link (ci run [39432085749](https://github.com/eonerhime/redhat-media/actions/runs/39432085749), PR #39 at `d4efb80`)
- [x] **Success panel** promises no email (C7) — Appendix A copy ("We reply within one working day…"), checked verbatim by script; seen on a local `next start`
- [x] **Switch:** off → `/contact` renders as before and the action answers `unavailable` (503); on in Preview and CI (D10) — off: `next build` without the variable, `contact.spec.ts` (Phase 13 assertions unchanged) and `inquiry.spec.ts` › switched off pass (197 passed, 2026-10-20), and `submit-core.test.ts` › answers 503; on: `ci.yml` job env and Vercel Preview (all branches), see `implementation.md`
- [x] **Turnstile keys:** test keys refused by `lib/env.ts` in production; action and hostname checked with a real secret (D5) — `env.test.ts` (both keys required when on; test keys refused when `VERCEL_ENV=production`); `turnstile-core.test.ts` › refuses another form's action / another site's hostname with a real secret
- [x] **Privacy notice** at `/privacy`: Appendix B as approved, linked from the consent label and the footer, in the sitemap (D11) — Appendix B verbatim (script compare); `inquiry.spec.ts` › privacy notice (sections, mailto, footer link); `sitemap.test.ts` lists `/privacy`
- [x] **Static:** `/contact` and `/privacy` prerendered (`○`) with the switch on and off (C2) — `next build` 2026-10-20: `○ /contact` and `○ /privacy` with the switch on and off; the form is in `contact.html` only when on

## Security and accessibility

- [x] **CSP:** enforced, with `https://challenges.cloudflare.com` only in `script-src`, `frame-src` and `connect-src`; no violations on `/contact` with the widget loaded (D5, C5) — `headers.test.ts`; `csp.spec.ts` › /contact and /privacy raise no violations with the widget loaded (local Edge, switch on, 2026-10-20)
- [x] **Accessibility:** zero axe violations on `/contact` and `/privacy`; the form completes by keyboard; the honeypot is neither focusable nor announced (D7, D9) — `a11y.spec.ts` at 360 and 1440 px on `/contact` (widget loaded) and `/privacy`; `inquiry.spec.ts` › keyboard alone (saved) and › honeypot (local Edge, 2026-10-20; full suite 403 passed)
- [x] **Secrets:** no secret in `NEXT_PUBLIC_*`; the real Turnstile secret only in Vercel Production; rotation runbook entry (C6) — no secret in a `NEXT_PUBLIC_*` variable (the public site key only); the real widget does not exist yet, so no real secret is stored anywhere, and Vercel Production is where the owner adds it before Phase 20; Preview, CI and `.env.example` hold Cloudflare's public test keys; rotation runbook row added. Ticked by the owner on 2026-10-20 with this note; recheck when Phase 20 adds the real keys

## Gates

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass — locally 2026-10-20 (run through `node`; 1232 unit tests; the only Prettier hit is the git-ignored `.claude/settings.local.json`); and in ci run [39432085749](https://github.com/eonerhime/redhat-media/actions/runs/39432085749) (PR #39 at `d4efb80`)
- [x] `pnpm test:db` passes locally and in the CI `db` job — locally (Docker Postgres 17, 31 tests) and `db` in ci run [39432085749](https://github.com/eonerhime/redhat-media/actions/runs/39432085749)
- [x] `pnpm test:e2e` passes locally and in CI; `preview-e2e` passes on the Vercel preview, including the successful submission — locally (403 / 197 passed, switch on / off); ci run [39432085749](https://github.com/eonerhime/redhat-media/actions/runs/39432085749) (381 passed, 34 skipped); `preview-e2e` run [39432166739](https://github.com/eonerhime/redhat-media/actions/runs/39432166739) (105 passed, 3 skipped, `inquiry.spec.ts` included with `E2E_INQUIRY_SUBMIT=success`, so the keyboard submission was saved to `preview`)
- [x] Owner check on the preview (plan 5.4) — 2026-10-20: the owner submitted an inquiry on the preview (success panel), found the row on the `preview` branch, and read `/privacy` (fine as written, including the meta description and footer label). No email arrived, as expected until Phase 20
