# Phase 18 — Basic inquiry form + abuse protection

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 2, Phase 18
- **Branch:** `feature/phase-18-inquiry-form` (from `develop` at `0abd037`)
- **Started:** 2026-10-20
- **Status:** approved by the owner 2026-10-20 (Appendices A and B as written); built and validated 2026-10-20 (PR #39)

## What and why

`/contact` lists the ways to reach RHM, but a prospect still has to write a first message from scratch. This phase adds the **inquiry form**: a single step on `/contact` that saves a structured inquiry (name, email, phone, services, notes, consent) to the `Inquiry` table from Phase 17. It ships with its abuse protection on day one: Cloudflare Turnstile, a honeypot, a minimum time-to-submit and a per-IP rate limit. It also adds the **privacy notice** the consent checkbox links to.

Phase 19 turns the form into the scope stepper (budget, timeline, packages); Phase 20 emails the team and the client.

**Until Phase 20 sends the team notification, nobody is told when an inquiry is saved**, and the inbox only arrives in Phase 32. An inquiry nobody sees is a lost lead (mission: *zero lost inquiries*). So the form ships behind a switch (D10): on in previews, off in production until Phase 20 turns it on. Each phase can still be released to `main` as it lands.

## Constitution sections this phase relies on

- `mission.md` → *Primary success metric* (saved, delivered, acknowledged), *Supporting metrics* (zero lost inquiries) and *Guiding principles* 1 (inquiry first), 2 (the site is the proof), 4 (honest claims) and 9 (secure from the first commit).
- `tech-stack.md` → the Bot protection row (Turnstile, `@marsidev/react-turnstile` 1.6); *Architectural rules* 1 (server-first, static), 3 (services through `visibleServices()`; server-side rejection of a muted service), 4 (save first, then email), 10 (accessibility); *Security baseline* (public forms: Turnstile + honeypot + minimum time-to-submit + 5 per 10 min / 20 per day per IP, generic errors; CSP; personal data under NDPA 2023; IPs only as salted hashes); *In-place CMS* 4 (block-key pattern); *Environment*.
- `roadmap.md` → Phase 18; Phase 19 (stepper), Phase 20 (emails), Phase 21 (`?service=` pre-fill), Phase 23 (retention job), Phase 25 (unguarded-action CI check with an allowlist for this action); open questions 9 (Neon plan) and 10 (data protection).
- Phase 7 spec D8 (`rateLimit`), Phase 13 spec (the `/contact` page, `<ButtonLink>`, keyed copy), Phase 14 spec D7, D8 (static enforced CSP), Phase 17 spec (the `Inquiry` model, `inquiryInputSchema`, `toInquiryData`).

## Scope

1. **Constitution first** (listed below).
2. **Turnstile** (D5): `@marsidev/react-turnstile` 1.6.2, `lib/security/turnstile.ts` (server verification), env vars, the CSP.
3. **Submit core and action** (D2–D4, D6–D8): `lib/inquiry/submit-core.ts` (pure, dependencies injected) and the server action `app/(public)/contact/actions.ts`.
4. **Form** (D1, D9): `components/contact/inquiry-form.tsx` on `/contact`, behind the switch (D10).
5. **Privacy notice** (D11): `app/(public)/privacy/page.tsx`, linked from the consent checkbox and the footer.
6. **Copy** (D12): `contact.form.*` and `privacy.*` keys (Appendices A, B).
7. **Tests** (D13).

## Constitution changes (in this PR, before the code)

- **`roadmap.md`** → Phase 18 row: "429 for over-limit" becomes "a 429 result for over-limit" (server actions always answer HTTP 200; D4), and the form is off in production until Phase 20 (D10). Open question 9: the Neon decision (owner answer D). Open question 10: answered (owner answers B, C).
- **`tech-stack.md`** → *Security baseline*, CSP row: Turnstile's origin in `script-src`, `frame-src` and `connect-src` (D5). *In-place CMS* 4: the key pattern gains the `privacy` prefix (D12). *Environment*: `INQUIRY_FORM_ENABLED`, and the Turnstile variables' rules (D5, D10). Bot protection row: pinned at 1.6.2.
- **`README.md`**: the route tree gains `privacy/`.
- **`mission.md`:** no change.

## Out of scope

- Budget, timeline and package fields, and the multi-step layout (Phase 19). `budgetRange` and `timeline` stay `NULL`.
- Any email (Phase 20). The success message promises no email.
- `/contact?service=…` pre-fill (Phase 21). A `service` query string is still ignored.
- The retention job (Phase 23). The privacy notice states the policy; the job enforces it later.
- The CI check for unguarded server actions (Phase 25). This action will be on its allowlist.
- Neon Launch (owner answer D: stay on Free).
- Changing the Phase 17 schema or migration.

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **Placement.** A new section on `/contact`, **directly after the header**, titled "Tell us about your project" (`h2`). From `lg` it takes two thirds of the row and the channel cards stack in the remaining third; on phones the form comes first and the cards follow. "What happens next" and "What to include" stay below. The header's "Email us" button stays as the page's primary button for visitors who prefer email (Phase 3 D9), and the form's submit button uses the same primary style because it is the form's only action. `/contact` stays **prerendered** (`○`): the form is a client component, its service choices come from `visibleServices()` at build time, and the page reads no cookies or headers. | Inquiry first (mission principle 1): the form is what the page is for once it exists. A static page loads fast on mobile data and survives a database outage, when the form still renders and the error message offers email instead. | Mission principles 1, 2; rule 1; Phase 13 D1, D3 |
| D2 | **Fields** (Appendix A copy): name, email, phone (required; owner, Phase 17), company (optional), services (one checkbox per **visible** service, in a `fieldset` with a `legend`, at least one), project details (`textarea`), and a consent checkbox whose label links to `/privacy` (new tab). Inputs carry native constraints that mirror `inquiryInputSchema` (`required`, `type="email"`, `type="tel"`, `maxLength`, `autoComplete`), so most mistakes are caught before a round trip. The server parses with the Phase 17 schema and is the only authority. | The roadmap's field list plus the optional company field the model already has. Native constraints cost no JavaScript; the schema stays the contract. | Roadmap Phase 18; Phase 17 D5 |
| D3 | **One server action, a thin wrapper around a pure core.** `app/(public)/contact/actions.ts` (`"use server"`) exports `submitInquiry(prev, formData)`. It reads the client IP and calls `submitInquiryCore(formData, deps)` in `lib/inquiry/submit-core.ts`. The deps are `now`, `rateLimit`, `verifyTurnstile`, `visibleCategories` and `save`, so every path is unit-tested without a network or database (the `rate-limit-core.ts` pattern). The core runs, in order:<br>1. **Switch** (D10): off → `unavailable`.<br>2. **Honeypot and time** (D7): either fails → `rejected`.<br>3. **Parse** with `inquiryInputSchema` → `invalid` with field errors and the submitted values (not rate-limited, so a person fixing typos is never locked out).<br>4. **Muted service**: a parsed service not in `visibleCategories()` → `invalid` on `services` ("Choose services from the list.").<br>5. **Rate limit** (D6) → `rate_limited`.<br>6. **Turnstile** (D5) → `rejected`.<br>7. **Save** with `toInquiryData` → `success`; a database error → `error`. | A pure core makes every rejection path cheap to test. Cheap, side-effect-free checks run before the database and the Cloudflare call; the rate limit counts only well-formed submissions, which are what can create rows. | Rules 3, 4; Phase 7 D8 |
| D4 | **Typed results with HTTP-like codes.** `InquiryResult` is one of `{ status: "idle" }`, `{ status: "success", code: 201 }`, `{ status: "invalid", code: 400, fieldErrors, values }`, `{ status: "rejected", code: 403 }`, `{ status: "rate_limited", code: 429 }`, `{ status: "unavailable", code: 503 }` or `{ status: "error", code: 500 }`. Server actions always answer HTTP 200, so the **429** of the roadmap's "Done when" is this result's `code`, asserted in tests (roadmap row amended). `values` echoes only the D2 fields, never the honeypot, timestamp or token. | Tests can assert the exact outcome; the form maps each status to one message (D9). Building a route handler only to send a real 429 would lose the server action's built-in origin check (CSRF). | Roadmap Phase 18 "Done when"; *Security baseline* (origin check) |
| D5 | **Turnstile.** The widget is `@marsidev/react-turnstile` **1.6.2** (React 19 peer; the tech stack lists 1.6), rendered inside the form with `options: { action: "inquiry", theme: "dark", size: "flexible", appearance: "interaction-only" }`; the token arrives as `cf-turnstile-response`. `lib/security/turnstile.ts` (`server-only`) POSTs `secret`, `response`, `remoteip` and an `idempotency_key` to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with a 5-second timeout. It passes only when `success` is true and, **with a real secret**, `action` is `"inquiry"` and `hostname` is the site's host. A timeout or network error fails closed (`rejected`), and the message offers email (D9).<br>**Keys** (owner answer A): one real widget for `redhat-media.vercel.app` in Vercel **Production**; Vercel **Preview**, local and CI use Cloudflare's test keys (site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`, always pass). `lib/env.ts`: both variables are required wherever `INQUIRY_FORM_ENABLED=1`, and **refused in production if they are the test keys**.<br>**CSP:** `https://challenges.cloudflare.com` joins `script-src`, `frame-src` and `connect-src`, the three directives Cloudflare documents. | Turnstile is the main bot defence; verifying on the server is what makes it one. Checking action and hostname stops a token minted for another site or form being replayed here. Test keys let previews and CI exercise the full path with no challenge to solve. | Bot protection row; *Security baseline*; owner answer A |
| D6 | **Rate limit**, keyed by the client IP (`x-real-ip`, else the first `x-forwarded-for` entry; Vercel sets both, and a missing IP shares the key `unknown`): `rateLimit("inquiry", ip, { max: 5, windowSec: 600 })`, then `rateLimit("inquiry.day", ip, { max: 20, windowSec: 86400 })`. Either refusal → `rate_limited`. The IP is stored only as a salted hash (Phase 7 D8). | The roadmap's limits, on the shared Postgres limiter. | Roadmap Phase 18; Phase 7 D8 |
| D7 | **Honeypot and time-to-submit.** A text input `website`, inside a wrapper that is off-screen and `aria-hidden`, with `tabIndex={-1}` and `autoComplete="off"`: any value → `rejected`. A hidden `elapsedMs`: how long the form was open, measured on the visitor's device with `performance.now()` from hydration to submit, and set on the submitted `FormData` just before the action runs. Missing, not a whole number, under **3,000** (3 seconds) or over **86,400,000** (24 hours) → `rejected`. Both answer with the same generic message as a failed Turnstile check, which **offers the email address**, rather than a fake success. | Bots that fill every field or post instantly are caught for free. A password manager can fill a hidden field, so a fake "thanks" could silently lose a real lead; a visible error with an email fallback cannot. The duration is measured on the client because the page is static; it only stops naive bots, and Turnstile carries the real weight. A duration rather than a start time (amended 2026-10-20, owner): comparing a client timestamp with the server's clock would refuse every visitor whose device clock runs a few seconds fast, while `performance.now()` is monotonic and needs no shared clock. | *Security baseline*; mission (zero lost inquiries) |
| D8 | **Muted services refused on the server.** The form shows only `visibleServices()`; the core checks every submitted category against `visibleCategories()` read **at submit time**, so a form built before a service was muted, or a crafted request, cannot save it. | `tech-stack.md` → *Architectural rules* 3. | Rule 3 |
| D9 | **Form behaviour** (client component, `useActionState`):<br>• **Errors:** each field shows its message under the input (`aria-describedby`, `aria-invalid`); an error summary at the top of the form lists them as links to the fields and receives focus. Submitted values are restored from `values`.<br>• **Generic messages** (Appendix A): one for `rejected` / `error` / `unavailable` ("We couldn't send your inquiry…" with the email address), one for `rate_limited`. Neither says which check failed.<br>• **Pending:** the submit button is disabled and reads "Sending…".<br>• **Success:** the form is replaced by a confirmation panel (`role="status"`, heading focused) that repeats the response time already on the page ("We reply within one working day") and **promises no email**.<br>• **Without JavaScript** the widget cannot load, so a submission fails Turnstile and shows the generic message with the email address. | Accessible, honest feedback. Generic messages give a bot nothing to tune against. No email is promised until Phase 20 sends one. | Rule 10; mission principle 4; *Security baseline* (generic errors) |
| D10 | **The switch: `INQUIRY_FORM_ENABLED`.** A server env var, read at build time by `/contact` and at submit time by the action. `1` on Vercel Preview, in CI and in `.env.example`; **unset on Production until Phase 20** sets it with the team notification. Off, `/contact` renders exactly as it does today, the privacy notice still ships, and the action answers `unavailable`. | Inquiries must not pile up unseen in production (see *What and why*). A switch lets every phase still release to `main`, and turning the form on in production becomes a one-line env change reviewed with Phase 20. | Mission (zero lost inquiries); owner workflow (release per phase) |
| D11 | **Privacy notice** at `/privacy` (Appendix B), a static page with keyed copy (`privacy.*`) in the site's article style. It covers: who RHM is (RC 1379619, Lagos); what the form collects and why; the lawful basis (consent, recorded as `consentAt`); who processes the data (RHM staff; Neon, database in London; Vercel, hosting; Cloudflare Turnstile, bot check; Resend from Phase 20, listed when it ships); **retention: closed inquiries anonymised after 24 months**, rate-limit records deleted after 30 days (owner answer C); rights under the NDPA 2023 (access, correction, deletion, withdrawing consent, complaining to the NDPC); and the **contact, `redhatmediang@gmail.com`** (owner answer B). Linked from the consent label (new tab, so the form keeps its input) and the footer; listed in the sitemap; metadata like other pages. It ships in production even while the form is off. | Consent is only meaningful with a notice to consent to (NDPA 2023). Shipping the notice first costs nothing and lets the owner review it on production. | Open question 10; *Security baseline* (personal data) |
| D12 | **Copy.** New keys under `contact.form.*` (Appendix A) and a new **`privacy`** block-key prefix (Appendix B), added to `BLOCK_KEY_PREFIXES` and the key pattern in `tech-stack.md` → *In-place CMS* 4, so Phase 27 can edit the notice in place. Field error messages stay in `lib/validation/inquiry.ts` (Phase 17 D5). | Every visible string is keyed (Phase 3 D8). | Phase 3 D8; *In-place CMS* 4 |
| D13 | **Tests.**<br>• **Unit** `lib/inquiry/submit-core.test.ts`: one test per path in D3, including **honeypot**, **too fast**, **missing or out-of-range `elapsedMs`**, **invalid fields** (no rate-limit call), **muted service**, **over the 10-minute limit (429)**, **over the daily limit (429)**, **Turnstile refused**, **database error**, **switch off**, and **success** (saves exactly `toInquiryData(values, now)`).<br>• **Unit** `lib/security/turnstile.test.ts` (mocked `fetch`): success; `success: false`; wrong action or hostname with a real secret; both ignored with the test secret; timeout and network error fail closed; the request body carries `remoteip` and an `idempotency_key`.<br>• **Unit**: `env.test.ts` (variables required when the switch is on; test keys refused in production), `headers.test.ts` (the three CSP additions), `block.test.ts` (new keys and prefix), client-IP parsing.<br>• **DB** `lib/inquiry/submit.db.test.ts`: the core with the real `rateLimit` and `save` saves a row; the sixth well-formed submission from one IP in 10 minutes returns 429 and saves nothing more.<br>• **E2E** `e2e/inquiry.spec.ts`: the form renders with the visible services; an empty submit shows the native constraints and a server-invalid submit shows field errors with focus on the summary; keyboard-only completion; the honeypot is not focusable or announced. **On the Vercel preview** (`preview-e2e`, test keys, preview database): a valid submission shows the success panel. In CI (no database) the same submission shows the generic message with the email address.<br>• `e2e/shell.spec.ts`, `a11y.spec.ts`, `csp.spec.ts`: `/privacy` joins the routes; zero axe violations and no CSP violations on `/contact` with the widget loaded. | Proves "Done when": a submission is saved, invalid input shows field errors, and bot, honeypot, too-fast and over-limit submissions are rejected (429 for over-limit), with a test for each case. | Roadmap Phase 18 "Done when" |

## Constraints

- **C1 — One new library:** `@marsidev/react-turnstile` 1.6.2, already in `tech-stack.md`. No form or phone library.
- **C2 — Static pages.** `/contact` and `/privacy` are prerendered (`○`). No public server component reads cookies, headers or the session.
- **C3 — No schema change.** Phase 17's model and migration are used as they are.
- **C4 — Existing suites hold.** Existing tests change only to add `/privacy` to route lists, the CSP additions and the new keys.
- **C5 — CSP stays enforced** and static, widened only by `https://challenges.cloudflare.com` in three directives.
- **C6 — Secrets.** `TURNSTILE_SECRET_KEY` is server-only and never `NEXT_PUBLIC_*`; the real one lives only in Vercel Production. The rotation runbook gains a Turnstile entry.
- **C7 — Honest claims.** The success panel and the notice promise only what exists: no email until Phase 20, and the retention the owner set.
- **C8 — Rate-limit budget in tests.** `preview-e2e` submits at most two inquiries per run, under the 5-per-10-minutes limit for the runner's IP.

## Owner answers

Given 2026-10-20:

- **A. Turnstile:** a real widget for production only; previews, local and CI use Cloudflare's test keys.
- **B. Data-protection contact:** `redhatmediang@gmail.com`, named as RedHat Media (no individual).
- **C. Retention:** closed inquiries anonymised after 24 months.
- **D. Neon plan:** stay on Free; revisit at the Milestone 2 release (Phase 23). From Phase 20 every inquiry is also emailed, so a database loss would not lose leads.

**Owner actions** (needed before Phase 20 turns the form on in production, not before this PR): create the Turnstile widget (Cloudflare dashboard → Turnstile → Add widget, hostname `redhat-media.vercel.app`, mode *Managed*) and add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` to Vercel Production. The agent sets the test keys and `INQUIRY_FORM_ENABLED=1` on Vercel Preview and in CI.

---

## Appendix A — Form copy (`contact.form.*`, draft for approval)

| Key | Text |
| --- | --- |
| `heading` | Tell us about your project |
| `intro` | A few details help us reply with something useful. Fields marked * are required. |
| `name.label` | Your name * |
| `email.label` | Email * |
| `phone.label` | Phone or WhatsApp * |
| `phone.hint` | Nigerian numbers like 0803 123 4567; international numbers with a country code, like +44. |
| `company.label` | Company or organisation |
| `services.legend` | What do you need? * |
| `services.hint` | Choose all that apply. |
| `notes.label` | Tell us about the project * |
| `notes.hint` | What you need, who it's for, and any deadline or budget you have in mind. |
| `consent.label` | I agree that RedHat Media may store these details to reply to my inquiry, as described in the |
| `consent.link` | privacy notice |
| `submit` | Send inquiry |
| `submitting` | Sending… |
| `errors.summary` | Please fix the following: |
| `errors.generic` | We couldn't send your inquiry. Please try again, or email us at {email}. |
| `errors.rateLimited` | You've sent several inquiries in a short time. Please try again later, or email us at {email}. |
| `success.heading` | Thanks, we've received your inquiry |
| `success.body` | We reply within one working day. If it's urgent, call or WhatsApp us on the numbers on this page. |

`{email}` is the site email from `lib/site.ts`, inserted at render time.

## Appendix B — Privacy notice (`privacy.*`, draft for approval)

| Section | Text |
| --- | --- |
| Heading | Privacy notice |
| Updated | Last updated 20 October 2026. |
| Who we are | RedHat Media (RC 1379619) is a media company based in Lagos, Nigeria. This notice explains what we do with the details you send through our inquiry form. |
| What we collect | Your name, email address, phone number, company (if you give one), the services you're interested in, your project details, and the time you agreed to this notice. To protect the form from abuse we also keep a scrambled (hashed) version of your IP address, which cannot be turned back into the address. |
| Why | To reply to your inquiry, understand what you need and prepare a proposal. We don't use your details for marketing, and we don't sell them. |
| Legal basis | Your consent, which you give by ticking the box on the form. You can withdraw it at any time. |
| Who processes it | RedHat Media staff who handle inquiries, and the services that run this website: Neon (our database, hosted in London), Vercel (website hosting) and Cloudflare Turnstile (checks that a form is sent by a person, not a bot). |
| How long we keep it | We keep an inquiry while we're discussing your project. Once it's closed, we anonymise it after 24 months. The hashed IP records used to stop abuse are deleted after 30 days. |
| Your rights | Under the Nigeria Data Protection Act 2023 you can ask to see the details we hold about you, correct them, delete them, or withdraw your consent. You can also complain to the Nigeria Data Protection Commission. |
| Contact | To use these rights or ask a question, email redhatmediang@gmail.com. |
