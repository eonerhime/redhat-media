# Phase 1 — Design tokens & layout shell

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 1, Phase 1
- **Branch:** `feature/phase-01-layout-shell` (from `develop`)
- **Started:** 2026-10-09

## What and why

Give every later page the same frame: brand colour tokens, typefaces, a type scale, a page container, the dark theme, and a header and footer that work from 360px phones to 1440px desktops. Phases 3–13 then only add page content, and they inherit accessible contrast and reduced-motion handling instead of each re-solving them (mission principles 2 and 8; `tech-stack.md` → *Architectural rules* 10).

`main` keeps serving the current static page. This branch merges into `develop` only.

## Constitution sections this phase relies on

- `mission.md` → *Guiding principles* 2 (the site is the proof), 4 (honest claims, placeholders clearly marked) and 8 (dark theme in the brand colours, restrained motion)
- `tech-stack.md` → *Core* (Tailwind CSS-first `@theme`), *Supporting tools* (fonts via `next/font`, Playwright), *Architectural rules* 1 (server-first) and 10 (accessibility), *Design tokens*
- `tech-stack.md` → *In-place CMS* → *How it works* 1 (`EditModeProvider` will mount in the `(public)` layout, see D9)
- `roadmap.md` → open question 1 (answered in D1)

## Scope

1. **Constitution updates first** (spec-driven rule). In `tech-stack.md`: the *Design tokens* table gets the full Phase 1 token set with measured contrast ratios (D7), the logo note records D1, the fonts row names Archivo and Inter (D2), and the E2E row moves Playwright forward to Phase 1 (D4). In `roadmap.md`: open question 1 is marked answered.
2. **Tokens** in the `app/globals.css` `@theme` block. Tailwind's default colour palette is removed (D6), and only these colours exist (D7):

   | Token | Value | Use |
   | --- | --- | --- |
   | `--color-brand` | `#ed1c24` | Wordmark "RED", large display accents, focus ring, accent rules |
   | `--color-brand-deep` | `#d0181f` | Primary button fills |
   | `--color-ink` | `#1a1a1a` | Page background (dark theme base) |
   | `--color-fg` | `#f5f5f5` | Body text, headings, button labels |
   | `--color-muted` | `#808285` | Wordmark "HAT", secondary text ≥ 16px, on `ink` only |
   | `--color-line` | `#2e2e2e` | Decorative dividers and borders only, never text or a component boundary that must be seen |

3. **Typefaces** via `next/font/google` (D2): **Archivo** for the wordmark and headings and **Inter** for body text. Both are variable fonts, with the `latin` subset and `display: "swap"`. Their CSS variables are mapped to `--font-display` and `--font-sans` in `@theme inline`.
4. **Type scale and container.** The body uses Tailwind's default `text-*` steps. Two fluid display steps (`--text-display-1`, `--text-display-2`, using `clamp()`) are added for page headings. A `container-page` utility sets the max width, centring and side padding (16px on phones, wider from `md`).
5. **Base styles** (`@layer base`): `color-scheme: dark`, `ink` background and `fg` text on `body`, a visible `:focus-visible` ring in `brand`, a "Skip to content" link that targets `<main id="main">`, and the global reduced-motion rule (D11).
6. **Layout structure** (D9). The root `app/layout.tsx` keeps `<html>`/`<body>`, the fonts and the site metadata. A new `app/(public)/layout.tsx` renders the header, `<main id="main">` and the footer. `app/page.tsx` moves to `app/(public)/page.tsx`.
7. **Header:**
   - The **CSS wordmark** from the current site: "RED" in `brand`, "HAT" in `muted`, "MEDIA" letter-spaced underneath in `fg`, set in Archivo at heavy weight. It links to `/` with the accessible name "RedHat Media home". It stays at least 24px tall so its brand red counts as large text (3.97:1).
   - **Navigation** from a typed list in `lib/site.ts`: Services, Portfolio, About and Contact (D3). The current page gets `aria-current="page"`.
   - From `md` (768px) up, the links sit inline. Below `md`, a menu button opens the mobile nav (D13).
8. **Footer:** "RedHat Media", the email `redhatmediang@gmail.com` (`mailto:`), the phone "0802 658 1200" (`tel:+2348026581200`), "Lagos, Nigeria", and "RC 1379619 · © {year} RedHat Media". The year comes from a cached function (D10). The strings live in `lib/site.ts` until Phase 2 (D12).
9. **Favicon** (D1). `app/icon.tsx` (32×32) and `app/apple-icon.tsx` (180×180) are drawn with `ImageResponse` from `next/og` (part of Next, so no new library): "RH" in `fg` on a `brand-deep` square. The default `app/favicon.ico` is deleted. **Amended 2026-10-10:** the icons are now static files cut from the owner's brand image (see D1).
10. **Home placeholder.** `/` renders inside the shell with an `<h1>` "RedHat Media" in the display style. Real homepage content arrives in Phase 3.
11. **Tests** (D4, D5, D11):
    - **Vitest**, `lib/design/contrast.ts` and its test. A WCAG 2.x contrast function. It reads the colour tokens from `app/globals.css` and checks each declared pairing against its required ratio: 4.5 for normal text, 3 for large text and UI parts.
    - **Playwright**, at 360, 768 and 1440px:
      - no horizontal overflow;
      - the wordmark, nav and footer content are present;
      - the right nav mode shows at each width;
      - mobile nav behaviour (open, Escape closes and returns focus, a link click closes it);
      - every visible text element meets its contrast ratio against its effective background;
      - with `reducedMotion: "reduce"`, every element's computed transition and animation durations are effectively zero. Without the emulation, at least one transition exists, so the test is not vacuous.
12. **CI.** The existing `ci` job installs Playwright's Chromium and runs `pnpm test:e2e` after `pnpm build` (D4).
13. **Docs.** Add `pnpm test:e2e` to the `CLAUDE.md` commands table and to README §7. Add Playwright's output folders to `.gitignore` and `.prettierignore`.

## Out of scope

- Copy, `content/defaults.ts` and the `block()` helper (Phase 2). Homepage content (Phase 3).
- The pages the nav links to (Phases 4–13). Their links return 404 on previews until then (D3).
- A light theme or theme toggle (D8). A logo image file (D1).
- OG images, `sitemap.ts` and JSON-LD (Phase 14).
- A full accessibility audit with axe and Lighthouse (Phase 15). Phase 1 checks contrast, focus visibility, reduced motion and nav keyboard behaviour only.
- Changes to the security headers or CSP. None are expected (C3). If one turns out to be needed, it goes in with its test and a `tech-stack.md` update (`CLAUDE.md`).

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **No logo file exists.** Keep the CSS wordmark from the current site. Generate the favicon and Apple touch icon with `next/og` `ImageResponse` ("RH", `fg` on `brand-deep`), and delete the default Next.js `favicon.ico`. A real logo can replace both later without layout changes. **Amended 2026-10-10:** the owner supplied `public/MIRH.jpg` (red-hat silhouette) for the favicon. `app/icon.png` (32×32) and `app/apple-icon.png` (180×180) are static PNGs cut from it with one square crop over the hat and head (`left 150, top 30, 540×540` of the 1000×1504 source), so `app/icon.tsx`, `app/apple-icon.tsx` and `lib/brand-icon.tsx` are removed. The header keeps the CSS wordmark. | Answers roadmap open question 1. `next/og` ships with Next, so no new library is needed. The amendment uses Next's file-based icon convention, which needs no code; the crop was rendered once with the `sharp` that Next already installs, and no dependency is added. The tight crop was chosen because the full figure is unreadable at 32px. | Owner, kickoff Q (open question 1); owner, 2026-10-10 (favicon from MIRH.jpg, crop A) |
| D2 | Typefaces **Archivo** (display: wordmark, headings) and **Inter** (body), both from `next/font/google`. | Archivo's heavy weights are closest to the current weight-900 wordmark. Inter is legible at small sizes on mobile. `next/font` self-hosts them at build time, so `font-src 'self'` still holds. | Owner, kickoff Q |
| D3 | The nav is **config-driven, with all four links** (Services, Portfolio, About, Contact) in `lib/site.ts`. They 404 on previews until each page lands. | The header is laid out and tested at its final width now. Later phases add pages without touching the header. `main` is unaffected until Phase 16. | Owner, kickoff Q |
| D4 | **Playwright is brought forward from Phase 15.** `@playwright/test` is pinned to 1.63.0 and runs Chromium only. It runs inside the existing **`ci`** job after `pnpm build`, against `pnpm start`. | The "Done when" checks (three widths, reduced motion, contrast in the rendered page) need a real browser. Running inside `ci` puts the result under the existing required check, so no ruleset change is needed. Playwright is already in `tech-stack.md`. | Owner, kickoff Q (Playwright now); job placement from kickoff analysis |
| D5 | **The contrast check has two layers.** (a) Vitest: tokens are parsed from `app/globals.css`, and every declared pairing is checked with the WCAG formula. (b) Playwright: every visible text element in the rendered shell is checked against its effective background, at all three widths. The formula lives in `lib/design/contrast.ts`, with no library. | (a) fails fast on a token change. (b) proves the check covers "every token pairing used", not just the declared list. The formula is about 15 lines, so no dependency is needed. | Kickoff analysis |
| D6 | **Tailwind's default colour palette is removed** (`--color-*: initial` in `@theme`), so only the D7 tokens produce colour utilities. | Every colour on the page is then a token the contrast check knows about. A stray `text-gray-400` simply has no effect. | Kickoff analysis |
| D7 | **Token set and measured ratios** (WCAG 2.x, computed 2026-10-09). The ratios are now measured, replacing the constitution's "about" figures:<br>• `fg` on `ink`: 15.96.<br>• `muted` on `ink`: 4.52, so AA, but `muted` is for ≥ 16px text on `ink` only. On a lighter surface such as `#242424` it would fall to 4.03.<br>• `brand` on `ink`: 3.97, so large text, focus ring and UI only.<br>• `fg` on `brand`: 4.02, which fails normal text, so button fills use `brand-deep`.<br>• `fg` on `brand-deep`: 5.03. `brand-deep` against `ink`: 3.18, so the button's edge also passes 3:1. | The tech-stack contrast note asked for "a darker red shade defined in `@theme`". `#d0181f` is the lightest red that passes for both text and UI boundaries. | Kickoff analysis |
| D8 | **Dark theme only.** `color-scheme: dark`, with no light theme and no toggle. | Mission principle 8 calls for a high-contrast dark theme. A second theme would double the contrast pairings for no stated need. | Mission principle 8 |
| D9 | **Route group `app/(public)/`.** Its layout holds the header, `<main>` and footer, and the root layout holds only the document, fonts and metadata. | `/cms` pages (Phase 24+) must not get the public shell. `tech-stack.md` already places `EditModeProvider` in the `(public)` layout. | `tech-stack.md` → *In-place CMS* 1 |
| D10 | The footer year comes from an async function marked `'use cache'` with `cacheLife("days")`. | With `cacheComponents: true`, a bare `new Date()` in a prerendered Server Component fails the build (Next.js docs via ctx7). A daily cache keeps the year correct after New Year without a redeploy. | Kickoff analysis (Next docs) |
| D11 | **Reduced motion:** a global `@media (prefers-reduced-motion: reduce)` rule in `@layer base` sets every animation and transition duration to `0.01ms` and `scroll-behavior` to `auto`. Components also use `motion-safe:` where it reads naturally. | The global rule also catches motion added in later phases. Playwright checks it from the computed styles. | Kickoff analysis |
| D12 | Footer and nav strings sit in `lib/site.ts` for Phase 1. Phase 2 moves the copy behind `block()` (the `footer.*` keys). | Phase 2 owns the content system, and Phase 1 should not pre-empt its key design. | Kickoff analysis |
| D13 | **Mobile nav (below 768px)** is a small client component:<br>• a menu button with `aria-expanded` and `aria-controls`;<br>• a panel listing the nav links;<br>• Escape closes it and returns focus to the button, and following a link closes it.<br>The panel's open and close transition is the shell's only motion. | It is keyboard- and screen-reader-friendly with no library. Everything else in the header and footer stays a Server Component (*Architectural rules* 1). | Kickoff analysis |

## Constraints

- **C1 — Versions** (checked against npm on 2026-10-09): `@playwright/test` **1.63.0**. 1.64.0 was published on 2026-10-07 and is too new to adopt. Other versions stay as pinned in Phase 0.
- **C2 — Device Guard.** The owner's machine blocked the pnpm 12.10.1 binary in Phase 0, so it may also block Playwright's downloaded Chromium. If so, local runs use the installed Edge (`channel: "msedge"` through an env switch in `playwright.config.ts`), and CI keeps bundled Chromium. The outcome is recorded in `implementation.md`.
- **C3 — Fonts need the network at build time only.** `next/font/google` downloads the font files during `pnpm build` (local, CI and Vercel) and serves them from the site. There is no runtime request to Google, so the CSP (`font-src 'self'`) is unchanged.
- **C4 — Tokens are defined once**, in the `@theme` block (`tech-stack.md` → *Core*, Styling). TypeScript tests read them from the CSS rather than keeping a second copy.
- **C5 — Static rendering.** `/` must still prerender (static shell) after the shell lands. `pnpm build` output is checked in validation.
