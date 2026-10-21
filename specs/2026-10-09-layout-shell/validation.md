# Validation — Phase 1 layout shell

## Roadmap success check ("Done when", verbatim)

> The shell renders correctly at 360px, 768px and 1440px. An automated contrast check passes every token pairing used, and `prefers-reduced-motion` disables motion.

- [x] The shell renders correctly at 360px, 768px and 1440px (Playwright layout tests green at all three widths, and the owner's check on the preview below, 2026-10-09)
- [x] An automated contrast check passes every token pairing used (Vitest pairing test and Playwright rendered-contrast test both green, locally on 2026-10-09)
- [x] `prefers-reduced-motion` disables motion (Playwright reduced-motion test green, including the non-vacuous control, locally on 2026-10-09)

## Local commands

- [x] `pnpm install --frozen-lockfile` succeeds
- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] `pnpm format:check` passes
- [x] `pnpm test` passes (35/35)
- [x] `pnpm build` passes, and its route table shows `/` prerendered (C5): `○ /`, revalidate 1d from the footer year cache
- [x] `pnpm test:e2e` passes (13/13). Bundled Chromium worked locally; Device Guard did not block it (C2).
- [x] `pnpm audit --prod --audit-level high` reports no known vulnerabilities

## Negative tests (each guard must bite)

Run each as an uncommitted change, then revert.

- [x] **Token contrast:** changing `--color-muted` to `#666666` fails the Vitest pairing test and the Playwright rendered-contrast test (at all three widths)
- [x] **Default palette removed:** a `text-gray-400` class produces no colour rule in the built CSS (D6). The same build did emit `.w-[500px]`, so the grep was looking in the right file.
- [x] **Overflow:** a `w-[500px]` element in the shell fails the 360px no-overflow test (768px and 1440px still pass, as expected)
- [x] **Reduced motion:** removing the global reduced-motion rule fails the reduced-motion test (the control still passes)
- [x] **Mobile nav:** removing the Escape handler fails the mobile nav test
- [x] **Token copies (added):** changing the `--color-brand-deep` copy in `lib/brand-icon.tsx` fails the token drift test

## Preview manual check (owner)

- [x] The Vercel preview renders the shell at 360px, 768px and 1440px (DevTools device mode), with nothing clipped or overlapping (owner, 2026-10-09: pass)
- [x] On a real phone, the menu opens and closes, and the email and phone links open the mail and dialer apps (owner, 2026-10-09: pass)
- [x] Keyboard only: the skip link appears on the first Tab, the focus ring is visible on every link and button, and Escape closes the mobile menu (owner, 2026-10-09: pass)
- [x] The favicon shows "RH" in the browser tab (owner, 2026-10-09: pass)
- [x] The DevTools console shows no errors. The only CSP message is the known `upgrade-insecure-requests` report-only notice (Phase 0 log). Any other report is noted in `implementation.md`. (owner, 2026-10-09: pass)

## CI

- [x] CI is green on the PR (`ci` including the Playwright step, `gitleaks`, `preview-headers`, Vercel). PR #3, run 38000662883: Vitest 35/35, Playwright 13/13 on CI Chromium.
- [x] The `preview-headers` job still reports `ok` for all 7 headers (no CSP or header change, C3). Run 38000695372 passed.

## Spec hygiene

- [x] `tech-stack.md` and `roadmap.md` amendments (plan group 1) are in the same PR (commit `8efe6f5`)
- [x] Every `plan.md` box is ticked, and `implementation.md` records any deviations

## Amendment 2026-10-10: favicon from `MIRH.jpg`

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` pass
- [x] `pnpm build` passes, and the route table lists `/icon.png` and `/apple-icon.png` in place of `/icon` and `/apple-icon`
- [x] `pnpm test:e2e` passes
- [x] The built `/` head links `icon.png` (32×32, `image/png`) and `apple-icon.png` (180×180)
- [x] CI is green on the PR
- [x] Owner: the Vercel preview shows the red-hat favicon in the browser tab

## Amendment 2026-10-14: logo replaces the CSS wordmark

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` pass (679)
- [x] `pnpm build` passes, with the same route table as `develop`
- [x] `pnpm test:e2e` passes, including the logo checks (visible, not lazy, loaded) at 360, 768 and 1440px — 198/198 (`--workers=1`)
- [x] The header link "RedHat Media home" wraps an `<img>` served from `/_next/image` (`'self'`, so no CSP change) — `pnpm start`: 1x `w=128` and 2x `w=256` in the `srcset`, both 200 `image/webp` (4.9 KB, 9.6 KB), `loading="eager"`
- [x] The owner's source files (`public/RedHat.Media 2 Lines.jpg`, `public/RedHat.Media 2L Gmail Profile - png.png`) are not in the diff
- [x] CI is green on the PR — PR #13, run 38561892803 (`ci`, `db`, `gitleaks`), `preview-headers`, Vercel Ready
- [x] Owner: the Vercel preview shows the logo on the dark header at phone and desktop widths (owner, 2026-10-14: pass)

## Amendment 2026-10-16: About first in the nav

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` pass (922)
- [x] `pnpm test:e2e` shell tests pass: the nav reads About, Services, Portfolio, Contact at 360, 768 and 1440px (161/161, `--workers=1`)
- [x] The owner's source files in `public/` are not in the diff
- [x] CI is green on the PR — PR #20, run 38870942493 (`ci`, `db`, `gitleaks`), `preview-headers` and `preview-e2e` (run 38871037767), Vercel Ready
- [x] Owner: the Vercel preview shows About first in the header and the mobile menu (owner, 2026-10-16: confirmed)

## Amendment 2026-10-21: pointer cursor on buttons and choices

- [x] Every visible, enabled link, button, checkbox, radio and wrapping label shows the pointer on every route at 360 and 1440px, in the open mobile nav and on every inquiry step. The lightbox keeps `zoom-in` — `e2e/cursor.spec.ts`
- [x] Control: a planted button with the default cursor is reported — `cursor.spec.ts` › control
- [ ] CI is green on the PR
- [ ] Owner: on the preview, buttons and form choices show the hand cursor
