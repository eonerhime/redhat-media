# Validation — Phase 1 layout shell

## Roadmap success check ("Done when", verbatim)

> The shell renders correctly at 360px, 768px and 1440px. An automated contrast check passes every token pairing used, and `prefers-reduced-motion` disables motion.

- [ ] The shell renders correctly at 360px, 768px and 1440px (Playwright layout tests green at all three widths, and the owner's check on the preview below)
- [ ] An automated contrast check passes every token pairing used (Vitest pairing test and Playwright rendered-contrast test both green)
- [ ] `prefers-reduced-motion` disables motion (Playwright reduced-motion test green, including the non-vacuous control)

## Local commands

- [ ] `pnpm install --frozen-lockfile` succeeds
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format:check` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes, and its route table shows `/` prerendered (C5)
- [ ] `pnpm test:e2e` passes (record whether bundled Chromium or Edge was used locally, C2)
- [ ] `pnpm audit --prod --audit-level high` reports no high or critical findings

## Negative tests (each guard must bite)

Run each as an uncommitted change, then revert.

- [ ] **Token contrast:** changing `--color-muted` to `#666666` fails the Vitest pairing test and the Playwright rendered-contrast test
- [ ] **Default palette removed:** a `text-gray-400` class produces no colour rule in the built CSS (D6)
- [ ] **Overflow:** a `w-[500px]` element in the shell fails the 360px no-overflow test
- [ ] **Reduced motion:** removing the global reduced-motion rule fails the reduced-motion test
- [ ] **Mobile nav:** removing the Escape handler fails the mobile nav test

## Preview manual check (owner)

- [ ] The Vercel preview renders the shell at 360px, 768px and 1440px (DevTools device mode), with nothing clipped or overlapping
- [ ] On a real phone, the menu opens and closes, and the email and phone links open the mail and dialer apps
- [ ] Keyboard only: the skip link appears on the first Tab, the focus ring is visible on every link and button, and Escape closes the mobile menu
- [ ] The favicon shows "RH" in the browser tab
- [ ] The DevTools console shows no errors. The only CSP message is the known `upgrade-insecure-requests` report-only notice (Phase 0 log). Any other report is noted in `implementation.md`.

## CI

- [ ] CI is green on the PR (`ci` including the Playwright step, `gitleaks`, `preview-headers`, Vercel)
- [ ] The `preview-headers` job still reports `ok` for all 7 headers (no CSP or header change, C3)

## Spec hygiene

- [ ] `tech-stack.md` and `roadmap.md` amendments (plan group 1) are in the same PR
- [ ] Every `plan.md` box is ticked, and `implementation.md` records any deviations
