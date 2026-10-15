# Plan — Phase 13 Contact page (no form yet)

Scope, decisions (D1–D8) and constraints (C1–C7) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 0. Constitution first

- [x] 0.1 `specs/roadmap.md` open question 8: record the owner's WhatsApp answer (owner answer C); the form's phone field stays open for Phase 18.

## 1. Data and copy

- [ ] 1.1 `lib/site.ts`: `phoneInternational`, `whatsappHref` and `hours` (owner answers B, C); drop the "Only /contact is left" comment (D2).
- [ ] 1.2 Copy keys from Appendix A (as approved) in `content/defaults.ts` (D7).

## 2. Page and components

- [ ] 2.1 `<ButtonLink>`: plain `<a>` for non-route hrefs, with a unit test (D5).
- [ ] 2.2 `components/contact/copy-email.tsx` (D6).
- [ ] 2.3 `app/(public)/contact/page.tsx`: header, channel cards, what happens next, what to include, metadata (D1, D3, D4).
- [ ] 2.4 Build: `/contact` is listed as prerendered (`○`) in the route table (C2). Record it.

## 3. Tests

- [ ] 3.1 `e2e/contact.spec.ts`: content, hrefs, mobile targets and taps, copy button, every CTA leads to `/contact` (D8).
- [ ] 3.2 `e2e/shell.spec.ts`: `/contact` joins the routes (D8).
- [ ] 3.3 Screenshots at 360px and 1440px checked by eye (wrapping email, card grid, focus rings).

## 4. Close

- [ ] 4.1 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, `pnpm test:e2e --workers=1` (ready, then with `DATABASE_URL` blank).
- [ ] 4.2 PR into `develop`: CI green, `preview-headers` and `preview-e2e` green on the Vercel preview.
- [ ] 4.3 Owner check on the preview, on a phone (tap to call, email, WhatsApp if any), then every `validation.md` box ticked.
