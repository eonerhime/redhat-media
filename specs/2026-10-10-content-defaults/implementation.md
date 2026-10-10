# Implementation log — Phase 2 content defaults

## Progress

- **2026-10-10** — Kickoff.
  - Branch `feature/phase-02-content-defaults` created from `develop` at `5ed916a`.
  - Owner answers:
    - Roadmap open question 6: keep six services, and drop `BRANDING` (D1).
    - New requirement: staff can **mute a service from the CMS**. Editors and admins can mute. A muted service is hidden everywhere and its page returns 404. The CMS toggle is built in Phase 31, with no renumbering (D7).
  - Constitution amended in this branch (plan group 1): `roadmap.md`, `tech-stack.md` and README.
  - Legacy copy read from `git show main:index.html` (5,406 bytes). Every user-visible string and the meta description are inventoried in `spec.md`.
  - Spec folder written. Awaiting owner approval before code.
- **2026-10-10** — Owner go-ahead (D9 confirmed). Plan groups 2–4 built:
  - `lib/content/keys.ts`, `content/defaults.ts` (20 keys: 17 ported, 3 pillar names) and `lib/content/block.ts`.
  - `content/services.ts` and `lib/content/services.ts`. The `lib/site.ts` header comment now points at D9.
  - Tests: `lib/content/block.test.ts` and `lib/content/services.test.ts`. `pnpm test` passes with 130 tests, 6 files.
  - Negative tests: each guard failed as intended, then was reverted with a reverse edit:
    - The `@ts-expect-error` key added to `defaults` gave `TS2578 Unused '@ts-expect-error' directive`.
    - `site.name` in `defaults` gave `TS2353 … '"site.name"' does not exist in type 'Record<`home.${string}` | …>'`.
    - `"What We Dp"` failed `home.services.heading equals the legacy string`.
    - `BRANDING` in the README enum failed `matches enum ServiceCategory in README §5`.
    - All six services set to `muted: true` failed `keeps at least one service visible`. The fixture-based muting tests also failed, as expected, because they assume the shipped config.
  - Verbatim check: a one-off Node script (not committed) read `git show main:index.html`, stripped the style, script and comments, split the text nodes and decoded the entities. Each string was then matched exactly against its destination. **Result: 27 strings, 0 missing.**
    - `<title>` → `lib/site.ts`.
    - Meta description and 16 body strings → `content/defaults.ts`.
    - RED / HAT / MEDIA → `components/wordmark.tsx`.
    - Footer brand, email, phone and location → `lib/site.ts`.
    - `RC 1379619 · ©` → `components/site-footer.tsx` with `lib/site.ts`.
  - Local commands (run by a Haiku subagent, then spot-checked):
    - `pnpm install --frozen-lockfile` passes, and the lockfile is unchanged (C1).
    - `pnpm build` passes. The route table is `○ /` (1d / 1w), `/_not-found`, `/apple-icon` and `/icon`, all static, as in Phase 1 (C2).
    - `pnpm test:e2e`: 13 passed, unchanged (C2).
    - `pnpm audit --prod --audit-level high`: no known vulnerabilities.
- **2026-10-10** — PR #4 opened (`8661c4f`). CI is green: `ci` (including Playwright e2e and the audit), `gitleaks`, `preview-headers` and Vercel.
  - Owner checks: the Vercel preview looks the same as Phase 1. The ported wording, the pillar names and the six slugs are accepted. The owner notes that the pillar names can still change if the need arises (a `content/defaults.ts` edit).
  - Every `validation.md` box is ticked.

## Deviations from plan

| Item | Planned | Actual | Reason |
| --- | --- | --- | --- |
| 3.1 | `ServiceCategory` as a TS union | The union is derived from an exported `serviceCategories` tuple | The README drift test (D8) and the "covers every category" test need the values at runtime. The type is unchanged. |
| 3.2 | `resolveVisibility`, `visibleServices`, `visiblePillars` | Also exports a pure `groupByPillar(visible)`, which `visiblePillars()` uses | The pillar-muting cases can then be tested with overrides and no module mocking. Two tests also exercise `visibleServices()` / `visiblePillars()` directly through `vi.doMock` of the config, which matches the roadmap "Done when" exactly. |
| 4.2 | Table of legacy strings | The table holds the strings **as written in the legacy HTML** (with `&amp;`), and the test decodes them | This pins the entity decoding as well as the text. |

## Issues and fixes
