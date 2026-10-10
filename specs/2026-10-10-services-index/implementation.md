# Implementation log — Phase 4 services index

## Progress

- **2026-10-10** — Kickoff.
  - Branch `feature/phase-04-services-index` created from `develop` at `bfc7c56` (Phases 2, 3 and the favicon merged).
  - No owner copy was supplied for the page, so the heading, intro and meta description are proposed as sample copy for review on the preview (D2).
  - Spec folder written. The constitution amendment is the README tree comment (D7); the roadmap row needs no change.
- **2026-10-10** — Plan groups 1–4 built.
  - Copy: 3 new **S** keys in `content/defaults.ts`; the "ported vs. new copy" unit test lists them.
  - Components: `ButtonLink` and `Cta` moved to `components/shared/`, and `StepList` extracted from `ProcessStrip` (D4). The homepage renders as before; its e2e suite passes unchanged in what it asserts.
  - Page: `app/(public)/services/page.tsx` and `components/services/pillar-section.tsx`, all Server Components (C4). Title `Services | RedHat Media` (D3).
  - Tests: `e2e/keyed-text.ts` (shared), `e2e/services.spec.ts` with 7 tests, and the shell layout and contrast checks now loop over `/` and `/services` (D5, D6).
  - Local checks all pass:
    - frozen install, typecheck, lint and format;
    - `pnpm test`: 198 tests;
    - build: `○ /` and `○ /services` (C2);
    - `pnpm test:e2e`: 34 tests: 22 shell (11 per route), 5 homepage and 7 services (C3);
    - audit: no known vulnerabilities.
  - Negative tests, run together as one uncommitted change set against a single build, then reverted with reverse edits:
    - **Adding a service:** a seventh service, `NEGTEST Drone Footage` in Production (a new category, a config entry and two default keys, no page code), appeared in the built `services.html` with `href="/services/negtest-drone"`.
    - **Muting:** Digital Marketing (one of three Growth services) and Web & App Development (the only Build service) were muted. The built page had no `>Digital Marketing<`, no `>Web &amp; App Development<`, no `>Build<` section and no `>Spec<` step, while Growth kept its other two services.
    - With those changes, `e2e/services.spec.ts` passed 6 of 7: every config-derived check followed the new config (D5).
    - **Hard-coded text:** the 7th test, the keyed-text check, failed with exactly `["NEGTEST hard-coded line"]`, a literal added to the page.
    - **Raw list:** `import { services } from "@/content/services"` in the page failed lint (`no-restricted-imports`).
    - After the revert, `content/services.ts` showed no diff and no `NEGTEST` string remained.
- **2026-10-10** — PR #7 opened (`e125396`). CI is green: `ci` (including Playwright e2e and the audit), `gitleaks`, `preview-headers` and Vercel (preview Ready).
  - Owner preview check ("All's good"): the layout passes at phone and desktop widths.
  - All three **S** strings are accepted as-is (D2).
  - Every `validation.md` box is ticked.

## Deviations from plan

| Item | Planned | Actual | Reason |
| --- | --- | --- | --- |
| Negative tests | Separate runs | One combined change set and build | Each guard checks a different string or section, so one build shows all of them without masking; it saved three build cycles. |

## Issues and fixes

- **e2e `page.goto` timeouts under load.** Two local runs after the negative tests hit 9+ `page.goto` timeouts and no assertion failures. A manually started `pnpm start` served `/` and `/services` in about 30ms, so the app was fine. CPU was at 77% from other desktop apps (an Android emulator and media playback). A re-run with `--workers=2` passed 34/34 in 1.1 minutes. No code change was needed. This matches the Phase 3 note.

## Carried forward

- The `/services/[slug]` links 404 until Phase 5, as the homepage links already do.
