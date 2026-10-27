# Plan — Phase 26 Edit-mode shell

Scope, decisions (D1–D11) and constraints (C1–C6) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md). Steps marked **(owner)** are the owner's (C4).

## 1. Constitution

- [x] 1.1 `tech-stack.md`: *Architectural rules* 6, *In-place CMS* → *How it works* 1 and 2, and the E2E row (spec → *Constitution changes*).
- [x] 1.2 `README.md` tree comment for `(public)/`.

## 2. Provider

- [x] 2.1 `components/cms/edit-storage.ts`: guarded `sessionStorage` helpers for `rhm:role` and `rhm:editMode`, `clearEditState()`, and the pure `canEdit(role)` (D4, D6, D7).
- [x] 2.2 Unit tests `edit-storage.test.ts`: reads and writes, a throwing `Storage`, `canEdit` for every role and null, the toggle dropped below editor (D10).
- [x] 2.3 `components/cms/edit-mode.tsx`: `EditModeProvider` and `useEditMode()` with the visitor default (D1, D8). The hint-gated read after hydration and on each `usePathname()` change, stale responses ignored, a network failure keeping the role (D2, D3). The cached role and toggle read after hydration (D4, D6). The hint is cleared only when `authenticated` is false, and the toggle is dropped when there is no editor role (D2, D7).

## 3. One session read

- [x] 3.1 `PublicShell` wraps its content in `EditModeProvider` where `env.cms` is on (D1).
- [x] 3.2 `StaffLink` reads `role` from `useEditMode()` and drops its own fetch. `SiteHeader` keeps its `env.cms` condition (D2).
- [x] 3.3 `SignOutButton` also calls `clearEditState()` (D7).

## 4. Pill

- [x] 4.1 The pill in the provider: shown for `editor` and up, `aria-pressed`, the Off and On styles, safe-area offset, `print:hidden`, last in DOM order. Toggling closes any open popover (D5, D6, D8).
- [x] 4.2 Screenshots at 360px (nav closed and open, footer, the inquiry stepper) and at 1440px. Adjust and log if anything is covered (C6).

## 5. End-to-end tests

- [x] 5.1 `e2e/edit-mode.spec.ts` with the mocked-session cases, persistence, the new-context check, the re-read count, the dropped toggle, and the CMS-off case (D10).
- [x] 5.2 axe scan with the pill Off and On, and the pill reached by keyboard (D10).
- [x] 5.3 `e2e/admin.spec.ts`: update the icon's request checks for the shared read (D2). Visitors still make no request.
- [x] 5.4 Make sure preview-e2e runs the new spec (the workflow's spec list, if it has one).

## 6. Local checks

- [x] 6.1 `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test`.
- [x] 6.2 `pnpm build` with the CMS off and on. Compare the route table with `develop` run 40515668722 (C1).
- [x] 6.3 `pnpm test:e2e` locally: the CMS-off run (`--workers=1`), and `edit-mode.spec.ts` with `E2E_CMS=on` against a CMS-on build (Edge, `PW_CHANNEL=msedge`).

## 7. PR and close-out

- [x] 7.1 Commit, push, open the PR into `develop` (#65).
- [x] 7.1a preview-e2e failed on duplicate streamed content (D1 amended): move the state from React context to a `useSyncExternalStore` store, and add `forgetEditState()` for sign-out.
- [x] 7.1b Owner answer H: the "Back to the website" link in the `/admin` header, with an e2e check (D12).
- [x] 7.1c CI green on the fix, including preview-e2e and Lighthouse.
- [x] 7.2 **(owner)** Preview check as admin (D11; validation.md).
- [x] 7.3 Roadmap *Built* note on the Phase 26 row. Tick validation.md and this plan, and finish implementation.md.
- [ ] 7.4 **(owner)** Merge into `develop`; develop run green.
