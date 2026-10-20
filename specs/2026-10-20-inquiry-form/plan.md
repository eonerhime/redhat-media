# Plan — Phase 18 Basic inquiry form + abuse protection

Scope, decisions (D1–D13) and constraints (C1–C8) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 0. Constitution first

- [x] 0.1 `specs/roadmap.md`: Phase 18 row (429 result, the switch); open questions 9 (owner answer D) and 10 (owner answers B, C).
- [x] 0.2 `specs/tech-stack.md`: CSP row (Turnstile origin), *In-place CMS* 4 (`privacy` prefix), *Environment* (`INQUIRY_FORM_ENABLED`, Turnstile key rules), Bot protection row (1.6.2).
- [x] 0.3 `README.md`: `privacy/` in the route tree.

## 1. Turnstile and environment

- [x] 1.1 Add `@marsidev/react-turnstile` 1.6.2 (exact pin) (C1).
- [x] 1.2 `lib/env.ts` + tests: `INQUIRY_FORM_ENABLED`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (required when on; test keys refused in production) (D5, D10). `.env.example` updated.
- [x] 1.3 `lib/security/turnstile.ts` + tests (D5).
- [x] 1.4 CSP: `https://challenges.cloudflare.com` in `script-src`, `frame-src`, `connect-src`, with `headers.test.ts` (D5, C5).
- [x] 1.5 CI workflow env and Vercel Preview env: test keys and `INQUIRY_FORM_ENABLED=1` (D5, D10). Record what was set where (no secret values).

## 2. Submit path

- [x] 2.1 `lib/inquiry/submit-core.ts` + unit tests: every D3 path, D4 results (D3, D4, D6–D8).
- [x] 2.2 Client-IP helper + tests (D6).
- [x] 2.3 `app/(public)/contact/actions.ts` (D3).
- [x] 2.4 `lib/inquiry/submit.db.test.ts`: saved row; 429 on the sixth submission (D13).

## 3. Pages and copy

- [ ] 3.1 Copy keys from Appendices A and B (as approved); `privacy` prefix in `BLOCK_KEY_PREFIXES` (D12).
- [ ] 3.2 `components/contact/inquiry-form.tsx`: fields, honeypot, `elapsedMs`, widget, errors, pending, success (D2, D7, D9).
- [ ] 3.3 `/contact`: the form section and layout, behind the switch (D1, D10).
- [ ] 3.4 `app/(public)/privacy/page.tsx`, footer link, sitemap (D11).
- [ ] 3.5 Build: `/contact` and `/privacy` prerendered (`○`) with the switch on and off (C2). Record it.

## 4. Tests

- [ ] 4.1 `e2e/inquiry.spec.ts` (D13), with the preview-only success test.
- [ ] 4.2 `/privacy` in `shell`, `a11y` and `csp` route lists; `/contact` a11y and CSP with the widget loaded (D13).
- [ ] 4.3 Screenshots at 360px and 1440px checked by eye (form layout, error states, success panel).

## 5. Close

- [ ] 5.1 Docs: `docs/runbooks/secret-rotation.md` Turnstile entry (C6).
- [ ] 5.2 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:db`, `pnpm build`, `pnpm test:e2e --workers=1`.
- [ ] 5.3 PR into `develop`: CI green; `preview-e2e` submits successfully on the Vercel preview.
- [ ] 5.4 Owner check on the preview: submit an inquiry from a phone, see it in Prisma Studio on the `preview` branch; read the privacy notice. Then every `validation.md` box ticked.
