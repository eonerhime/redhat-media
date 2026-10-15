# Validation — Phase 13 Contact page (no form yet)

## Roadmap success check ("Done when", verbatim)

> Every CTA on the site leads to `/contact`, and the links work on mobile.

- [ ] **Every CTA leads to `/contact`:** on every public route, each CTA button and the nav's "Contact" link has `href="/contact"`, and `/contact` answers 200 (D8)
- [ ] **Links work on mobile:** at 360px with touch, the email, phone and WhatsApp links have the right scheme and are ≥ 44 × 44 px; tapping the hero CTA and the mobile-nav "Contact" lands on `/contact` (D4, D8)
- [ ] **On a real phone:** the owner taps the number (dialler opens), the email (mail app opens with the subject) and WhatsApp on the preview (plan 4.3)

## Page behaviour

- [ ] **Content:** the page shows the email, local and international phone numbers, location and the response expectation, and every text node is keyed copy or site data (D3, D7)
- [ ] **Honest claims:** the response time and hours shown are the owner's answers A and B, word for word (C7)
- [ ] **Copy email:** the button copies the address and announces "Copied"; without the Clipboard API it is not shown (D6)
- [ ] **External link:** WhatsApp opens in a new tab with `rel="noopener noreferrer"` and an `https:` URL (C6)
- [ ] **Metadata:** `<title>` is "{contact.heading} | RedHat Media" and the description is `contact.meta.description` (D1)
- [ ] **Static:** the build's route table lists `/contact` as prerendered (`○`) (C2)

## Accessibility and layout

- [ ] **Contrast and layout:** the shell spec passes on `/contact` at 360/768/1440px, with no sideways scroll (C5)
- [ ] **Semantics:** one `h1`, section headings as `h2`, the channels in an `<address>`, `aria-current="page"` on the nav's "Contact" (D3, D8)

## Gates

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass
- [ ] `pnpm test:e2e` passes locally (ready and unavailable) and in CI; `preview-e2e` passes on the Vercel preview
- [ ] `pnpm test:db` passes (no schema change; the CI `db` job)
- [ ] Owner check on the preview
