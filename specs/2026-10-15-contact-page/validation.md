# Validation — Phase 13 Contact page (no form yet)

## Roadmap success check ("Done when", verbatim)

> Every CTA on the site leads to `/contact`, and the links work on mobile.

- [x] **Every CTA leads to `/contact`:** on every public route, each CTA button and the nav's "Contact" link has `href="/contact"`, and `/contact` answers 200 (D8) — `contact.spec.ts` › every CTA on {route} leads to /contact (every shell route), locally and in CI run 38735809588
- [x] **Links work on mobile:** at 360px with touch, the email, phone and WhatsApp links have the right scheme and are ≥ 44 × 44 px; tapping the hero CTA and the mobile-nav "Contact" lands on `/contact` (D4, D8) — `contact.spec.ts` › contact page on a phone (3 tests), locally and in CI run 38735809588
- [ ] **On a real phone:** the owner taps the number (dialler opens), the email (mail app opens with the subject) and WhatsApp on the preview (plan 4.3)

## Page behaviour

- [x] **Content:** the page shows the email, local and international phone numbers, location and the response expectation, and every text node is keyed copy or site data (D3, D7) — `contact.spec.ts` › shows every channel… and shows only keyed copy and site data, CI run 38735809588
- [x] **Honest claims:** the response time and hours shown are the owner's answers A and B, word for word (C7) — `contact.next.reply` and `contact.hours` match owner answers A and B (spec *Owner answers*); asserted in `contact.spec.ts`, CI run 38735809588
- [x] **Copy email:** the button copies the address and announces "Copied"; without the Clipboard API it is not shown (D6) — `contact.spec.ts` › copies the email address and announces it, CI run 38735809588; hidden without `navigator.clipboard` by `useSyncExternalStore` (server snapshot `false`)
- [x] **External link:** WhatsApp opens in a new tab with `rel="noopener noreferrer"` and an `https:` URL (C6) — `contact.spec.ts` › links each channel with the right scheme, CI run 38735809588
- [x] **Metadata:** `<title>` is "{contact.heading} | RedHat Media" and the description is `contact.meta.description` (D1) — `contact.spec.ts` › has its heading, sections and metadata, CI run 38735809588
- [x] **Static:** the build's route table lists `/contact` as prerendered (`○`) (C2) — `○ /contact` in the CI run 38735809588 build and both local builds (plan 2.4)

## Accessibility and layout

- [x] **Contrast and layout:** the shell spec passes on `/contact` at 360/768/1440px, with no sideways scroll (C5) — `shell.spec.ts` › /contact at 360/768/1440px, locally and in CI run 38735809588
- [x] **Semantics:** one `h1`, section headings as `h2`, the channels in an `<address>`, `aria-current="page"` on the nav's "Contact" (D3, D8) — `contact.spec.ts` heading-level, `main address` and `aria-current` assertions, CI run 38735809588

## Gates

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass — locally (plan 4.1) and in CI run 38735809588 (unit 922)
- [x] `pnpm test:e2e` passes locally (ready and unavailable) and in CI; `preview-e2e` passes on the Vercel preview — local 300 + 2 skipped / 283 + 19 skipped; CI 283 + 19 skipped; preview 32 + 2 skipped (preview run 38735865547)
- [x] `pnpm test:db` passes (no schema change; the CI `db` job) — the `db` job in CI run 38735809588
- [ ] Owner check on the preview
