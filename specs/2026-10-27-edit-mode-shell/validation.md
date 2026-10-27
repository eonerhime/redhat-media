# Validation — Phase 26 Edit-mode shell

## Roadmap success check ("Done when", verbatim)

> An editor sees the toggle, while sales staff and visitors do not. Public pages are still pre-rendered.

- [ ] **An editor sees the toggle:** `e2e/edit-mode.spec.ts` shows the pill for the mocked editor and admin in preview-e2e (plan 5.1), and the owner sees it as admin on the preview (D11).
- [ ] **Sales staff and visitors do not:** the same spec shows no pill for sales, for a user without 2FA, for a signed-out answer and for a visitor with no hint. The visitor makes no `/api/cms/session` request. In the `ci` job (CMS off), there is no pill and no request.
- [ ] **Public pages are still pre-rendered:** the route table of `pnpm build` on this branch shows the same `○` / `◐` markers for every public route as `develop` run 40515668722 (C1).

## Behaviour (spec D2–D8)

- [ ] The header icon and the pill come from one `/api/cms/session` request per navigation (D2, D3).
- [ ] Editing starts Off. The toggle survives a client navigation and a reload, and a new browser context starts Off (D6).
- [ ] When the answer drops to sales or signed out, `rhm:editMode` is removed. Sign-out removes `rhm:role` and `rhm:editMode` (D7).
- [ ] A failed request keeps the last known role (D3). Throwing storage doesn't break the page (D4; unit test).

## Accessibility and layout

- [ ] axe finds zero WCAG 2.2 A/AA violations with the pill Off and On. The pill is reachable by keyboard and its `aria-pressed` follows the state (D5).
- [ ] At 360px the pill covers none of the mobile nav button, the open nav's links, the footer contact links or the inquiry stepper's buttons. Screenshots are in implementation.md (C6).

## Owner's preview check (owner answer F)

- [ ] **(owner)** On the PR's preview: sign in at `/admin` as admin with 2FA and land on `/`. The pill shows "Editing: Off". It toggles to "Editing: On" (red), stays On across a click to another page and a reload, and a new tab shows Off.
- [ ] **(owner)** DevTools Network shows one `/api/cms/session` request per navigation. After Sign out, back on the site, there is no pill and no icon.

## Merge gate

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` pass.
- [ ] `pnpm build` passes with the CMS on and off.
- [ ] CI on the PR is green: `ci`, `db`, preview headers, preview-e2e (with the new spec), Lighthouse (every template ≥ 0.90; for the `/portfolio/sportspred` flake, rerun first), gitleaks and the dependency audit.
- [ ] No new dependency (C2). `pnpm audit --prod` has no high or critical findings.
- [ ] `tech-stack.md`, `README.md` and `roadmap.md` updated as listed in spec → *Constitution changes*.
- [ ] Every box in `plan.md` ticked, and `implementation.md` records every deviation.
