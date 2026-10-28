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
- **2026-10-27** — PR #65 opened. `ci`, `db`, gitleaks, preview headers and Lighthouse passed. **preview-e2e failed** (run 40562331354, and again on a rerun) in three portfolio tests that this phase didn't touch: a second CreativeWork JSON-LD block on two detail pages, and two `portfolio-listing` elements on `/portfolio`. It reproduced locally with the CMS on and the Neon `dev` data (9 failures in `portfolio.spec.ts`). The cause and fix are under *Issues and fixes*. After the fix, a clean CMS-on build passes `portfolio-detail`, `portfolio`, `edit-mode` and `admin` twice over (172 passed, 24 skipped), and `pnpm test` passes 1683 tests.
- **2026-10-27** — Owner's preview check (on the first build, before the fix):
  1. Signed in, landed on `/` with "Editing: Off": confirmed.
  2. Toggles, stays On across pages and a reload: confirmed.
  3. New tab starts Off: the step wasn't clear; to be repeated.
  4. The `/api/cms/session` request: present.
  5. Signed out, no pill and no icon: confirmed. The owner asked for a way back to the website from the sign-in page after signing out (owner answer H, D12). Built: a "Back to the website" link in the `/admin` header bar.

  The check is repeated on the fixed preview before the owner boxes are ticked.

- **2026-10-27** — The fix commit (`03a6a74`) is green on every check. preview-e2e: 199 passed, 13 skipped. The owner re-checked the fixed preview: everything confirmed, and a new tab starts Off while the first stays On. The owner confirmed that `/api/cms/session` is requested; the e2e checks prove one request per navigation.
- **2026-10-27** — CI's reporter lists failures only, so the preview log couldn't show whether the inquiry-stepper overlap test had run. It counted the form's buttons straight after load, and on the preview the form streams in later, so it may have skipped. It now skips only when `INQUIRY_FORM_ENABLED` is off, and waits for the Continue button. The Phase 26 *Built* note is on the roadmap, and every validation box is ticked.
- **2026-10-27** — On `128dba8`, preview-e2e passed with 200 passed and 12 skipped: the stepper overlap test now runs on the preview (one more pass and one fewer skip than on `03a6a74`). Lighthouse failed once on the known `/portfolio/sportspred` flake (performance 0.84, budget 0.9) and passed on a rerun. The `ci` job (run 40569517830) was cancelled at GitHub's 6-hour job limit because "Install Playwright Chromium" hung; a rerun of the job passed every step.
- **2026-10-28** — The owner merged PR #65 into `develop` as `6c21844`. Develop run 40642592599 is green: `ci`, `db`, gitleaks, and `migrate-preview` with no pending migrations. Every plan box is ticked.
- **2026-10-28** — Close-out: the three "Install Playwright Chromium" steps (`ci.yml`, and both in `preview-headers.yml`) get `timeout-minutes: 10`. The step normally takes about 20 seconds, so a hang now fails in 10 minutes instead of holding the job for 6 hours.

## Deviations from plan

- **Plan 5.3:** `e2e/admin.spec.ts` needed no change. Its "a visitor asks no session" check and the full-flow `roleReads` check hold as written for the shared read.
- **C6, decided in the build:** at 360px, scrolled to the end, the pill covered the footer's registration line (screenshot, and the same check with the fix stripped out). `globals.css` now gives `body` `padding-bottom: 5rem` and `html` `scroll-padding-bottom: 6rem`, but only while the pill is on the page (`:has([data-edit-pill])`). The page's last lines can then scroll clear of it, and focus scrolling keeps a focused control above it (WCAG 2.2 *Focus Not Obscured*). Visitors' pages are unchanged. Two e2e checks cover it: the footer lines at the end of the page, and each footer link when focused. At 1440px nothing was covered. With the menu open at 360px, the pill covers no menu link.

## Issues and fixes

- **Duplicate streamed content when the CMS is on (D1 amended).** `EditModeProvider` passed a new React context value right after hydration (`useHydrated()` flipping, and an object created on every render). A context change above a Suspense boundary that is still streaming makes React give up hydrating it and client-render it instead. The streamed HTML then arrived into nothing and stayed in the page as a hidden copy outside `<main>`. That hit every visitor on a CMS-on deployment (preview), not only staff. The `ci` job builds with the CMS off, so it never saw it. **Fix:** the state moved to a module store read with `useSyncExternalStore`. Store updates re-render only the components that read it (the icon and the pill), so nothing propagates into the streaming boundaries. Because the store outlives a client navigation, sign-out resets it (`forgetEditState()`), and the provider resets it on mount when there is no sign-in hint. Lesson for Phases 27–31: never put changing state in a context above page content; read the store through `useEditMode()`.

- **A stale CSS cache in the local `.next`:** the first CMS-on build served CSS without the new `globals.css` rule, although Tailwind's own compiler keeps it (`@tailwindcss/node` `compile` + `optimize`, checked in a scratch script). After `rm -rf .next`, the rebuilt CSS had it. CI and Vercel build from a clean checkout. Locally, delete `.next` when a CSS change doesn't show up in a production build.
- The first footer check looked only at links, so it passed while the registration line (a `<p>`) was covered. It now checks every footer line.
