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
