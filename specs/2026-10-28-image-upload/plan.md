# Plan — Phase 28 Image upload & replace

Scope, decisions (D1–D14) and constraints (C1–C6) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md). Steps marked **(owner)** are the owner's (C6).

## PR A — slot, read and hero layout (`feature/phase-28-image-upload`)

### 1. Constitution

- [x] 1.1 `tech-stack.md`: *Core* → Media: images, *Architectural rules* 12, the CSP row, *In-place CMS* 5, *Schema decisions* and *Environment variables* (spec → *Constitution changes*).
- [x] 1.2 `README.md` tree comments if needed.

### 2. Table

- [x] 2.1 Generate an empty migration with `pnpm db:migrate --create-only` on Neon `dev`, and write the partial unique index by hand (D7). Apply it on `dev`. Check that it is additive and needs no grants.
- [x] 2.2 Confirm in the Cloudinary docs (ctx7) whether the account uses dynamic folders, and that a signed `public_id` containing slashes sets the full public ID either way. Record the result in `implementation.md` (D6).

### 3. Slots and read

- [x] 3.1 `lib/media/slots.ts`: the slot type and `home.hero` with the stand-in default (D2, D4).
- [x] 3.2 `lib/media/read.ts` and a pure `read-core.ts`: `readMediaSlots()`, `"use cache"`, `cacheTag("media")`, `days` on success and `minutes` with a failure result; `mediaSlot(slot)` returns the row's image or the default (D8).
- [x] 3.3 Tests: `slots.test.ts` (every default passes `isRhmPublicId`, every folder sits under `rhm/{ownerType}/`), `read-core.test.ts` (default with no row, the row when present, defaults on a failed read) and `read-core.db.test.ts` (`rhm_app` can read and write `MediaItem`; a second `PAGE` row for the same slot fails on the index).

### 4. Hero layout

- [x] 4.1 `components/home/hero.tsx`: two columns at `lg`, the image under the button below that, `<MediaImage aspect="4/5" preload>` from `mediaSlot("home.hero")` (D1).
- [x] 4.2 Screenshots of `/` at 360px, 768px and 1440px in `implementation.md`. Run the layout, contrast and reduced-motion e2e locally.

### 5. Checks and PR A

- [x] 5.1 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and `pnpm build` with the CMS off and on. The route table matches `develop` (C1).
- [x] 5.2 Commit, push, and open PR A into `develop`.
- [x] 5.3 CI green on PR A, Lighthouse on `/` included.
- [x] 5.4 **(owner)** Merge PR A; `migrate-preview` applies the migration on the `develop` run.

## PR B — editing (new branch from `develop` after 5.4)

### 6. Key, env and CSP

- [x] 6.1 **(owner)** Create a second Cloudinary API key used only by the site, and add `NEXT_PUBLIC_CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` (Sensitive) to Vercel **Preview** (D11).
- [x] 6.2 `lib/env.ts`: both variables, required on Vercel where `CMS_ENABLED=1`, with tests. CI sets placeholders.
- [x] 6.3 `lib/security/headers.ts`: `connect-src https://api.cloudinary.com`, with its test (D11).
- [x] 6.4 Move `cloudinary` 2.11.0 to `dependencies` (C2). Remove `next-cloudinary`, which no code uses once uploads skip the widget, together with its `eslint.config.mjs` import guard and the GHSA-mrhx-c7xc-m3w5 ignore in `pnpm-workspace.yaml` (the ignore's own removal condition), and update `tech-stack.md` → *Core* and the supply-chain row to match. Found in the build; see `implementation.md`.
- [x] 6.5 `docs/runbooks/secret-rotation.md`: a row for the site key (D11).

### 7. Actions

- [x] 7.1 `lib/media/sign-core.ts`: the slot check, the public ID `{folder}/{env}/{random}`, and the signed parameters (D6).
- [x] 7.2 `lib/media/attach-core.ts`: `attachMediaCore()` and `removeMediaCore()` in the D9 order, the destroy rule and audit of D10. The Cloudinary client is an argument.
- [x] 7.3 `lib/media/actions.ts`: `signCloudinaryUpload`, `attachMedia` and `removeMedia`, each starting with `await requireRole("editor")`, then `updateTag("media")` after a change.
- [x] 7.4 Unit tests: the signature matches the SDK's for a fixed secret and timestamp; Zod refuses an unlisted slot, an empty or 151-character alt, a line break in alt, a public ID in another folder, another environment or with `..`, and a full URL.
- [ ] 7.5 Database tests through the cores with fake sessions and a fake Cloudinary client (`attach-core.db.test.ts`): 401 when signed out; 403 for sales and for a user without 2FA; the 31st action in 10 minutes refused; a replace (one row, `media.replace` audit, old upload destroyed); an alt-only save (`media.alt`, nothing destroyed); a remove (`media.remove`, default shows); an oversized or wrong-format upload destroyed and refused with nothing written; a default, seed or other-environment ID never destroyed; a failed destroy logged with the save kept.

### 8. Component

- [x] 8.1 `components/cms/editable-image.tsx`: `<EditableImage slot>`, a server wrapper that renders `<MediaImage>` and, for editors, the client ✎ and dialog (D3). Reuse the Phase 27 dialog pieces and `openKey`. The copy goes in `cmsCopy`.
- [x] 8.2 The client upload: the type and 15 MB check, sign, `fetch` to Cloudinary, attach, `router.refresh()`; each failure shown in the dialog (D5).
- [x] 8.3 `hero.tsx` uses `<EditableImage slot="home.hero">`.
- [ ] 8.4 Screenshots at 360px and 1440px with editing on and with the dialog open. The ✎ covers no control and the pill covers no ✎.

### 9. End-to-end and scripts

- [x] 9.1 `e2e/editable-image.spec.ts` with the mocked editor session and `api.cloudinary.com` stubbed: the ✎ only with editing on; the dialog opens; Escape and Cancel close it and return focus; alt is required and counted; a 16 MB file and a `.heic` file are refused in the dialog before any request; a refused save keeps the draft and shows the error; turning editing on moves nothing on `/`; visitors and sales see no ✎ (D13).
- [x] 9.2 axe with editing on and the dialog open.
- [x] 9.3 Add the spec to preview-e2e's list in `preview-headers.yml`.
- [x] 9.4 `scripts/media-check.mts`: prints whether a public ID exists (Admin API `resource`), for the owner's check (D14).

### 10. Checks, PR B and close-out

- [ ] 10.1 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:db`, and `pnpm build` with the CMS off and on. Compare the route table and a visitor HTML sample of `/` with `develop` (C1, C3).
- [ ] 10.2 Commit, push, and open PR B into `develop`. CI green, preview-e2e included.
- [ ] 10.3 **(owner)** Preview checks (D14; `validation.md`).
- [ ] 10.4 **(owner)** Send the default hero photo. Upload it to `rhm/page/home-hero/default` and change the default in `slots.ts` (D2).
- [ ] 10.5 Roadmap *Built* note on the Phase 28 row. Tick `validation.md` and this plan, and finish `implementation.md`.
- [ ] 10.6 **(owner)** Merge PR B into `develop`; develop run green.
