# Plan — Phase 27 Editable text

Scope, decisions (D1–D12) and constraints (C1–C5) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md). Steps marked **(owner)** are the owner's (C5).

## PR A — table, read and skip fix (`feature/phase-27-editable-text`)

### 1. Constitution

- [x] 1.1 `tech-stack.md`: *Architectural rules* 13, *In-place CMS* 3 and 4 (spec → *Constitution changes*).
- [x] 1.2 `lib/content/keys.ts` comment, and the `README.md` tree comment if needed.

### 2. Table

- [x] 2.1 Add `ContentBlock` to `prisma/schema.prisma` (README §5). Generate the migration with `pnpm db:migrate` on Neon `dev` only, and check that it is additive and needs no hand-written grants (the default privileges from `20261012000000_roles` cover `rhm_app`).
- [x] 2.2 Confirm `updateTag`, `cacheTag` and `cacheLife` in the Next 16 docs (ctx7) and record the result in `implementation.md` (D6).

### 3. Read

- [x] 3.1 `lib/content/read.ts`: `readContentBlocks()`, `"use cache"`, `cacheTag("content")`, `days` on success (D6 amended) and `minutes` with a failure result, as in `lib/portfolio/read.ts` (D6).
- [x] 3.2 `lib/content/block.ts`: `import "server-only"`, and an override from the read when there is a row, otherwise the default. Unknown keys still throw. The pure lookup is `resolveBlock()` in `read-core.ts`. Vitest aliases `server-only` to Next's empty module, and `vitest.setup.ts` stubs the cached read (Phase 2, C4).
- [x] 3.3 Tests: `read-core.test.ts` (the default with no row, the row when present, the defaults on a failed read) and `read-core.db.test.ts` against a real Postgres (`rhm_app` can select, insert, update and delete `ContentBlock`).

### 4. Skip fix

- [x] 4.1 `e2e/a11y.spec.ts:73` and `e2e/shell.spec.ts:70` wait for the streamed content when `E2E_PORTFOLIO_STATE=ready` (D11).

### 5. Checks and PR A

- [x] 5.1 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm build` with the CMS off and on. The route table matches `develop` (C1).
- [x] 5.2 Commit, push, and open PR A into `develop` (#69).
- [x] 5.3 CI green on PR A, with preview-e2e showing the steady skip count.
- [x] 5.4 **(owner)** Merge PR A; `migrate-preview` applies the migration on the `develop` run.

## PR B — editing (new branch from `develop` after 5.4)

### 6. Keys and rendering

- [x] 6.1 `lib/content/editable.ts`: the kinds and caps, and the list of editable keys with their kinds (D1, D4). Log in `implementation.md` any visible key left out, and why.
- [x] 6.2 `lib/content/rich-text.tsx`: `**bold**` to `<strong>` and one `<p>` per line for body; plain text otherwise (D3).
- [x] 6.3 Tests: every listed key exists in the defaults, matches the pattern and fits its cap. No key from the inquiry form, metadata or error copy is listed. The renderer handles unmatched markers, empty lines and markup-looking text (rendered as text).

### 7. Action

- [x] 7.1 `lib/content/actions.ts`: `updateContentBlock` in the D5 order, with the D8 limit and the D7 audit in one transaction, then `updateTag("content")`.
- [x] 7.2 Unit tests for the Zod schema: the pattern, an unlisted key, each kind's cap, a newline outside body, trimming and `\r`.
- [x] 7.3 Database tests through `updateContentBlockCore()` with the real guard decision fed fake sessions (`update-core.db.test.ts`): 401 when signed out, 403 for sales and for a user without 2FA, the rate limit's 61st save, an upsert, an empty value deleting the row, the audit rows with `before`/`after`, and nothing written when the audit insert fails.

### 8. Component and call sites

- [x] 8.1 `components/cms/editable.tsx` (`<Editable>`, `<BodyText>`) and `edit-button.tsx` (the ✎ and the editor dialog) (D2, D9 amended). The dialog copy goes in `cmsCopy`.
- [x] 8.2 Replace the visible-text renders on each D1 page with `<Editable>`, `<BodyText>` or a side-by-side `<EditButton>` (in one commit): home, services and service pages, about, contact, portfolio, the footer, privacy.
- [x] 8.3 Screenshots at 360px and 1440px of the home and a service page with editing on. Check that no ✎ overlaps a control or the pill.

### 9. End-to-end

- [x] 9.1 `e2e/editable.spec.ts` with the mocked editor session: the ✎ appears only with editing on, the dialog opens, Escape and Cancel close it and return focus, only one dialog opens at a time, a failed save keeps the draft and shows the error, bold renders as `<strong>`, and a visitor and sales staff see no ✎.
- [x] 9.2 axe with editing on and the dialog open. Every ✎ can be reached by keyboard.
- [x] 9.3 Add the spec to preview-e2e's list in `preview-headers.yml`.

### 10. Checks, PR B and close-out

- [x] 10.1 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:db`, and `pnpm build` with the CMS off and on. Compare the route table and a visitor HTML sample with `develop` (C1, C3).
- [x] 10.2 Commit, push, and open PR B into `develop` (#70). CI green, preview-e2e included.
- [x] 10.3 **(owner)** Preview edit check (D12; `validation.md`).
- [x] 10.4 Roadmap *Built* note on the Phase 27 row. Tick `validation.md` and this plan, and finish `implementation.md`.
- [x] 10.5 **(owner)** Merge PR B into `develop`; develop run green.
- [x] 10.6 Owner amendment after the preview check: heading and line blocks get a wrapping textarea that saves one line (D2 amended). This lands with a fix for the dialog-reopen race found by develop's preview-e2e, and the close-out (`feature/phase-27-editor-textarea`).
- [x] 10.7 **(owner)** Merge the close-out PR into `develop`; develop run green, preview-e2e included.
- [x] 10.8 Owner amendment after the merge: the ✎ leaves the flow, so turning editing on moves nothing (D9 amended), with an e2e test (`feature/phase-27-edit-icon-overlay`).
- [x] 10.9 PR into `develop` (#73). CI green, preview-e2e included.
- [x] 10.10 **(owner)** Preview check of the toggle (`validation.md`), then merge. Develop run green.
