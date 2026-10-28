# Validation — Phase 27 Editable text

## Roadmap success check ("Done when", verbatim)

> An editor changes homepage and service copy in place, and an anonymous visitor sees the change after reload.

- [x] **An editor changes homepage and service copy in place:** the owner's preview edit check below, plus `e2e/editable.spec.ts` (the dialog and the refused-save path with a mocked editor) and the database tests of `updateContentBlockCore()`.
- [x] **An anonymous visitor sees the change after reload:** in the owner's check, a private window shows the edited text after a reload. A database test shows that `block()` returns the row after a save.

## Behaviour (spec D2–D9)

- [x] Signed out gets 401; sales and a user without 2FA get 403. None of them writes a row or an audit event (D5).
- [x] An unlisted key, a key outside the pattern, a value over its kind's cap and a line break outside body are refused (D4).
- [x] An empty value deletes the row, and the page shows the default again (D5).
- [x] Every save and reset writes one `content.update` or `content.reset` with `before` and `after`, in the same transaction (D7).
- [x] The 61st save within 10 minutes is refused and writes nothing (D8).
- [x] A failed save keeps the dialog open with the draft and shows the error (rule 8).
- [x] `**bold**` renders as `<strong>` in body blocks only, and markup-looking text renders as text (D3).
- [x] A failed content read shows the defaults, and the build still passes with no database (D6).

## Accessibility and layout

- [x] axe finds zero WCAG 2.2 A/AA violations with editing on and with the dialog open.
- [x] Every ✎ is reachable by keyboard, at least 24×24 px, and labelled `Edit "…"`. The dialog takes focus, Escape closes it, and focus returns to the ✎ (D2, D9).
- [x] At 360px and 1440px, no ✎ covers a control or the pill (screenshots in `implementation.md`).
- [x] Turning editing On moves no text on `/` (1280px and 360px), `/contact` and `/portfolio` (360px), and no ✎ widens the page (`editable.spec.ts`; D9 amended).

## Static pages and visitor HTML

- [x] `pnpm build` route tables in PR A and PR B show the same `○` / `◐` markers for every public route as `develop` (C1).
- [x] Visitor HTML of `/`, a service page and `/about` has no ✎, dialog or edit hook (C3).

## Owner's preview check (D12)

- [x] **(owner)** On PR B's preview, signed in as admin with Editing On: edit the homepage tagline, a service page's summary, and the "Our story" paragraph on `/about` with one bold word (only body blocks take bold; D3). All three show at once. A private window shows all three after a reload, with the word in bold.
- [x] **(owner)** Save all three empty: the defaults return, on the page and in the private window after a reload.

Done on #70's preview (owner, 2026-10-28: "all checks passed").

- [ ] **(owner)** On the amendment PR's preview, turn Editing On and Off on `/`, `/contact` and `/portfolio`: nothing on the page moves, and each ✎ sits just after its text or control (D9 amended).

## Merge gate (each PR)

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm test:db` pass.
- [x] `pnpm build` passes with the CMS on and off.
- [x] CI on the PR is green: `ci`, `db`, preview headers, preview-e2e (PR A with the steady skip count, D11; PR B with the new spec), Lighthouse (every template ≥ 0.90; for the `/portfolio/sportspred` flake, rerun first), gitleaks and the dependency audit.
- [x] The CI unguarded-action scan passes with no new allowlist entry (C4).
- [x] No new dependency (C2). `pnpm audit --prod` has no high or critical findings.
- [x] `tech-stack.md`, `README.md` and `lib/content/keys.ts` updated as listed in spec → *Constitution changes*.
- [x] Every box in `plan.md` ticked, and `implementation.md` records every deviation.
