# Phase 19 — Scope stepper

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 2, Phase 19
- **Branch:** `feature/phase-19-scope-stepper` (from `develop` at `dd4a340`)
- **Started:** 2026-10-20
- **Status:** approved by the owner 2026-10-20 (Appendices A and B, with review notes 1 and 2 applied)

## What and why

Phase 18's single-step form saves who a prospect is and which services they want, but not the **scope**: what kind of project, roughly what budget, and when. Without that, every inquiry starts with a discovery call. The mission's supporting metric is the *share of inquiries with a complete scope (service, budget range, timeline)*, because scoped inquiries can be quoted without one.

This phase turns the form into a **stepper**: services → project types per service → budget → timeline → your details → check and send. Every answer is kept while the visitor moves back and forth, the browser's Back button steps back too, and the whole flow works by keyboard and screen reader. The form stays behind `INQUIRY_FORM_ENABLED` (Phase 18 spec, D10), so production is unchanged until Phase 20.

The roadmap's "package/tier per service" becomes **project types per service** (owner answer A): the kind of work, with no prices, so nothing reads as a package or a quote (mission → *Out of scope*: binding price quotes).

## Constitution sections this phase relies on

- `mission.md` → *Supporting metrics* (complete scope), *Guiding principles* 1 (inquiry first), 2 (the site is the proof), 4 (honest claims), 9 (secure from the first commit); *Out of scope* (no binding price quotes).
- `tech-stack.md` → *Architectural rules* 1 (static), 3 (services through `visibleServices()`; muted service refused on the server), 10 (accessibility); *Schema decisions* (`Inquiry`, `BudgetRange`, `InquiryTimeline`); *In-place CMS* 4 (block keys); *Security baseline* (public forms, generic errors).
- `roadmap.md` → Phase 19; Phase 20 (emails show the scope), Phase 21 (`?service=` pre-fill builds on this stepper), Phase 32 (inbox shows the scope); open question 7 (packages per service).
- Phase 17 spec (D2 enums, D5 schema, D7 `toInquiryData`), Phase 18 spec (D2–D10, C2, C8).

## Scope

1. **Constitution first** (listed below).
2. **Project types** (D1, D2): typed config `content/project-types.ts` and keyed labels.
3. **Schema and validation** (D2, D3): `Inquiry.projectTypes String[]`, an additive migration, and `inquiryInputSchema` rules for project types, budget and timeline.
4. **Submit path** (D4): the core and its result types carry the new fields.
5. **Stepper** (D5–D11): `components/contact/inquiry-form.tsx` becomes the six-step form.
6. **Copy** (D12, Appendices A, B).
7. **Tests** (D13) and the performance budget (D14).

## Constitution changes (in this PR, before the code)

- **`roadmap.md`** → Phase 19 row: "package/tier per service" becomes "project types per service", and a review step is added (owner answers A, C). Open question 7: packages answered as project types, no prices (owner answer A).
- **`tech-stack.md`** → *Schema decisions*: a row for `Inquiry.projectTypes` (ids from config, validated by Zod; owner answer E), and `budgetRange` / `timeline` required by the schema from Phase 19 while the columns stay nullable (owner answer B).
- **`README.md`** → §5 `Inquiry` model: `projectTypes String[]`.
- **`mission.md`:** no change.

## Out of scope

- `/contact?service=…` pre-fill (Phase 21). A `service` query string is still ignored.
- Emails (Phase 20); they will show the scope. The success panel still promises no email.
- Prices, packages or quotes of any kind.
- Editing the project-type lists from the CMS. Their **labels** are block keys (editable in place from Phase 27); adding or removing a type is a code change.
- Saving progress across page loads (e.g. `localStorage`). Progress is kept within the page visit only.
- Turning the form on in production (Phase 20).

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **Project types per service** (Appendix B): 4–5 kinds of project per service, each ending with **"Not sure yet"**. Ids are `CATEGORY.TYPE` (e.g. `PHOTOGRAPHY.EVENT`, `WEB_APP.NOT_SURE`); labels are block keys `contact.form.types.<serviceId>.<typeId>`. The visitor may pick **several** per service and must pick at least one for each chosen service. "Not sure yet" is **exclusive**: ticking it clears the others in that service, and ticking another clears it. | Real briefs mix kinds of work (an event plus product shots). "Not sure yet" keeps a required step honest for visitors who don't know. No prices, so nothing promises a package. | Owner answers A, F; mission *Out of scope* |
| D2 | **Storage: `projectTypes String[]`** on `Inquiry`, default empty, added by an additive migration (`ALTER TABLE … ADD COLUMN "projectTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`). Existing rows (Phase 18 previews) keep an empty list. The allowed ids live in `content/project-types.ts`, not a Postgres enum, so adding or renaming a type needs no migration. Table-level grants already cover the new column; `rhm_readonly` still cannot read `Inquiry` (Phase 17 D4). | Six short lists that may change with the business don't justify an enum migration per change or a child table and join. Zod is the gate (D3). | Owner answer E; Phase 17 D4 |
| D3 | **Validation** in `inquiryInputSchema` (Phase 17 D5), still the only authority:<br>• `projectTypes`: an array of known ids, no duplicates; every id belongs to a chosen service; every chosen service has at least one; a service's "Not sure yet" cannot sit with its other types. Messages name the service (Appendix A).<br>• `budgetRange` and `timeline` become **required** (one of the enum values; "Not sure yet" and "Flexible / not sure" are values, so nobody has to guess). The columns stay nullable for Phase 18 rows.<br>• The messages move to a Zod-free module, `lib/validation/inquiry-messages.ts`, so the client can show the same text without loading Zod (D9). `toInquiryData` writes `projectTypes`. | One contract for client hints and server rules. Required with an out gives every new inquiry a complete scope without forcing a guess. | Owner answers B, G; Phase 17 D5, D7 |
| D4 | **Submit path.** `submitInquiryCore` keeps the Phase 18 order and results (D3, D4 there). `INQUIRY_FIELDS`, `InquiryFormValues` and `formValues` gain `projectTypes`, `budgetRange` and `timeline` (in step order), so an `invalid` result echoes them. The muted-service check is unchanged; a project type of a muted service is refused with it, because types must belong to a chosen service. | Small, tested change to a proven core. | Phase 18 D3, D4, D8 |
| D5 | **Steps** (owner answer C), each a section with an `h3` heading:<br>1. **Services** — the Phase 18 checkboxes (visible services only).<br>2. **Project type** — one `fieldset` per chosen service, `legend` = the service name, in the services' display order.<br>3. **Budget** — six radio buttons (`BudgetRange`), labels with an approximate USD hint (Appendix A).<br>4. **Timeline** — five radio buttons (`InquiryTimeline`).<br>5. **Your details** — name, email, phone, company, project details (Phase 18 fields).<br>6. **Check and send** — a summary list of every answer, each group with a **Change** button that returns to its step; then consent, the Turnstile widget and **Send inquiry**.<br>**Back** and **Continue** buttons on steps 2–5 (step 1 has Continue only; step 6 has Back and Send). After Change, Continue walks forward through the steps again with the answers kept. | The roadmap's order, plus a review so the visitor sees the whole scope before sending. Consent and the bot check sit where the inquiry is actually sent. | Roadmap Phase 19; owner answer C |
| D6 | **One `<form>`, every step in the DOM.** Steps other than the current one carry `hidden`, so all answers stay in the form and are posted together; leaving a step never discards input. Unticking a service **disables** its project-type inputs (kept, not posted) so ticking it again restores them. The form uses `noValidate`; each step is checked by D9 before Continue. | "Progress is kept if the visitor goes back a step" (roadmap) with no client store to keep in sync. Disabled inputs are not submitted, so a removed service's types never reach the server. | Roadmap Phase 19 |
| D7 | **Browser history** (owner answer D). Continue and Change call `history.pushState({ inquiryStep: n }, "")`, with no URL change and no new route; a `popstate` listener shows the step in the state. The in-form Back button calls `history.back()`, so both Backs behave the same. Answers are kept. After success, `popstate` no longer changes anything (the success panel stays). | Phone users reach for the back gesture; leaving `/contact` by accident would lose the inquiry. No URL change keeps `/contact` one static route (Phase 18 C2). | Owner answer D; Phase 18 C2 |
| D8 | **Progress and focus.** Above the steps, "Step *n* of 6" and an ordered list of step names, the current one marked `aria-current="step"`; the list is not interactive. On every step change, focus moves to the new step's heading (`tabIndex={-1}`), which reads e.g. "Step 3 of 6: What's your budget?". No animation between steps. | A screen-reader user hears where they are on every change; keyboard focus never lands on a hidden control. No motion keeps it fast and respects reduced motion by default. | Rule 10; mission principle 8 |
| D9 | **Step checks** (owner answer G): native constraints (`required`, `type="email"`, `minLength`/`maxLength`) read through the Constraint Validation API, plus small helpers for "at least one per group" and phone format, using the D3 messages. Continue on a step with errors shows that step's error summary (Phase 18 D9 style: focused, links to the fields) and stays. **No Zod on the client.** A server `invalid` result opens the **first step with an error**, with its summary; later steps show their server errors when reached, and an error clears once its step passes Continue. | Keeps `/contact`'s client bundle small (D14); the server still decides. | Owner answer G; Phase 18 D9 |
| D10 | **Turnstile** mounts when step 6 is first shown, so an interactive challenge is visible and the token is fresh; `refreshExpired` stays automatic. The honeypot and `elapsedMs` (hydration to submit) are unchanged. | A widget hidden in an earlier step could expire or need interaction no one can see. | Phase 18 D5, D7 |
| D11 | **Without JavaScript**, step 1 renders with a `<noscript>` note offering email and phone (Appendix A), since the bot check needs JavaScript anyway. Pending, success and the generic messages are as in Phase 18 (D9 there). `/contact` stays prerendered (`○`). | Honest about what works; no layout shift from hiding steps after hydration. | Phase 18 D9, C2 |
| D12 | **Copy** (Appendix A, B): new keys under `contact.form.*` for steps, navigation, budget and timeline labels, the review and project types. `notes.hint` changes, because budget and deadline now have their own steps. Error messages stay in `lib/validation/` (D3). | Every visible string is keyed (Phase 3 D8). | Phase 3 D8; *In-place CMS* 4 |
| D13 | **Tests.**<br>• **Unit** `content/project-types.test.ts`: ids unique, shaped `CATEGORY.TYPE`, every service has a list ending in `NOT_SURE`, every label key has a default.<br>• **Unit** `lib/validation/inquiry.test.ts`: each D3 project-type rule; budget and timeline required; `toInquiryData` writes `projectTypes`.<br>• **Unit** `submit-core.test.ts`: `invalid` echoes the new fields; a muted service's project type is refused; success saves the full scope.<br>• **DB** `submit.db.test.ts`: a **multi-service inquiry is saved with its full scope** (services, project types, budget, timeline); the migration adds the column with an empty default.<br>• **E2E** `e2e/inquiry.spec.ts`: **the stepper completed by keyboard only**, with two services; Continue blocked with a focused summary on each step; answers kept after in-form Back and **browser Back**; Change from the review; unticking a service drops its types from the review; a server-invalid submit opens the first step with an error. **On the Vercel preview** (`preview-e2e`): a multi-service submission shows the success panel.<br>• **E2E** `a11y.spec.ts`: zero axe violations on every step at 360 and 1440 px. | Proves "Done when": a multi-service inquiry is saved with its full scope, and the keyboard-only Playwright run completes the stepper. | Roadmap Phase 19 "Done when" |
| D14 | **Performance budget** (owner answer I): the stepper adds **at most 15 kB gzipped** of client JavaScript to `/contact` over Phase 18 (sum of the gzipped JS files `contact.html` loads, before and after, recorded in `implementation.md`), and the Lighthouse job stays at or above its threshold on `/contact`. | Most visitors are on phones over mobile data (mission). | Owner answer I; mission principle 2 |

## Constraints

- **C1 — No new library.** No form, state or stepper library; no Zod on the client.
- **C2 — Static.** `/contact` stays prerendered (`○`) with the switch on and off; no new route, no URL change per step.
- **C3 — One additive migration** (D2); no other schema change. It must be safe on production, where `migrate-production` applies it before the build.
- **C4 — Existing suites hold.** Existing tests change only where the form now has steps and the schema's required fields.
- **C5 — Rate-limit budget in tests.** `preview-e2e` still submits at most two inquiries per run (Phase 18 C8).
- **C6 — Honest claims.** No prices, packages or delivery times are promised; the USD amounts are marked approximate.
- **C7 — Switch unchanged.** Production keeps `INQUIRY_FORM_ENABLED` unset; the release of this phase changes nothing a production visitor sees except the migration.

## Owner answers

Given 2026-10-20:

- **A. Packages:** project types per service, no prices; the agent drafts the lists (Appendix B) for approval.
- **B. Budget and timeline:** required, with "Not sure yet" and "Flexible / not sure" as answers.
- **C. Review step:** yes, a "Check and send" step with Change links; consent, Turnstile and Send there.
- **D. Browser Back:** steps back, with answers kept.
- **E. Storage:** `projectTypes String[]` with the ids in typed config.
- **F. Per service:** several types, at least one per chosen service, "Not sure yet" exclusive.
- **G. Step checks:** native constraints plus small helpers; no Zod on the client.
- **H. Screen reader:** the agent checks the preview with NVDA and records what is announced; the owner does the usual phone walk-through.
- **I. Performance:** Lighthouse holds on `/contact`, and the stepper adds at most 15 kB gzipped of client JS.
- **J. USD hints:** the official exchange rate with a 10% markup (Appendix A).

---

## Appendix A — Stepper copy (`contact.form.*`, draft for approval)

Phase 18 keys not listed here are unchanged. `{n}`, `{total}`, `{step}`, `{service}` and `{email}` are filled in at render time.

| Key | Text |
| --- | --- |
| `progress` | Step {n} of {total} |
| `stepHeading` | Step {n} of {total}: {step} |
| `steps.services` | What do you need? |
| `steps.types` | What kind of project? |
| `steps.budget` | What's your budget? |
| `steps.timeline` | When do you need it? |
| `steps.details` | Your details |
| `steps.review` | Check and send |
| `types.hint` | Choose all that apply for each service, or "Not sure yet". |
| `budget.legend` | Budget range * |
| `budget.hint` | A rough range helps us suggest the right approach. Amounts are in naira; dollar amounts are approximate. |
| `budget.under500k` | Under ₦500,000 (about $340) |
| `budget.from500kTo1500k` | ₦500,000 – ₦1.5 million (about $340 – $1,000) |
| `budget.from1500kTo5m` | ₦1.5 million – ₦5 million (about $1,000 – $3,400) |
| `budget.from5mTo15m` | ₦5 million – ₦15 million (about $3,400 – $10,200) |
| `budget.over15m` | Over ₦15 million (over about $10,200) |
| `budget.notSure` | Not sure yet |
| `timeline.legend` | Timeline * |
| `timeline.asap` | As soon as possible (within 2 weeks) |
| `timeline.within1Month` | Within a month |
| `timeline.oneToThreeMonths` | In 1–3 months |
| `timeline.overThreeMonths` | In more than 3 months |
| `timeline.flexible` | Flexible / not sure |
| `notes.hint` *(changed)* | What you need, who it's for, and anything else we should know. |
| `review.intro` | Check your answers before you send them. |
| `review.services` | Services |
| `review.types` | Project type |
| `review.budget` | Budget |
| `review.timeline` | Timeline |
| `review.details` | Your details |
| `review.change` | Change |
| `review.changeLabel` | Change {step} (`{step}` is the group's label, e.g. "Change Budget") |
| `next` | Continue |
| `back` | Back |
| `noscript` | This form needs JavaScript. You can still reach us by email at {email} or call one of the numbers on this page. |

**USD hints** (owner, 2026-10-20): the official rate plus a **10% markup**. The official rate is the CBN's NFEM closing rate, ₦1,332.26 per dollar on 16 October 2026, so the hints use ₦1,465.49 per dollar (1,332.26 × 1.1). They are rounded (to the nearest $10 under $1,000 and the nearest $100 above) and marked "about". The labels are block keys, so the hints can be recalculated the same way when the rate moves, in code until Phase 27 and in place after it.

**New validation messages** (`lib/validation/inquiry-messages.ts`, not block keys, as Phase 17 D5):

| Rule | Message |
| --- | --- |
| No type for a chosen service | Choose at least one kind of project for {service}. |
| "Not sure yet" with other types | For {service}, choose "Not sure yet" or the kinds that apply, not both. |
| Unknown type, or one for a service not chosen | Choose project types from the list. |
| No budget | Choose a budget range, or "Not sure yet". |
| No timeline | Choose a timeline, or "Flexible / not sure". |

## Appendix B — Project types (`contact.form.types.*`, draft for approval)

| Service | Id (`CATEGORY.TYPE`) | Label |
| --- | --- | --- |
| Photography | `PHOTOGRAPHY.EVENT` | Event coverage |
| | `PHOTOGRAPHY.PRODUCT` | Product photography |
| | `PHOTOGRAPHY.PORTRAIT` | Portraits and headshots |
| | `PHOTOGRAPHY.BRAND` | Brand and corporate shoot |
| | `PHOTOGRAPHY.NOT_SURE` | Not sure yet |
| Videography | `VIDEOGRAPHY.PROMO` | Promotional video or advert |
| | `VIDEOGRAPHY.EVENT` | Event coverage |
| | `VIDEOGRAPHY.INTERVIEW` | Interviews and testimonials |
| | `VIDEOGRAPHY.SOCIAL` | Short clips for social media |
| | `VIDEOGRAPHY.NOT_SURE` | Not sure yet |
| Digital Marketing | `DIGITAL_MARKETING.LAUNCH` | A campaign for a launch or event |
| | `DIGITAL_MARKETING.ADS` | Ongoing paid ads (Google, Meta) |
| | `DIGITAL_MARKETING.AUDIT` | An audit and marketing plan |
| | `DIGITAL_MARKETING.NOT_SURE` | Not sure yet |
| Social Media Marketing | `SOCIAL_MEDIA.MANAGEMENT` | Ongoing account management |
| | `SOCIAL_MEDIA.CONTENT` | Content creation only |
| | `SOCIAL_MEDIA.CAMPAIGN` | A campaign for a launch or event |
| | `SOCIAL_MEDIA.NOT_SURE` | Not sure yet |
| Online Presence Management | `ONLINE_PRESENCE.SETUP` | Setting up profiles and listings |
| | `ONLINE_PRESENCE.UPKEEP` | Ongoing upkeep and review replies |
| | `ONLINE_PRESENCE.RECOVERY` | Recovering or securing an account |
| | `ONLINE_PRESENCE.NOT_SURE` | Not sure yet |
| Web & App Development | `WEB_APP.WEBSITE` | A website |
| | `WEB_APP.WEB_APP` | A web app |
| | `WEB_APP.SHOP` | An online shop |
| | `WEB_APP.IMPROVE` | Improving an existing site or app |
| | `WEB_APP.NOT_SURE` | Not sure yet |

Two labels repeat across services ("Event coverage", "A campaign for a launch or event"). They stay as they are, because the stepper and review group types under their service. **Anywhere a type is shown outside its service group** (the Phase 20 emails, the Phase 32 inbox, any export), it is shown with its service, e.g. "Photography: Event coverage" (owner, 2026-10-20). `projectTypeLabel(id)` in `lib/content/project-types.ts` returns both parts for that.

Block keys use the service's camelCase `id` and a camelCase type, e.g. `contact.form.types.webApp.notSure`, because the key pattern bans `_` (*In-place CMS* 4).
