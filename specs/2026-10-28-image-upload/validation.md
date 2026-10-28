# Validation — Phase 28 Image upload & replace

## Roadmap success check ("Done when", verbatim)

> An editor replaces the homepage hero image, and the old Cloudinary asset is destroyed.

- [ ] **An editor replaces the homepage hero image:** the owner's real replace on PR B's preview (below), plus `e2e/editable-image.spec.ts` (the dialog and the refused save with a mocked editor) and the database tests of `attachMediaCore()`.
- [ ] **The old Cloudinary asset is destroyed:** after the owner's second replace, `scripts/media-check.mts` reports the first upload's public ID as not found. A database test shows `destroy` is called with the old ID after the transaction commits.

## Behaviour (spec D3–D10)

- [ ] Signed out gets 401; sales and a user without 2FA get 403, from all three actions. None of them signs, writes a row or writes an audit event (D6, D9).
- [ ] The signed public ID is chosen by the server, under `{folder}/{env}/`, and the formats are signed (D6).
- [ ] `attachMedia` refuses an unlisted slot, a public ID outside this slot and environment, and alt text that is empty, over 150 characters or more than one line (D9).
- [ ] An upload over 15 MB or in another format is destroyed and refused, and nothing is written (D9).
- [ ] A replace leaves one row for the slot, writes `media.replace` with `before` and `after`, and destroys the old upload (D7, D10).
- [ ] An alt-only save writes `media.alt` and destroys nothing (D9, D10).
- [ ] Remove deletes the row, writes `media.remove`, destroys the upload, and the page shows the default (D9, D10).
- [ ] A default, a seed asset or another environment's upload is never destroyed (D10).
- [ ] A failed destroy is logged and the save stands (D10).
- [ ] The 31st action within 10 minutes is refused and writes nothing (D9).
- [ ] A failed media read shows the default image, and the build still passes with no database (D8).
- [ ] A failed upload or save keeps the dialog open with the draft and shows the error (rule 8).

## Accessibility and layout

- [ ] axe finds zero WCAG 2.2 A/AA violations on `/` with editing on and with the dialog open.
- [ ] The ✎ is reachable by keyboard, at least 24×24 px, and labelled `Edit image: "…"`. The dialog takes focus, Escape closes it, and focus returns to the ✎ (D3).
- [ ] Turning editing on moves nothing on `/` at 1280px and 360px (D3).
- [ ] The hero at 360px, 768px and 1440px matches D1, with screenshots in `implementation.md`.

## Static pages, visitor HTML and security

- [ ] `pnpm build` route tables in PR A and PR B show the same `○` / `◐` markers for every public route as `develop` (C1).
- [ ] Visitor HTML of `/` has the hero `<img>` and no ✎, dialog or edit hook (C3).
- [ ] The CSP adds only `https://api.cloudinary.com` to `connect-src`, and its test passes (D11).
- [ ] `CLOUDINARY_API_SECRET` appears in no client bundle (search the `.next/static` output) (C5).

## Owner's preview checks (D14)

- [ ] **(owner)** On PR B's preview, signed in as admin with Editing On: replace the hero image with a photo and new alt text. It shows at once, and a private window shows it after a reload.
- [ ] **(owner)** Replace it again. `node scripts/media-check.mts <first public ID>` reports it not found.
- [ ] **(owner)** Change only the alt text, then Remove: the stand-in default returns, on the page and in a private window.
- [ ] **(owner)** Replace the hero from your phone's camera roll. A refused format shows a clear message.
- [ ] **(owner)** Mobile Lighthouse on the preview's `/` scores 90 or above with the hero image.

## Merge gate (each PR)

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm test:db` pass.
- [ ] `pnpm build` passes with the CMS on and off.
- [ ] CI on the PR is green: `ci`, `db`, preview headers, preview-e2e (PR B with the new spec), Lighthouse (every template ≥ 0.90; for the `/portfolio/sportspred` flake, rerun first), gitleaks and the dependency audit.
- [ ] The CI unguarded-action scan passes with no new allowlist entry (C4).
- [ ] No new dependency; `cloudinary` only moves to `dependencies` (C2). `pnpm audit --prod` has no high or critical findings.
- [ ] `tech-stack.md`, `README.md` and the secret-rotation runbook updated as listed in spec → *Constitution changes*.
- [ ] Before the release PR, the default is the owner's photo, not the stand-in (D2).
- [ ] Every box in `plan.md` ticked, and `implementation.md` records every deviation.
