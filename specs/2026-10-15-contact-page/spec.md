# Phase 13 — Contact page (no form yet)

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 1, Phase 13
- **Branch:** `feature/phase-13-contact-page` (from `develop` at `ef5dd04`)
- **Started:** 2026-10-15
- **Status:** approved by the owner, 2026-10-15

## What and why

Every CTA on the site ("Start a project" on the homepage hero, the shared `<Cta />` on every other page) and the header's "Contact" nav item already point at `/contact`, and that URL 404s today. This phase builds the page they lead to: **email, phone (tap to call), location and response expectations**, with no form. The inquiry form arrives in Phase 18.

Until then, this page *is* the inquiry flow. So beyond listing the channels, it tells a prospect what happens after they get in touch and what to put in their first message, so first messages arrive closer to a scoped brief (mission: *turn qualified prospects into scoped project inquiries*).

## Constitution sections this phase relies on

- `mission.md` → *Mission statement* ("make it effortless to tell us what they want built, shot or grown"), *Primary success metric* (inquiry → first response time) and *Guiding principles* 1 (inquiry first), 2 (the site is the proof), 4 (honest claims only) and 8 (creative, but restrained).
- `tech-stack.md` → *Architectural rules* 1 (server-first, static), 10 (accessibility) and 11 (performance budget); *In-place CMS* 4 (key pattern, `contact.` prefix, already in `BLOCK_KEY_PREFIXES`); *Security baseline* (`<ExternalLink>`, `https:`-only links, report-only CSP); *Design tokens* (contrast rules).
- `roadmap.md` → Phase 13; Phase 14 (`Organization` / `LocalBusiness` JSON-LD, OG image); Phase 15 (smoke test ends on `/contact`); Phase 18 (the form on this page); Phase 21 (`/contact?service=…` pre-fill); open question 8 (contact channels, WhatsApp).
- Phase 1 spec (footer contact details, mobile nav), Phase 2 spec D9 (contact details are site data in `lib/site.ts`, not copy), Phase 3 spec D8 (keyed-text check) and D9 (one primary button per view), Phase 6 spec D6 (site data shown beside keyed copy).

## Scope

1. **Constitution first** (listed below).
2. **Site data** (D2): `lib/site.ts` gains the international phone display, the WhatsApp link and the hours.
3. **Copy** (D7): new `contact.*` keys in `content/defaults.ts` (Appendix A).
4. **Button** (D5): `<ButtonLink>` renders a plain `<a>` for non-route hrefs (`mailto:`), so the primary button can open an email.
5. **Copy-email button** (D6): a small client component.
6. **Page** (D1, D3, D4): `app/(public)/contact/page.tsx`, static, with its metadata.
7. **Tests** (D8).

## Constitution changes (in this PR, before the code)

- **`roadmap.md`** → open question 8: record the owner's WhatsApp answer (owner answer C). The part about the form's phone field stays open for Phase 18.
- **`tech-stack.md`, `mission.md`, `README.md`:** no change. The key prefix, the route (README tree: `contact/`) and the rules already cover the page.

## Out of scope

- The inquiry form, Turnstile, rate limiting, the privacy notice (Phase 18).
- `/contact?service=…` pre-fill (Phase 21). A `service` query string is ignored for now.
- `Organization` / `LocalBusiness` / `ContactPage` JSON-LD and the OG image (Phase 14). The site data here is what Phase 14 will read.
- A map. An embedded map is an `<iframe>` (lint-banned outside `<VideoEmbed>`) and a CSP change for one more origin; a street address and a map link can come later if the owner wants one (owner answer D).
- Social media links (no handles have been supplied).
- Changing the footer or the About page; they keep reading the same `contact` data.

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **Route.** `app/(public)/contact/page.tsx`, a Server Component with no database read, cookies or headers, so it is **prerendered** (`○` in the build's route table). `generateMetadata`: title `{contact.heading} \| RedHat Media`, description `contact.meta.description`. No `loading.tsx` (nothing to wait for); errors fall to the shared `app/(public)/error.tsx`. | A static page loads instantly on mobile data and cannot be taken down by a database outage, which matters most on the page that turns visitors into leads. | Rules 1, 11; Phase 6 D8 (title) |
| D2 | **Contact details stay site data** in `lib/site.ts` (Phase 2 D9), shared with the footer and About, so a change lands everywhere at once. New fields:<br>• `phoneInternational: "+234 802 658 1200"` (shown under the local number for clients outside Nigeria; `phoneHref` is already international).<br>• `whatsappHref: "https://wa.me/2348026581200"` (owner answer C).<br>• `hours: "Monday to Friday, 9am to 6pm (WAT)"` (owner answer B). | One source of truth for the details Phase 14's JSON-LD will also need. An international format saves overseas clients from working out the dialling code. | Phase 2 D9; Phase 6 D6 |
| D3 | **Layout** (top to bottom; one column on phones, as noted from `md`/`lg`):<br>1. **Header:** `h1` (`contact.heading`), the intro (`muted`, 18px) and the **primary button** "Email us" (`mailto:` with a pre-filled subject, D5). It is the page's only primary button (Phase 3 D9).<br>2. **Ways to reach us:** an `<address>` (not italic) holding one card per channel, in a grid of 1 / 2 / 4 columns (phone / `md` / `lg`), cards styled like the About pillar cards (`ink` surface, `line` border, brand top rule). A visually hidden `h2` (`contact.channels.heading`) labels the group; each card has an `h3` label, the value and one `muted` note line:<br>&nbsp;&nbsp;– **Email:** the address as a `mailto:` link, plus the copy button (D6).<br>&nbsp;&nbsp;– **Phone:** the local number as a `tel:` link ("tap to call"), then "From outside Nigeria" and the international number.<br>&nbsp;&nbsp;– **WhatsApp** (owner answer C): "Chat on WhatsApp" through `<ExternalLink>` (`https://wa.me/…`, new tab, `rel="noopener noreferrer"`).<br>&nbsp;&nbsp;– **Location:** "Lagos, Nigeria" (site data), its note, and the hours under "Hours" (owner answer B).<br>3. **What happens next** (`h2`): a numbered list of three steps — you get in touch; **we reply within one working day** (owner answer A); we agree scope, timeline and price before work starts.<br>4. **What to include** (`h2`): a short intro and a bulleted checklist (service, goal and audience, timeline, budget range, links or examples), with brand-red markers like `<ItemList>`, then a text link "See our services" to `/services`.<br>The page has **no shared `<Cta />`**: it would link to itself. | Channels first, because that is what the visitor came for. Then the answers to "what happens if I write?" and "what should I say?", which lower the effort of a first message and make it more complete (mission principles 1 and 3). Reusing the About card style keeps the site consistent. | Mission principles 1, 3, 8; Phase 3 D9; Phase 6 D4 |
| D4 | **Mobile.** Every contact link is a real `<a>` with the right scheme (`mailto:`, `tel:+234…`, `https://wa.me/…`), so phones open the mail app, the dialler or WhatsApp. Each is a tap target of **at least 44 × 44 px** (the link is a block with padding, not just the text), and long values (the email address) wrap instead of overflowing at 360px. The local number shown and dialled is the same one the footer uses. | "The links work on mobile" (roadmap "Done when"). 44 px follows WCAG 2.5.5 and Apple's guideline; at 360px the email address is the longest unbroken string on the page. | Roadmap Phase 13; rule 10 |
| D5 | **Email button.** The `mailto:` link carries a pre-filled subject, `?subject=` + `contact.email.subject` ("Project inquiry"), URL-encoded. `<ButtonLink>` renders `next/link` for paths starting with `/` and a plain `<a>` otherwise, with the same classes, so `mailto:` does not go through the client router. The footer's plain address link stays as it is. | A subject line helps the team spot inquiries in a shared Gmail inbox (open question 3) before Phase 20 sends notifications. `next/link` is for routes, not other schemes. | Phase 3 D9 |
| D6 | **Copy email address** (client component, `components/contact/copy-email.tsx`): a secondary text button next to the address that copies it with `navigator.clipboard.writeText` and shows "Copied" for 2 seconds, announced through an `aria-live="polite"` region. It renders **only after hydration when the Clipboard API is available**, so without JavaScript or on an insecure origin the page simply shows the address and link. | On a desktop with no mail app set up, a `mailto:` link does nothing visible; copying the address is the common fallback. It is the page's only client code, and no library (C1). | Mission principle 1; rule 1 |
| D7 | **Copy** goes through `block()` with new `contact.*` keys (Appendix A). Contact values (address, numbers, location, hours) are site data, passed to the keyed-text check as site values, as on About. Strings marked **S** are sample copy for the company to accept or replace (Phase 6 D3); **O** strings need the owner's facts (owner answers A, B). No S string makes a promise the team has not confirmed (mission principle 4). | Every text string is keyed (Phase 3 D8), ready for in-place editing (Phase 27). | Phase 3 D8; Phase 6 D3; *In-place CMS* 4 |
| D8 | **Tests.**<br>• **Unit:** `<ButtonLink>` picks `Link` for `/…` and `<a>` for `mailto:`; the `mailto:` builder encodes the subject; the site data's `phoneHref` and `whatsappHref` match the displayed numbers' digits.<br>• **E2E** `e2e/contact.spec.ts` (CI; no database needed):<br>&nbsp;&nbsp;– `/contact` answers 200 with its `h1`, `<title>` and description; the email, phone (local and international), location and response expectation are shown; every text node is keyed or site data.<br>&nbsp;&nbsp;– Hrefs: the button and address are `mailto:redhatmediang@gmail.com` (the button with the subject), the number is `tel:+2348026581200`, WhatsApp is `https://wa.me/…` with `target="_blank"` and `rel="noopener noreferrer"`.<br>&nbsp;&nbsp;– **Mobile** (360 × 800, touch): each contact link's box is ≥ 44 × 44 px, nothing scrolls sideways, and tapping the hero CTA on `/` and the mobile-nav "Contact" both land on `/contact`.<br>&nbsp;&nbsp;– Copy button: copies the address (clipboard permission granted) and announces "Copied".<br>&nbsp;&nbsp;– **Every CTA leads to `/contact`:** on every route in the shell list, every link named like a CTA (`home.cta.button`, the hero's button) and the nav's "Contact" has `href="/contact"`, and no link points to another contact-like URL.<br>• `e2e/shell.spec.ts`: `/contact` joins the routes (layout at 360/768/1440px, contrast, reduced motion). The header's "Contact" item shows `aria-current="page"` there. | Proves "Done when" (every CTA leads to `/contact`, links work on mobile) in CI, with no device lab: correct schemes and target sizes are what make a link work when tapped. | Roadmap Phase 13 "Done when"; Phase 4 D6 |

## Constraints

- **C1 — No new libraries.** Clipboard through the browser API; no icon pack (any icon is inline SVG, `aria-hidden`).
- **C2 — Static.** `/contact` is prerendered (`○`). No public server component reads cookies, headers or the session. No change to other routes' rendering.
- **C3 — No schema change.** No migration, no seed change.
- **C4 — Existing suites hold.** `pnpm test`, `pnpm test:db` and `pnpm test:e2e` pass. Existing specs change only to add `/contact` to `shell.spec.ts`.
- **C5 — Contrast.** Every new text pairing is in the *Design tokens* table: `muted` only at ≥ 16px on `ink`/`bg`, links in `fg` with brand-red underlines, the button `fg` on `brand-deep`. The rendered-contrast check passes on `/contact`.
- **C6 — CSP and links.** No CSP change: `mailto:`, `tel:` and `wa.me` are navigations, not fetches. The WhatsApp link goes through `<ExternalLink>` (`https:` only).
- **C7 — Honest claims.** The response time and hours are shown only as the owner states them (owner answers A, B). If the owner prefers no time, step 2 says "We reply as soon as we can" with no number.

## Owner answers

Given 2026-10-15:

- **A. Response time:** "within one working day" (`contact.next.reply`: "We reply within one working day.").
- **B. Working hours:** Monday to Friday, 9am to 6pm WAT. Site data `hours: "Monday to Friday, 9am to 6pm (WAT)"`, shown on the Location card under `contact.hours.label`.
- **C. WhatsApp:** yes, on 0802 658 1200: `whatsappHref: "https://wa.me/2348026581200"`, a "Chat on WhatsApp" card. Roadmap open question 8 records it.
- **D. Location:** city only, "Lagos, Nigeria". No street address or map for now.
- **E. Copy:** Appendix A approved as drafted, including the location note and the scope step.

---

## Appendix A — New copy (approved)

**S** = sample copy for the company to accept or replace. **O** = needs the owner's fact. Site data (not keys): `redhatmediang@gmail.com`, `0802 658 1200`, `+234 802 658 1200`, `Lagos, Nigeria`, `Monday to Friday, 9am to 6pm (WAT)`.

| Key | Text | |
| --- | --- | --- |
| `contact.meta.description` | Contact RedHat Media in Lagos by email or phone to start a photography, video, marketing or web project. | S |
| `contact.heading` | Let's talk about your project | S |
| `contact.intro` | Tell us what you want built, shot or grown. Email or call us, and the team will take it from there. | S |
| `contact.email.button` | Email us | S |
| `contact.email.subject` | Project inquiry | S |
| `contact.channels.heading` | Ways to reach us | S (visually hidden `h2` over the cards, so the card `h3`s nest correctly) |
| `contact.email.label` | Email | S |
| `contact.email.note` | Best for briefs, files and links. | S |
| `contact.email.copy` | Copy email address | S |
| `contact.email.copied` | Copied | S |
| `contact.phone.label` | Phone | S |
| `contact.phone.note` | Tap the number to call from your phone. | S |
| `contact.phone.international` | From outside Nigeria | S |
| `contact.whatsapp.label` | WhatsApp | S |
| `contact.whatsapp.link` | Chat on WhatsApp | S |
| `contact.whatsapp.note` | Send us a message any time. | S |
| `contact.location.label` | Location | S |
| `contact.location.note` | We work with clients in Lagos, across Nigeria and abroad. | S |
| `contact.hours.label` | Hours | S |
| `contact.next.heading` | What happens next | S |
| `contact.next.send` | You send us a message or call with what you need. | S |
| `contact.next.reply` | We reply within one working day. | O (answer A) |
| `contact.next.scope` | We agree the scope, timeline and price with you before any work starts. | S |
| `contact.brief.heading` | What to include | S |
| `contact.brief.intro` | The more we know, the faster we can give you a quote. | S |
| `contact.brief.service` | The service you need | S |
| `contact.brief.goal` | What you want to achieve, and who it is for | S |
| `contact.brief.timeline` | Your timeline and any fixed dates | S |
| `contact.brief.budget` | Your budget range | S |
| `contact.brief.examples` | Links or examples you like | S |
| `contact.brief.services` | See our services | S |

