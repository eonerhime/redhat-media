# Implementation log — Phase 6 About page

## Progress

- **2026-10-11** — Kickoff.
  - Branch `feature/phase-06-about` created from `develop` at `698dadb` (Phase 5 merged).
  - Owner answers:
    - A founding year and history can be shown. The founder is Ebi Inala, Founder, Managing Director and CEO (D2). The year is still to be supplied.
    - Use sample copy, because the company will most likely edit it (D3).
    - On a muted Build pillar the owner asked for advice. The recommendation, hide the SDD section along with the Build card, is recorded as D7.
  - Spec folder written. No constitution file changes are needed.
- **2026-10-11** — Spec approved.
  - Owner: the founding year is **1999**. Invent the history, because the company will edit it. The owner will go through all the text on the preview and edit where needed. D7 is adopted as recommended.
  - Owner asked for the menu to stay visible on scroll. This is added as a shell amendment (D10, Phase 1 D14).
- **2026-10-11** — Build (plan groups 1–3a).
  - `roleKey` on all three pillars; 21 new defaults; unit tests updated (413 pass).
  - `app/(public)/about/page.tsx`: header, story with facts list, one-team band, pillar cards, SDD band (Build visible only) and CTA. `/about` is `○`; `/`, `/services` and the six service paths are unchanged (`◐` is the Phase 5 fallback shell).
  - Sticky header: `sticky top-0 z-40 bg-ink` on `SiteHeader`, `scroll-padding-top: 6rem` on `html`.
  - `e2e/about.spec.ts` (9 tests). `e2e/shell.spec.ts` adds `/about`, a scroll check per route and width, and a mobile-menu-after-scroll check. `e2e/keyed-text.ts` takes an optional site-values list.
  - Validation: format, typecheck, lint, unit tests, build, e2e (189/189 with `--workers=1`), audit and frozen install all pass.
  - Negative tests, each reverted by a reverse edit: a raw `services` import fails lint; a missing `roleKey` fails typecheck; a hard-coded string fails the keyed-text check; removing `sticky` fails all 28 per-route scroll checks and the mobile one.
  - Muted pillar: with `WEB_APP` muted, `/about` has no Build card, no SDD section and no web-app link, the Production and Growth cards remain, and `about.spec.ts` and `services.spec.ts` pass (16/16). Reverted.

## Deviations

None. The pillar cards' step lists are `text-xl` (see Issues); the spec did not fix a size.

## Issues and fixes

- **Step arrows failed contrast at 18px.** The first e2e run had the pillar cards' `StepList` at `text-lg`. The brand-red `→` (3.97:1) passes only as large text, which at weight 800 starts at 18.66px (14pt bold), so the shell contrast check failed on `/about` at every width. Fixed with `text-xl` (20px), as the homepage and services index already use.
- **Step assertions included the arrow.** `toHaveText` on the step items saw `→Shoot`. Switched to `toContainText` per step, the pattern in `services.spec.ts`.
- **`page.goto` timeouts under load.** Full runs with the default workers hit timeouts on the first navigation of each file (25 in one run, 2–4 in others), with no assertion failures. Those files pass in isolation, and the full suite passes 189/189 with `--workers=1`. This repeats the Phase 3/4 note; no code change was needed.
