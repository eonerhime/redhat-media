# Implementation log — Phase 13 Contact page (no form yet)

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

- **2026-10-15** — Branch `feature/phase-13-contact-page` created from `develop` at `ef5dd04`. Spec, plan and validation drafted for approval.
  - Every CTA already points at `/contact`: the homepage hero (`components/home/hero.tsx`) and the shared `<Cta />` (`components/shared/cta.tsx`), plus the header nav. The route itself is missing, so all of them 404 today.

- **2026-10-15** — The owner answered A–D (one working day; Monday to Friday, 9am to 6pm WAT; WhatsApp on 0802 658 1200; city only) and approved the spec and Appendix A as drafted.
  - Constitution (plan 0.1): roadmap open question 8 records the WhatsApp answer; the form's phone field stays open for Phase 18.

- **2026-10-15** — Page built (plan 1–4.1).
  - `lib/site.ts`: `phoneInternational`, `whatsappHref`, `hours` and `mailtoHref()`, with `lib/site.test.ts` checking that every link dials or messages the number shown. `<ButtonLink>` renders a plain `<a>` for `mailto:` (D5).
  - `/contact` is static (`○`). `<CopyEmail>` is the only client code. It uses `useSyncExternalStore` so it renders nothing on the server, and nothing where the Clipboard API is missing. Its status line is a `role="status"` live region.
  - `e2e/contact.spec.ts` covers the content, link schemes, keyed text, copy button and `aria-current`, plus a 360px touch block (44 × 44 targets, no sideways scroll, tapping the hero CTA and the mobile-nav "Contact"). It also checks that every CTA on every shell route leads to `/contact`. The route list moved from `shell.spec.ts` to `e2e/routes.ts` so both specs share it. The contact spec needs no database, so it is not added to `preview-e2e`.
  - **Deviation (D3 amended):** the channel cards sit 2 × 2 from `md` rather than four across at `lg`. At 1440px four columns broke the email address mid-word ("gmail. / com"). Screenshots checked at 360px and 1440px.
  - Unit: 922 passed. E2E ready (`dev`): 300 passed, 2 skipped. E2E with `DATABASE_URL` blank: 283 passed, 19 skipped.

- **2026-10-15** — PR #18: CI run 38735809588 passed (`ci` with the database unavailable: unit 922, e2e 283 passed and 19 skipped; `db`; `gitleaks`). Preview run 38735865547 passed `preview-headers` and `preview-e2e` (32 passed, 2 skipped). The owner checked the links on a phone and approved the preview. Every plan and `validation.md` box is ticked.
