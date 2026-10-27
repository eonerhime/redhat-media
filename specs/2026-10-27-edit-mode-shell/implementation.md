# Implementation log — Phase 26 Edit-mode shell

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

## Progress

- **2026-10-27** — Branch `feature/phase-26-edit-mode-shell` created from `develop` at `cec80cd`. Before the interview, MRU's `edit-mode.tsx` and `edit-controls-pill.tsx` were read, along with our `StaffLink`, `staff-hint.ts`, `/api/cms/session` and `PublicShell`. Owner answers A–G given; spec, plan and validation written. Owner approved the build ("build it").
- **2026-10-27** — Built (plan 1–6):
  - Constitution: `tech-stack.md` *Architectural rules* 6, *In-place CMS* 1 and 2, and the E2E row; the `README.md` tree comment.
  - `components/cms/edit-storage.ts` (guarded `sessionStorage`, `canEdit`, `rememberRole`, `clearEditState`) with `edit-storage.test.ts`. `components/cms/edit-mode.tsx`: `EditModeProvider`, `useEditMode()` and the pill. `PublicShell` wraps the frame in the provider where `env.cms` is on. `StaffLink` reads the role from the context. `SignOutButton` clears the edit state. The pill text is in `cmsCopy.editMode`.
  - `e2e/edit-mode.spec.ts`, plus the spec added to preview-e2e's list in `preview-headers.yml`. `e2e/portfolio-expect.ts` exports `withBypass(page)`, so a second tab in a test gets the preview bypass too; the fixture uses it.
  - Local checks: typecheck, lint, format and `pnpm test` pass (51 files, 1683 tests).
    - `DATABASE_URL= next build` with the CMS off has a route table identical to `develop` run 40515668722. With the CMS on, every public route keeps its marker, and only `/admin`, `/admin/2fa/setup` and `/admin/panel` become `◐` because they read the session (C1).
    - e2e against `next start` in Edge with the CMS off (edit-mode, admin, shell, smoke and a11y specs, `--workers=1`): 233 passed, 40 skipped.
    - `edit-mode.spec.ts` with `E2E_CMS=on` against a CMS-on build: 18 passed, 2 skipped. The skips are the CMS-off case and the stepper case, because the inquiry form is off locally; preview runs it.

## Deviations from plan

- **Plan 5.3:** `e2e/admin.spec.ts` needed no change. Its "a visitor asks no session" check and the full-flow `roleReads` check hold as written for the shared read.
- **C6, decided in the build:** at 360px, scrolled to the end, the pill covered the footer's registration line (screenshot, and the same check with the fix stripped out). `globals.css` now gives `body` `padding-bottom: 5rem` and `html` `scroll-padding-bottom: 6rem`, but only while the pill is on the page (`:has([data-edit-pill])`). The page's last lines can then scroll clear of it, and focus scrolling keeps a focused control above it (WCAG 2.2 *Focus Not Obscured*). Visitors' pages are unchanged. Two e2e checks cover it: the footer lines at the end of the page, and each footer link when focused. At 1440px nothing was covered. With the menu open at 360px, the pill covers no menu link.

## Issues and fixes

- **A stale CSS cache in the local `.next`:** the first CMS-on build served CSS without the new `globals.css` rule, although Tailwind's own compiler keeps it (`@tailwindcss/node` `compile` + `optimize`, checked in a scratch script). After `rm -rf .next`, the rebuilt CSS had it. CI and Vercel build from a clean checkout. Locally, delete `.next` when a CSS change doesn't show up in a production build.
- The first footer check looked only at links, so it passed while the registration line (a `<p>`) was covered. It now checks every footer line.
