# Phase 26 — Edit-mode shell

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 3, Phase 26
- **Branch:** `feature/phase-26-edit-mode-shell` (from `develop` at `cec80cd`)
- **Started:** 2026-10-27
- **Status:** owner answers A–G given 2026-10-27 (H after the preview check); approved to build 2026-10-27 ("build it")

## What and why

Phase 24 gave staff a sign-in that lands them on the website, and Phase 25 gave the browser one way to ask "which staff role am I?" (`GET /api/cms/session`). This phase adds the shell every editing phase (27–31) plugs into:

- `EditModeProvider`, a client context that knows the signed-in staff role and whether editing is on;
- the floating **Editing: On/Off** pill for editors and admins;
- the "one open popover at a time" state that Phase 27's `<Editable>` will use.

Nothing is editable yet, so turning editing on changes only the pill. The admin panel and Sign out stay behind the header's admin icon (Phase 24, D13 amended).

## Constitution sections this phase relies on

- `mission.md` → *Users* 4 (editors work on the live pages through the toggle).
- `tech-stack.md`:
  - *Architectural rules* 1 (public server components never read the session), 5 (server-side authorisation; the browser's role only decides what appears) and 6 (staff entry, header admin icon, sign-in hint);
  - *In-place CMS* → *Roles* (only `editor` and `admin` get the toggle) and *How it works* 1–3;
  - *Supporting tools* → E2E (preview-e2e, axe).
- Phase 24 spec: D11 (`CMS_ENABLED` off in production), D13 as amended (header icon, `localStorage` hint, plain `<a>`), D16 (✎ buttons, from Phase 27).
- Phase 25 spec: D8 (`/api/cms/session` shape), D9 (the icon clears the hint only when `authenticated` is false).
- MRU (`memories-r-us`), read before this spec, per the owner's rule that staff UX mirrors MRU:
  - `src/components/edit-mode.tsx`: the context shape (`role`, `canEdit`, `editMode`, `authenticated`, `openBlockKey`), the fixed bottom-right pill, `sessionStorage` for the toggle and the last-known role, both read only after hydration (MRU fixes 030, 032, 074), and a network failure keeping the last known role;
  - `src/components/edit-controls-pill.tsx`: wrappers gate on `editMode`, not `canEdit`.

## Scope

1. **Constitution first** (listed below).
2. **`EditModeProvider` and `useEditMode()`**, with guarded `sessionStorage` helpers (D1, D3, D4, D6–D8).
3. **One session read:** the header admin icon reads the role from the provider instead of fetching on its own (D2).
4. **The Editing pill** (D5, D6).
5. **Sign-out clears the edit state** (D7).
6. **Tests:** Vitest for the helpers, and a Playwright spec with a mocked session in preview-e2e (D10).
7. **A "Back to the website" link on every `/admin` page** (D12; owner, 2026-10-27, after the preview check).

## Constitution changes (in the PR, before the code)

- **`tech-stack.md`:**
  - *Architectural rules* 6: the shared `EditModeProvider` asks the server who is signed in (still only when the hint is set), and the header icon reads its answer (D2).
  - *In-place CMS* → *How it works* 1: the provider is mounted in `<PublicShell>` where the CMS is on, owns the one session read and re-reads it on every navigation (D1–D3).
  - *In-place CMS* → *How it works* 2: the pill's look, `aria-pressed`, default Off, the `sessionStorage` keys, and clearing on sign-out or when the role drops (D5–D7).
  - *Supporting tools* → E2E: "edit-mode happy paths" becomes `e2e/edit-mode.spec.ts` in preview-e2e with a mocked session, from Phase 26 (D10).
- **`README.md`** tree: `(public)/` gets the provider through `<PublicShell>`; `components/cms/` already names `EditModeProvider`.
- **`roadmap.md`:** a dated *Built* note on the Phase 26 row at close-out.
- **`mission.md`:** no change.

## Out of scope

- ✎ buttons, `<Editable>`, `ContentBlock` and `updateContentBlock` (Phase 27). Images, galleries, videos, portfolio fields and service muting (Phases 28–31).
- Escape-to-close and focus handling inside popovers: each popover owns them (Phase 27). This phase only holds which one is open.
- Editing inside the portfolio modal. The modal `<dialog>` makes the page behind it inert, so the pill can't be reached while it is open. A later editing phase decides whether the modal gets its own controls.
- The new-lead count on the icon (Phase 32), and real editor and sales accounts on preview (staff management, Phase 33; owner answer F).
- A page-wide "editing" banner or outline, and a keyboard shortcut for the toggle.
- Any change to `/admin/*` pages other than the back link (D12), to the session endpoint or to the guards.

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **`EditModeProvider` in `components/cms/edit-mode.tsx`**, a client component. `<PublicShell>` wraps the skip link, header, main and footer in it, **only where `env.cms` is on** (a server-side condition). Production pages therefore carry none of it until Phase 34. Without the provider, `useEditMode()` returns the visitor default: no role, editing off. Because `<PublicShell>` also renders the root not-found, the 404 page gets the provider too.<br><br>*Amended in the build (2026-10-27):* the state lives in a small module store read with `useSyncExternalStore`, not in React context. A context value that changed after hydration, above a Suspense boundary that was still streaming, made React client-render that boundary, and the streamed HTML stayed in the page as a hidden duplicate. preview-e2e found it: two `portfolio-listing` elements, and a second JSON-LD block. A store update re-renders only the components that read it. The provider still mounts the reads and the pill, and `useEditMode()` keeps its API. | The header has to sit inside the provider for one shared read (D2). The provider stays a client island inside static server components, so it adds no session read on the server (rule 1). | Owner answer A; Phase 24 D11 |
| D2 | **One session read.** The provider calls `GET /api/cms/session` (`no-store`) only when the `localStorage` hint is set (`hasStaffHint()`). It exposes `role` and `authenticated`. `StaffLink` reads the role from `useEditMode()` and no longer fetches. Phase 25 D9's hint rule moves into the provider: it clears the hint only when `authenticated` is false. The icon stays a plain `<a>`. | One request per page instead of two, and the icon and pill can never disagree. Visitors without the hint still make no request. | Owner answer A; Phase 25 D9 |
| D3 | **Re-read on every navigation.** The read runs after hydration and again on each `usePathname()` change. A response that arrives after a newer navigation is ignored. A network failure keeps the last known role, as in MRU. | The `(public)` layout does not remount on a client navigation, so a mount-only read would let a pill outlive an expired or demoted session until a hard reload. Only staff (hint set) make the request. | Owner answer B; MRU |
| D4 | **Last-known role in `sessionStorage`** (`rhm:role`), read only after hydration (`useHydrated()`), so the server HTML and the first client render match. The fetched answer takes over when it arrives, and is written back: the role when there is one, otherwise the key is removed. Every storage call is guarded, because storage can throw (private browsing, blocked storage). | The pill doesn't vanish and reappear on a full page load (MRU 032). Reading storage during hydration would discard the server markup (MRU 074). | MRU; Claude's call |
| D5 | **The pill.** It appears when the role is `editor` or higher (`hasMinRole(role, "editor")`), so not for sales staff, staff without 2FA or visitors. It holds only the toggle, because the admin panel and Sign out stay behind the header icon. It is a `<button type="button">` with the visible text **"Editing: Off"** or **"Editing: On"** and `aria-pressed`. It is fixed bottom-right, clear of the iOS home bar (`env(safe-area-inset-bottom)`), above the sticky header's z-index, and not printed. It is rendered after the footer, so it comes last in tab order. **Off:** `ink` background with a `muted` outline. **On:** `brand-deep` fill (the button red) with `fg` text. It doesn't animate. | MRU's pill, with a colour change the owner chose, so "editing is live" can be seen at a glance. `fg` on `brand-deep` is about 5:1 (AA). `aria-pressed` tells a screen reader the state the text shows. | Owner answer C; roadmap; tech-stack rule 10 |
| D6 | **The toggle state.** Editing **starts Off** after sign-in. The toggle is kept in `sessionStorage` (`rhm:editMode`, `"1"` or `"0"`), read after hydration, so it survives navigation and reload in that tab, and a new tab starts Off. `editMode` is `canEdit && toggle`, so a demoted user loses it at once. Toggling closes any open popover. | As in MRU (030). Staff browse the site as visitors see it until they turn editing on. | Owner answer D; MRU |
| D7 | **Clearing the edit state.** `SignOutButton` removes `rhm:role` and `rhm:editMode` along with the hint. The provider removes `rhm:editMode` when an answer gives no editor role (signed out, no 2FA, or demoted to sales), so a later sign-in in the same tab starts Off again. | The next person on a shared computer, or the same person under a lower role, doesn't inherit "Editing: On". It is UI state only, but the toggle should follow the account. | Claude's call |
| D8 | **The context API for Phases 27–31:** `useEditMode()` returns `{ role, authenticated, canEdit, editMode, openKey, setOpenKey }`. `openKey` names the one open editor popover on the page, or null. Opening one closes any other, and turning editing off sets it to null. Controls gate on `editMode`, not `canEdit` (MRU). No wrapper component like MRU's `EditControlsPill` is added until a phase needs one. | One open popover at a time (roadmap; tech-stack *In-place CMS* 3). MRU's `openBlockKey`, renamed because images and videos will use it too. | Roadmap; MRU; Claude's call |
| D9 | **UI only.** Nothing in the context authorises anything. Every mutation still opens with `requireRole()` (rule 5). This phase adds no mutation and no endpoint, so `guard-coverage.test.ts` and `public-mutations.ts` don't change. | The browser's role is never trusted (rule 5). | tech-stack |
| D10 | **Tests.**<br>• **Vitest** on the pure helpers: guarded storage reads and writes (including a throwing `Storage`), `canEdit(role)` for every role and null, and the "drop the toggle when the role isn't an editor" rule.<br>• **Playwright** `e2e/edit-mode.spec.ts`. Under `E2E_CMS=on` (preview-e2e) it sets the hint and answers `/api/cms/session` with `page.route()` per case: visitor with no hint (no request at all), signed out (hint cleared), signed in without 2FA, sales, editor and admin. It checks the header icon and the pill for each, the toggle and `aria-pressed`, persistence across a client navigation and a reload, Off in a new browser context, a re-read on each navigation, and `rhm:editMode` dropped when the role falls to sales. Under the `ci` job (CMS off) it checks there is no pill and no request. An axe WCAG 2.2 AA scan runs with the pill Off and On, and the pill is reached by keyboard. | No component-test library is added. The mocked session covers roles that preview has no account for. | Owner answers E, F |
| D11 | **The owner's preview check, as admin:** after sign-in the pill shows Off. It toggles, stays On across a client navigation and a reload, starts Off in a new tab, and disappears with the edit state after sign-out. DevTools shows one `/api/cms/session` request per navigation. | The real session, end to end, with the one account preview has. | Owner answer F |
| D12 | **A "Back to the website" link** (`cmsCopy.backToSite`) in the `/admin` layout's header bar, so every staff page has one, the sign-in after sign-out included. It points to `/`. Visitors still see no link to `/admin`, because rule 6 covers only the other direction. | After signing out, the owner landed on the sign-in with no way back to the site. | Owner answer H |

### Owner answers (2026-10-27)

| # | Question | Answer |
| --- | --- | --- |
| A | The header icon's own session call | One shared read: the provider in `<PublicShell>`, and the icon reads from it |
| B | When to re-check the session | On every navigation |
| C | The pill's two states | Red fill when On |
| D | Editing after sign-in | Off |
| E | Testing the role gating | Playwright with a mocked session; Vitest for the helpers; no new libraries |
| F | Real editor and sales accounts | Not now: mocked e2e plus the owner's admin check on preview |
| G | Merge gates beyond CI | "Pick those that are applicable." Claude picked all four offered: route table unchanged, axe with the pill visible, a 360px overlap check, Lighthouse unchanged |
| H | After the preview check | "There should be a link/button to go back to homepage/website after logging out" |

## Constraints

- **C1 Public pages stay static.** The build's route table shows the same `○` / `◐` markers for every public route as `develop`'s last CI run (40515668722). `usePathname()` in a client component does not opt a route into dynamic rendering. If the build shows otherwise, stop and raise it.
- **C2 No new dependencies.**
- **C3 No schema change**, so this is one PR.
- **C4** Steps marked **(owner)** are the owner's: the preview check and merging.
- **C5** `CMS_ENABLED` stays off in production (Phase 24 D11). With it off, no provider, pill or session request reaches the page.
- **C6 Mobile layout.** At 360px the pill must not cover the mobile nav button, the open nav panel's links, the footer contact links or the inquiry stepper's buttons. If it does, the fix (offset, or hiding the pill while the nav is open) is decided in the build and logged.
