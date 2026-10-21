# Implementation log — Phase 19 Scope stepper

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

## Progress

- **2026-10-20** — Branch `feature/phase-19-scope-stepper` created from `develop` at `dd4a340`. Owner answers A–I given; spec, plan and validation drafted for approval.
- **2026-10-20** — Owner answer J: the USD hints use the official rate plus 10%. CBN NFEM closing rate ₦1,332.26/$ on 16 October 2026 (the last business day before the change; it agrees with monierate.com and the withinnigeria.com report of 20 October), so ₦1,465.49/$. Appendix A's budget labels recalculated.
- **2026-10-20** — Owner approved the spec, Appendices A and B, with two review notes applied: the `noscript` copy now reads "…or call one of the numbers on this page", and a project type shown outside its service group (emails, inbox, exports) carries its service name.
- **2026-10-20** — Plan 0.1–0.3: roadmap Phase 19 row (project types, review step) and open question 7 answered; tech-stack *Schema decisions* (`projectTypes` row; budget and timeline required by the schema from Phase 19); README §5 `Inquiry` gains `projectTypes String[]`.
- **2026-10-20** — Plan 1.1, **baseline** (D14): with `INQUIRY_FORM_ENABLED=1` and the Turnstile test keys, `next build` on `66b6d51` (Phase 18 code). `.next/server/app/contact.html` loads **12 JS files, 194,278 B gzipped** (189.7 kB; each file gzipped at level 9 and summed).
- **2026-10-20** — Plan 2.2: `projectTypes String[] @default([])`; migration `20261020120000_inquiry_project_types` adds `TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`. Prisma generates the column without `NOT NULL`, but `prisma migrate diff --from-config-datasource --to-schema --exit-code` reports no difference with it, so D2 stands as written. Applied to the local test Postgres (`rhm-pg`) and to Neon `dev` (`migrate deploy`, the dev-only local flow). `lib/db/inquiry-project-types.db.test.ts`: a row saved without the column reads back `[]`, NULL is refused, `rhm_readonly` is still denied.
- **2026-10-20** — PR #41 (expand first: spec folder, constitution, schema, migration) opened into `develop`. `ci`, `db`, `gitleaks`, `preview-headers`, `lighthouse` and Vercel are green. `preview-e2e` fails exactly one test, the saved keyboard submission: the preview's Prisma client, generated from the new schema, names `projectTypes` in its INSERT before Neon `preview` has the column. That is the Phase 12 lesson again; the failure is expected and documented on the PR.
- **2026-10-20** — Plan 2.1, 2.3–2.5 (data and validation):
  - `content/project-types.ts`: Appendix B ids and keys, `isProjectTypeId`, `categoryOf`, `isNotSure`; `lib/content/project-types.ts`: `projectTypeLabel`.
  - `lib/validation/inquiry-messages.ts` (every message, Zod-free), `phone.ts` (`toE164`, moved, re-exported) and `scope.ts` (`projectTypeErrors`, the D1/D3 rules shared by the schema and the stepper).
  - `inquiryInputSchema`: `projectTypes` checked by a `superRefine` with `when`, so it runs whenever services and types parse, whatever else is wrong; budget and timeline required, with a missing and an unknown message each; `toInquiryData` writes `projectTypes`.
  - `INQUIRY_FIELDS`, `InquiryFormValues` and `formValues` in step order.
  - Tests: `project-types.test.ts`, `inquiry.test.ts` (types rules, required scope), `submit-core.test.ts` (full scope saved, new fields echoed, a muted service's types refused, a type of an unchosen service refused), `submit.db.test.ts` and `inquiry.db.test.ts` (multi-service inquiry saved with its full scope).
- **2026-10-20** — Plan 3.1–3.7 (stepper and copy):
  - Appendix A and B keys in `content/defaults.ts`. `inquiry-copy.ts` passes the step, review and navigation copy, budget and timeline choices (`inquiryChoices`) and each service's types (`inquiryServiceOption`).
  - `inquiry-form.tsx` is the six-step form:
    - every step stays in the DOM and `hidden` (D6), and an unticked service's fieldset is disabled;
    - "Not sure yet" is exclusive (D1);
    - the progress line and list use `aria-current="step"`, and focus moves to the step heading (D8);
    - native and helper step checks show the server's messages in a focused summary, and a server `invalid` opens the first step with an error (D9);
    - `pushState` / `popstate`, with the in-form Back calling `history.back()` (D7);
    - Turnstile mounts on step 6 and there is a `<noscript>` note (D10, D11).
  - Build: `/contact` is `○` with the switch on and off. With it off, `contact.html` has no form.
- **2026-10-20** — Plan 4.1–4.4 (tests and budget):
  - `e2e/inquiry-steps.ts` (shared helpers).
  - `inquiry.spec.ts`:
    - step 1 layout;
    - Continue blocked with a focused summary on every step, with nothing posted;
    - "Not sure yet" exclusivity;
    - in-form Back, browser Back and Forward keep the answers, with no URL change;
    - review contents, Change, and an unticked service dropping its types (ticking it again restores them);
    - a server-invalid email opens step 5 and Back returns to the review;
    - the keyboard-only two-service run.
  - `a11y.spec.ts`: axe on every step, and on step 1 with errors, at 360 and 1440 px.
  - `csp.spec.ts`: no violation with the widget on step 6.
  - `contact.spec.ts` and `keyed-text.ts` now allow for the stepper: the filled-in step templates and the step-1 `h3` are expected, and `<noscript>` raw text is skipped.
  - Local run against `next start` (Edge, Neon `dev` migrated, `E2E_INQUIRY_SUBMIT=success`): inquiry, contact, CSP and smoke specs pass (50 passed, 1 skipped). The keyboard run saved `{PHOTOGRAPHY,VIDEOGRAPHY}`, `["PHOTOGRAPHY.EVENT","VIDEOGRAPHY.PROMO"]`, `FROM_500K_TO_1_5M` and `WITHIN_1_MONTH` to Neon `dev`. The stepper axe audits pass.
  - Screenshots of every step at 360 and 1440 px, checked by eye. Fixes from them: empty summary and feedback wrappers are `empty:hidden` (they added a blank gap), and the progress list is two columns below `sm`.
  - **JS budget (D14): 197,832 B gzipped over 12 files, +3,554 B (3.5 kB) over the 194,278 B baseline**, well inside the 15 kB budget.
- **2026-10-20** — Plan 5.1 gates, all through `node` (App Control):
  - typecheck and lint pass;
  - `format:check` flags only the untracked local `.claude/settings.local.json`;
  - `test`: 1448 passed;
  - `test:db` on the local Postgres 17: 34 passed;
  - `build`: `/contact` is `○` with the switch on and off.
  - Full `test:e2e --workers=1` against `next start` (Edge, switch on, `E2E_INQUIRY_SUBMIT=success`): 406 passed, 12 skipped, 2 failed. The failures were `shell.spec.ts` contrast on `/services/social-media-marketing` at 1440 px and the keyboard smoke test; neither touches the stepper. Both passed on re-run (5 passed): the 27.9-minute run shared the machine with an NVDA install.
- **2026-10-20** — PR #42 (the stepper) opened into `develop`, on top of #41.
- **2026-10-20** — Plan 5.3 (NVDA), **not done; still open**:
  - NVDA 2026.2 installed (`winget install NVAccess.NVDA`). `nvda.exe` needs elevation, so it was started as `nvda_noUIAccess.exe` with speech logging.
  - A visible Edge window driven by Playwright never took the foreground. Windows' foreground lock kept another, already-open browser window active, and NVDA read that window instead. Raising the Edge window from a script failed too.
  - NVDA was stopped and its log deleted, because it held only that other window's content.
  - **Fallback evidence** (Playwright accessibility snapshot of the focused element, local `next start`):
    - Continue on an empty step 1 focuses the summary: "Please fix the following:", then the link "Choose at least one service." (`#inquiry-services`);
    - each step change focuses `heading "Step n of 6: …" [level=3]`;
    - Send focuses `heading "Thanks, we've received your inquiry"` inside a `status` with the body text;
    - browser Back after success leaves the panel.
  - The live NVDA pass needs a desktop with the test browser in front: with the owner present, or with no other window open.
- **2026-10-20** — PR #42 CI on `09c39b0`:
  - `ci` (run 39461191092; it includes the CI-mode keyboard run, which shows the generic message with no database), `db`, `gitleaks`, `preview-headers`, `lighthouse` (run 39461259836) and Vercel are green.
  - Preview (Ready): `redhat-media-git-feature-phase-19-scope-stepper-e1rhyme.vercel.app`.
  - `preview-e2e`: 109 passed, 3 skipped, **1 failed**, the saved keyboard submission. Neon `preview` has no `projectTypes` column until #41 merges. Every other stepper test passes on the deployed preview: the per-step axe audits, the step-6 CSP check, Back/Forward, Change and the server-invalid case.
  - **Next:** merge #41; `migrate-preview` on the `develop` push adds the column; merge `develop` into this branch (no tree change expected); re-run `preview-e2e` here; then the NVDA pass and the owner check (plan 5.3, 5.4).
- **2026-10-20** — #41 merged by the owner (`d148f96`). Develop run 39463830235 is green, and its `migrate-preview` applied `20261020120000_inquiry_project_types` to Neon `preview`. `develop` merged into this branch (`08e429f`, no tree change). #42 on `08e429f`: every check is green, including `preview-e2e` (run 39470971353: 110 passed, 3 skipped), where the keyboard-only two-service submission reached the success panel.
- **2026-10-20** — Plan 5.4, owner check on the preview from a phone:
  - **A first try** went through a Phase 18 (single-page) preview, so its "Tester" row has no scope.
  - **On the stepper preview** the row saved `services {SOCIAL_MEDIA,WEB_APP}`, `projectTypes ["SOCIAL_MEDIA.CONTENT","WEB_APP.WEBSITE","WEB_APP.WEB_APP"]`, `budgetRange FROM_5M_TO_15M` and `timeline ASAP` (read by the owner in the Neon console).
  - The owner did not try Change, unticking a service or editing answers. Those are covered by `inquiry.spec.ts`, which passes locally and in `preview-e2e`.
- **2026-10-20** — Plan 5.3, **NVDA pass** with the owner at the desk: NVDA 2026.2 (`nvda_noUIAccess.exe`, speech logged), Edge, local `next start` of this branch, driven by keyboard. Announced:
  - page load: "main landmark, Tell us about your project, region, Step 1 of 6: What do you need?, region, Continue, button";
  - blocked Continue: "Please fix the following:, list, Choose at least one service.";
  - each step change: "Step 2 of 6: What kind of project?, heading, level 3", and the same for steps 3 to 6;
  - a project-type group: "Photography, grouping, list with 5 items, Event coverage, check box, not checked";
  - a budget option: "₦500,000 – ₦1.5 million (about $340 – $1,000), radio button, checked, 2 of 6";
  - a field: "Phone or WhatsApp *, edit, required, Nigerian numbers like 0803 123 4567…" (the hint is read);
  - the review: "Change Budget, button";
  - after Send: "Thanks, we've received your inquiry, heading, level 3".
  - **Defect found and fixed:** untouched budget and timeline radios and the consent checkbox were announced "required, invalid entry", because native `required` makes an unchecked radio or checkbox `:invalid`, which Chromium exposes as invalid. They now use `aria-required` (the budget and timeline fieldsets are `role="radiogroup"`), and the D9 step checks enforce the answer as before. New test `inquiry.spec.ts` "no control is exposed as invalid before a step check fails" reads the accessibility tree on every step; before the fix it listed 6 budget radios, 5 timeline radios and the consent box. After the fix: inquiry, a11y, CSP, contact and smoke specs 92 passed, 1 skipped; unit tests pass; JS 197,848 B gzipped (+3.5 kB). NVDA's raw log was deleted (it also captured other windows).
- **2026-10-20** — #42 on `29463f2` (the NVDA fix): every check is green (`ci`, `db`, `gitleaks`, `preview-headers`, `preview-e2e`, `lighthouse`, Vercel). Plan 5.4 closed by the owner ("go ahead"):
  - The owner completed the stepper on a phone, and the row was confirmed on Neon `preview` (entry above).
  - The back gesture, Change and unticking a service were not tried on the phone. They are covered by `inquiry.spec.ts` (in-form Back, browser Back and Forward, Change, untick and re-tick), which passes locally and in `preview-e2e`.
  - Every `validation.md` box is ticked.

## Deviations from plan

- **Owner phone check (plan 5.4) without the back gesture:** the owner accepted the automated browser-Back coverage instead of testing the gesture on a phone.

- **The migration ships first, in its own PR** (as Phase 12 did with PR #16, `creditUrl`). `preview-e2e` on the feature PR saves an inquiry to Neon `preview`, which `migrate-preview` migrates only from a `develop` push, so the feature PR cannot pass until the column is there. The expand-first PR holds this spec folder, the constitution edits (plan 0.1–0.3), the schema, the migration and its DB test. It is safe on its own: Phase 18 code never writes the column, which defaults to an empty list.
- **`projectTypeLabel(id)`** lives in `lib/content/project-types.ts`, beside the other block readers, not in `content/project-types.ts`, so the config imports nothing at runtime. Spec, Appendix B updated.
- **The form submits through `startTransition(() => dispatch(formData))` from `onSubmit`**, not `<form action>`. With `action`, React resets an uncontrolled form after every action. In Phase 18 the echoed values put the input back after `invalid`, but a `rejected`, `error` or `rate_limited` answer cleared it. In a six-step form that would lose the whole scope, so answers now stay in place after any failed send (asserted in the CI-mode keyboard test). The `invalid` echo is still returned (D4) and tested, but the client no longer needs it.
- **`review.changeLabel` fills `{step}` with the review group's label** ("Change Budget"), not the step question ("Change What's your budget?"), which read badly. Spec, Appendix A updated.
- **A server `invalid` adds a history entry** for the step it opens, like every other step change, so the in-form and browser Back both return to the review (D7 kept: "both Backs behave the same").

## Issues and fixes

- NVDA announced untouched required radios and the consent checkbox as "invalid entry" (native `required`); fixed with `aria-required` (plan 5.3 entry).

- The React Compiler lint (`react-hooks/purity`) flagged `performance.now()` and `Math.random()` in event handlers and effects. The cause was an inline `onClick={() => show(index)}` inside a render helper, which the compiler read as a render-time call. The Change buttons now use one handler that reads `data-step`.
- Components declared inside `InquiryForm` would remount on every render and drop the uncontrolled answers, so the step section and summary are render helpers instead.
- The server result is synced into state during render ("adjusting state when a prop changes"). The effect only focuses, pushes history and resets Turnstile (`react-hooks/set-state-in-effect`).

## Amendment 2026-10-21: Back to review, and summary links keep the step

- **Owner request (production test, 2026-10-21):** after Change, Continue walked through every later step. Now a `fromReview` state, also stored in the history entry, renames Continue to **Back to review**. That button checks its step, then skips every later step that still passes its D9 check. It lands on the review, or on the first incomplete step, which opens without its errors.
- **Owner-found bug:** an error summary link (`href="#inquiry-…"`) is a fragment jump. It adds a history entry with no state, and `popstate` read that as step 1. Summary links now focus their field with `preventDefault`. `popstate` also ignores a state-less entry that has a hash, so the skip link (`#main`) no longer resets the stepper either. No link points into `/contact` with a hash (the JSON-LD `#business` is an id, not a link).
- The in-form Back keeps calling `history.back()` (D7). After Change it returns to the review, as browser Back does.
- Local e2e note: `$env:DATABASE_URL=''` deletes the variable in PowerShell, so `next start` reads `.env.local` and saves to the Neon `dev` branch (`ep-purple-mountain`). The keyboard test then sees success, not CI's generic message; it passes with `E2E_INQUIRY_SUBMIT=success`.
