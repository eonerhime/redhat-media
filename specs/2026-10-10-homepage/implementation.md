# Implementation log — Phase 3 homepage

## Progress

- **2026-10-10** — Kickoff.
  - Branch `feature/phase-03-homepage` created from `develop` at `d70c384` (Phase 2 merged).
  - The owner had no pillar lines yet and asked for samples. They then said to use cards and to start Phase 3 with the samples (D1, D2). Other missing copy uses samples too: the featured-work text, the CTA and the Growth strip.
  - Open question 11 (proof points) is unanswered, so the page shows none (D6).
  - Spec folder written. The constitution was amended first: `roadmap.md` (Phase 3 row, open question 11), `tech-stack.md` (*Architectural rules* 3) and the README tree comment.
- **2026-10-10** — Plan groups 2–4 built.
  - Copy and config: 19 new keys in `content/defaults.ts`. Each pillar now has a `summaryKey` and `stepKeys`.
  - Page: `components/home/` (`button-link`, `hero`, `pillar-cards`, `featured-work`, `process-strip`, `cta`) and `app/(public)/page.tsx`, which sets the description from `home.meta.description`. All of them are Server Components (C4).
  - Guards: `no-restricted-imports` in `eslint.config.mjs`, and `e2e/home.spec.ts` with 5 tests.
  - Local checks all pass:
    - frozen install, typecheck, lint and format;
    - `pnpm test`: 190 tests;
    - build: `○ /` is still static (C2);
    - `pnpm test:e2e`: 18 tests, the 13 from Phase 1 plus 5 for the homepage (C3);
    - audit: no known vulnerabilities.
  - Negative tests, each reverted with a reverse edit:
    - **Hard-coded text:** a literal `<p>Call us today</p>` in `cta.tsx` failed the keyed-text check, which received `["Call us today"]`.
    - **Raw list:** `import { services } from "@/content/services"` in `page.tsx` failed lint (`no-restricted-imports`). `import type { Service }` was still allowed.
    - **Defaults:** `import { defaults } from "../../content/defaults"` in `cta.tsx` failed lint.
    - **Muting:** Photography and Videography were muted in the config, then the page was rebuilt. The built `index.html` then had no `>Production<`, `>Photography<`, `>Videography<` or `>Brief<`, while Growth and Build stayed. The pillar-card e2e test also failed, as expected, because it assumes the shipped config.
  - Screenshots at 1440px and 390px were checked by eye. Desktop shows three cards in a row, and phones show them stacked. Nothing overflows.
  - **Raised with the owner:** the Build card's sample summary nearly repeats the ported Web & App Development summary below it. An alternative line was offered.

- **2026-10-10** — PR #6 opened (`c0e3493`). CI is green: `ci` (including Playwright e2e and the audit), `gitleaks`, `preview-headers` and Vercel (preview Ready).
  - Owner preview check: the build looks right, and the responsive check passes.
  - All **S** sample copy is kept as-is, including the Build card line and the Growth strip "Audit → Plan → Grow". The owner notes that the CMS (Phase 27, as in `memories-r-us`) will let staff edit any copy later.
  - Every `validation.md` box is ticked.

## Deviations from plan

| Item | Planned | Actual | Reason |
| --- | --- | --- | --- |

## Issues and fixes

- **Slow lint and e2e timeouts under load.** Another project's ESLint was running on the same machine at the time.
  - One full lint run took 5m22s. A single file takes 7–9s.
  - One e2e run hit 4 `page.goto` timeouts in `beforeEach`, before any assertion ran.
  - A re-run once the machine was quiet passed 18/18 in 16s. No code change was needed.

## Carried forward

- **Phase 16 release gate (D5):** before the Milestone 1 release, the homepage featured-work section must show real items, link to a populated `/portfolio`, or be removed. The Phase 16 spec must include this check.
