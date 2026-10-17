# Plan — Phase 1 layout shell

Scope, decisions (D1–D13) and constraints (C1–C5) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 1. Constitution first

- [x] 1.1 `tech-stack.md` → *Design tokens*: replace the table and the contrast note with the D7 token set and measured ratios. Record D1 (CSS wordmark, generated favicon) in place of "the logo file is still to be supplied".
- [x] 1.2 `tech-stack.md` → *Supporting tools*: fonts row names Archivo + Inter (D2). E2E row: Playwright from Phase 1 (layout, contrast, reduced motion), smoke test from Phase 15, Chromium in the `ci` job (D4).
- [x] 1.3 `roadmap.md` → open question 1: mark answered (owner, 2026-10-09: no logo; CSS wordmark + generated favicon).

## 2. Tokens, fonts and base styles

- [x] 2.1 `app/globals.css` `@theme`: `--color-*: initial` (D6), the six D7 colour tokens, `--text-display-1` / `--text-display-2` fluid steps.
- [x] 2.2 `app/layout.tsx`: load Archivo and Inter via `next/font/google` with CSS variables. Map them to `--font-display` / `--font-sans` in `@theme inline`.
- [x] 2.3 `@layer base`: `color-scheme: dark`, body `ink`/`fg`, `:focus-visible` ring in `brand`, reduced-motion rule (D11).
- [x] 2.4 `container-page` utility (`@utility`), 16px side padding on phones.

## 3. Layout structure

- [x] 3.1 `lib/site.ts`: typed nav items and contact details (D3, D12).
- [x] 3.2 Move `app/page.tsx` to `app/(public)/page.tsx`. Add `app/(public)/layout.tsx` with skip link, header, `<main id="main">`, footer (D9).
- [x] 3.3 Root layout keeps only `<html lang="en">`, `<body>`, fonts and metadata.

## 4. Header

- [x] 4.1 `Wordmark` server component (RED / HAT / MEDIA, Archivo, ≥ 24px), linking to `/` with the accessible name "RedHat Media home".
- [x] 4.2 Desktop nav from `md`, with `aria-current="page"` on the active link (small client component using `usePathname`).
- [x] 4.3 `MobileNav` client component below `md` (D13): button with `aria-expanded` / `aria-controls`, panel, Escape closes and refocuses the button, link click closes. Open/close transition uses `motion-safe:`.

## 5. Footer, favicon, home placeholder

- [x] 5.1 Footer: brand name, `mailto:` email, `tel:` phone, "Lagos, Nigeria", "RC 1379619 · © {year} RedHat Media".
- [x] 5.2 `currentYear()` with `'use cache'` + `cacheLife("days")` (D10). Confirm `/` still prerenders (C5).
- [x] 5.3 `app/icon.tsx` (32×32) and `app/apple-icon.tsx` (180×180) via `next/og` `ImageResponse`. Delete `app/favicon.ico` (D1).
- [x] 5.4 `/` placeholder: `<h1>` "RedHat Media" in `display-1`.

## 6. Contrast check (Vitest)

- [x] 6.1 `lib/design/contrast.ts`: hex/rgb parsing, relative luminance, contrast ratio, and `requiredRatio({ fontSizePx, fontWeight })` (4.5, or 3 for large text).
- [x] 6.2 `lib/design/contrast.test.ts`: unit tests for the formula against known values (black/white 21, `#ed1c24`/`#1a1a1a` ≈ 3.97). Parses `--color-*` from `app/globals.css` and asserts each declared pairing (text pairs ≥ 4.5 or 3 as declared, UI pairs ≥ 3).

## 7. Playwright

- [x] 7.1 Add `@playwright/test@1.63.0` (C1). `playwright.config.ts`: `e2e/` dir, Chromium project, `webServer` = `pnpm start` on a fixed port with `reuseExistingServer: !process.env.CI`, optional `PW_CHANNEL` for local Edge (C2). Script `test:e2e`.
- [x] 7.2 `e2e/shell.spec.ts` at 360 / 768 / 1440: no horizontal overflow; wordmark, nav links and footer details present; correct nav mode per width.
- [x] 7.3 Mobile nav test at 360: open, links visible, Escape closes and focus returns to the button, link click closes.
- [x] 7.4 Rendered contrast test: every visible text element's computed colour vs. effective background meets `requiredRatio` (uses `lib/design/contrast.ts`). Unparseable colours fail the test.
- [x] 7.5 Reduced-motion test: with `reducedMotion: "reduce"` all computed transition/animation durations ≤ 0.01ms; without it, at least one non-zero transition exists.
- [x] 7.6 Vitest `include` stays `**/*.test.ts`, so Playwright `*.spec.ts` files are not picked up. Typecheck, lint and Prettier cover `e2e/`.

## 8. CI and docs

- [x] 8.1 `ci.yml` `ci` job: after `pnpm build`, `pnpm exec playwright install --with-deps chromium` then `pnpm test:e2e` (D4).
- [x] 8.2 `.gitignore` and `.prettierignore`: `test-results/`, `playwright-report/`, `blob-report/`.
- [x] 8.3 `CLAUDE.md` commands table and README §7: add `pnpm test:e2e`.

## 9. Verify and open the PR

- [x] 9.1 Work through every item in [`validation.md`](validation.md).
- [x] 9.2 **Ask the owner first:** push the branch and open the PR `feature/phase-01-layout-shell` → `develop`, linking this spec folder. (Owner approved the push; PR #3.)
