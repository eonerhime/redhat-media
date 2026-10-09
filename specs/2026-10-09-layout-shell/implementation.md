# Implementation log — Phase 1 layout shell

## Progress

- **2026-10-09** — Kickoff.
  - Branch `feature/phase-01-layout-shell` created from `develop` at `596a851`.
  - Owner answers:
    - Roadmap open question 1: there is no logo or favicon, so the CSS wordmark stays and the favicon is generated (D1).
    - Typefaces are Archivo and Inter (D2).
    - The nav is config-driven with all four links (D3).
    - Playwright comes in now (D4).
  - Contrast ratios computed with the WCAG 2.x formula. The results drive D7: `brand-deep` is `#d0181f`, and `muted` is restricted to `ink`.
  - Docs checked via ctx7:
    - `next/font` `variable` with Tailwind `@theme inline` (Next.js docs).
    - `new Date()` under `cacheComponents` needs `'use cache'` or `io()` (Next.js docs, D10).
    - Playwright `reducedMotion` and `webServer` options (Playwright docs).
  - npm on 2026-10-09: `@playwright/test` latest is 1.64.0 (published 2026-10-07), so it is pinned to 1.63.0 (C1).
  - Spec folder written. Owner approved it with "go ahead".
- **2026-10-09** — Plan groups 1–8 done locally (commit `8efe6f5`, plus fixes below).
  - Constitution first: `tech-stack.md` → *Design tokens* now holds the D7 table with measured ratios and the logo note (D1). The fonts and E2E rows are updated (D2, D4). Roadmap open question 1 is marked answered.
  - `app/globals.css`:
    - `@theme` with `--color-*: initial` and the six tokens;
    - fluid `display-1` / `display-2`;
    - `@theme inline` font mapping;
    - the `container-page` utility;
    - base styles: `color-scheme`, focus ring and the reduced-motion rule.
  - `app/(public)/layout.tsx` has the skip link, header, `<main id="main">` and footer. `app/page.tsx` moved into the group.
  - Components in `components/`:
    - `wordmark` and `site-header` (Server Components);
    - `nav-links` (client, for `aria-current`) and `mobile-nav` (client);
    - `site-footer` (async Server Component with the `'use cache'` year).
  - Icons are `app/icon.tsx` and `app/apple-icon.tsx`, sharing `lib/brand-icon.tsx`. The default `favicon.ico` is deleted.
  - `@playwright/test` 1.63.0 added (`pnpm add -D -E`). The install took about 7 minutes and showed the same ESLint 10 peer warnings as Phase 0 (`eslint-plugin-import`, `jsx-a11y`, `react`), none from Playwright. `pnpm exec playwright install chromium` succeeded, and **Device Guard did not block the bundled Chromium** (C2), so the Edge fallback was not needed.
- **Local results:**
  - `install --frozen-lockfile`, `typecheck`, `lint`, `format:check` and `test` (35/35) all pass.
  - `build` passes, with `/` static (`○`, revalidate 1d / expire 1w from the footer year's `cacheLife("days")`).
  - `test:e2e` passes 13/13, and `audit` finds no known vulnerabilities.
- **Negative tests:** all four probes went into one build. Each failed only its own tests (muted `#666666`, overflow, Escape handler and reduced-motion rule):
  - Contrast failed at all three widths, through the muted footer line.
  - Overflow failed at 360px only.
  - The Escape test failed.
  - The reduced-motion test failed, while its control still passed.
  - Vitest failed only the muted pairing.
  - The built CSS had `.w-\[500px\]` but no `gray-400` rule.

  The probes were then reverted.
- **Own visual check** (Playwright screenshots at 360 with the menu closed and open, and at 1440; not committed):
  - The wordmark, nav, display heading and footer render as intended.
  - The menu panel overlays the content under the header.
  - The footer stacks on phones and splits left/right on desktop.

## Deviations from plan

| Item | Planned | Actual | Reason |
| --- | --- | --- | --- |
| Contrast tests (plan 6.2) | One `contrast.test.ts` that also parses the CSS | `contrast.test.ts` (formula) plus `tokens.test.ts` (tokens read from `globals.css`, pairings from `lib/design/tokens.ts`) | Keeps the WCAG formula tests separate from the token contract. |
| Token copies | Tokens only in `@theme` (C4) | `lib/brand-icon.tsx` and `app/layout.tsx` (`viewport.themeColor`) repeat two hex values, each tagged `// --color-<name>`. A test in `tokens.test.ts` fails if a copy drifts from `globals.css`. | `ImageResponse` and the viewport meta cannot read CSS variables. The test keeps C4's intent (one source of truth). |
| `viewport` export | Not planned | `colorScheme: "dark"`, `themeColor` = `ink` | Mobile browser chrome matches the dark theme. |
| Apple touch icon | Same drawing as the favicon | Full-bleed square, no rounded corners. The 32px favicon keeps them. | iOS applies its own mask, so transparent rounded corners would show as black. |
| Favicon weight | "RH" in a heavy weight | Regular weight | `next/og`'s bundled font has no 900 weight. Loading Archivo into `ImageResponse` would add font fetching for a placeholder icon. Revisit when a real logo exists (D1). |
| Playwright `webServer` (plan 7.1) | `reuseExistingServer: !process.env.CI` on port 3100 | `reuseExistingServer: false` on port **3217** | See the issue below: port 3100 was taken by another local app, and reuse made the tests run against the wrong site. |
| Link-click test (plan 7.3) | Follow a nav link | A capture-phase `preventDefault` stops the navigation, and the test checks only that the panel closes | Nav targets 404 until Phases 4–13 (D3), and the 404 page has no shell to assert against. |

## Issues and fixes

- **The Playwright suite ran against another project.** During the final local gate, 4 tests failed: the wordmark link was missing and the "Main" nav had 7 links. Port 3100 was held by `next start -p 3100` from `C:\Users\emoon\projects\epenal` (started 23:23, outside this session), and `reuseExistingServer` silently reused it. That process was left alone. Fix: port 3217 and `reuseExistingServer: false`, so a busy port now fails loudly instead of testing the wrong app. After the fix, the suite passes 13/13 with `[WebServer] next start --port 3217`.
  - Earlier evidence is still valid. The first green run started its own server on 3100 before epenal's server appeared at 23:23. In the negative-test run, the wordmark and footer tests passed and the RHM-specific Escape test failed, which is impossible against epenal's site.
- **Token drift test regex:** the first version expected `"#hex",` and missed `"#hex";` in `brand-icon.tsx`, so it failed on clean code. The regex now accepts either. It was then probed: changing the `brand-deep` copy to `#d0181e` fails the test, and reverting passes 35/35.
- **Lost edit during a probe revert:** reverting the drift probe with `git checkout -- lib/brand-icon.tsx` also discarded the uncommitted Apple-icon radius change. It was re-applied, and later probes are reverted with a reverse edit instead.
