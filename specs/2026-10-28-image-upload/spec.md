# Phase 28 — Image upload & replace

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 3, Phase 28
- **Branch:** `feature/phase-28-image-upload` (from `develop` at `fa0ad0c`); PR B gets its own branch from `develop` after PR A merges (D12)
- **Started:** 2026-10-28
- **Status:** owner answers A–I given 2026-10-28; waiting for "build it"

## What and why

Phase 27 made the site's copy editable in place. This phase does the same for a single image:

- the homepage hero gains an image, beside the text, with a default photo set in code;
- `<EditableImage slot>`, a ✎ on the image that opens a dialog to replace the image, edit its alt text or remove the upload;
- the server actions `signCloudinaryUpload` (server-fixed public ID, formats and size) and `attachMedia` (folder, format and size checked again before saving), plus `removeMedia`;
- after a replace or remove, the old Cloudinary asset is destroyed.

The homepage hero has no image today (Phase 3 spec deferred "hero imagery" to Phases 8 and 28), so this phase also adds the image to its layout.

## Constitution sections this phase relies on

- `mission.md` → *Users* 4 (editors work on the live pages through the toggle) and principle 10 (Editing Off shows exactly what a visitor sees).
- `tech-stack.md`:
  - *Core* → Media: images (public IDs only, `<MediaImage>`, `cloudinary` moves to `dependencies` when this phase first uses it at runtime);
  - *Architectural rules* 1 (public pages static), 5 (`requireRole` on every mutation), 8 (typed `{ ok, error }` results; the dialog stays open on failure), 10 (labelled, keyboard-reachable edit controls), 11 (Lighthouse ≥ 90, the LCP image prioritised), 12 (CSP) and 13 (cache refresh after writes);
  - *Security baseline* → *Authorization & application* (uploads: server-signed, fixed folder, format and size; the folder checked again before attaching) and the Cloudinary hardening row (`<MediaImage>` renders only `rhm/…` public IDs);
  - *In-place CMS* → *How it works* 3 (✎ always visible, one dialog at a time) and 5 (`<EditableImage>`, `signCloudinaryUpload`, `attachMedia`, destroy after the database change);
  - *Environment variables* (the Cloudinary key and secret reach `lib/env.ts` and Vercel in Phase 28).
- Roadmap Milestone 3 preamble: every mutation has refusal tests, a per-user `rateLimit` and an `AuditEvent`.
- Phase 8 spec, D2, D5, D6 (public IDs, aspects, blur placeholder). Phase 25 spec, D1–D7 (`requireRole`, `audit()` in the same transaction). Phase 27 spec, D2 (native `<dialog>`), D5 (the core/action split), D6 (one cached read per tag) and D9 amended (the ✎ sits out of the flow; corner ✎).
- MRU (`memories-r-us`), read before this spec, per the owner's rule that staff UX mirrors MRU: ADR-016 and `src/components/templates/*/profile.tsx` (a cover photo with a "Replace" / "Remove" pill on its corner, empty is a valid state, one explicit slot per photo rather than position), `src/components/media-upload.tsx` (a plain file picker, upload, then record, then `router.refresh()`), and ADR-021 (client-side WebP compression, not adopted here: D5).

## Scope

1. **Constitution first** (listed below).
2. **Migration:** a partial unique index so a page slot holds at most one `MediaItem` (D7). It is additive, so it can merge on its own (D12).
3. **Slot registry** `lib/media/slots.ts`: each slot's owner, upload folder, aspect, `sizes` and default image. Only `home.hero` is listed (D4).
4. **Cached read** `readMediaSlots()`, tagged `media`, falling back to the defaults (D8).
5. **Hero layout:** the image beside the text at `lg`, stacked under the button below that, with the stand-in default (D1, D2).
6. **Actions** `signCloudinaryUpload`, `attachMedia` and `removeMedia`, with their cores (D5, D6, D9, D10).
7. **`<EditableImage slot>`** and its dialog (D3).
8. **Env, CSP and runbook:** the Cloudinary key and secret in `lib/env.ts` and Vercel Preview, `connect-src https://api.cloudinary.com`, and the secret-rotation entry (D11).
9. **Tests:** Vitest, database tests with a fake Cloudinary client, and a preview-e2e spec with a mocked session and a stubbed upload host (see `validation.md`).

## Constitution changes (in PR A, before the code)

- `tech-stack.md`:
  - *Core* → Media: images: `next-cloudinary` is no longer kept for an upload widget. Uploads use our own dialog and a signed `fetch` to Cloudinary (D5). The `cloudinary` SDK moves to `dependencies` in PR B, when the actions first use it.
  - *Architectural rules* 12 and the CSP row of *Security baseline*: `connect-src` gains `https://api.cloudinary.com` (D11).
  - *In-place CMS* 5: the slot registry, the server-chosen public ID under `rhm/{ownerType}/{slot}/{env}/`, the size check in `attachMedia`, alt-only saves, `removeMedia`, destroy only of this environment's uploads (never a default), the audit actions and the rate limit (D3–D10).
  - *Schema decisions*: one `MediaItem` per page slot, enforced by a partial unique index (D7).
  - *Environment variables*: the key and secret are in `lib/env.ts` from Phase 28, required wherever `CMS_ENABLED=1` on Vercel, from a key used only by the site (D11). The `.env` block comment on `NEXT_PUBLIC_CLOUDINARY_API_KEY` no longer says "upload widget".
- `docs/runbooks/secret-rotation.md`: the site's Cloudinary key gets its own row (D11).
- `README.md`: the `components/cms/` and `lib/media/` tree comments, if needed.

## Out of scope

- Galleries, captions and drag-reorder (Phase 29); video slots (Phase 30); portfolio covers and item images (Phases 29 and 31).
- Images on any page other than the homepage hero, including service pages (D4).
- Cropping or a focal point in the dialog. The crop is the slot's aspect with Cloudinary's `g_auto`.
- Client-side compression (D5).
- A sweep for orphaned uploads, and a view of failed destroys (Phase 36). A failed destroy is logged (D10).
- Concurrent editing: the last save wins.
- `CMS_ENABLED` in production (Phase 34).

## Decisions

| # | Decision | Source |
| --- | --- | --- |
| D1 | **Hero layout.** At `lg` and above, the hero is two columns: the current headline, subtext and button on the left, and the image on the right in a **4:5** crop. Below `lg`, the image stacks under the button at full width. The image is the page's LCP candidate on desktop, so it uses `<MediaImage preload>` with `sizes="(min-width: 1024px) 40vw, 100vw"` and its blur placeholder. The text's size, contrast and order are unchanged. | Owner answer A |
| D2 | **Default image in code.** The slot's default is a public ID and alt text in `lib/media/slots.ts`, the image equivalent of `content/defaults.ts`: with no row, the default shows. The build starts with the stand-in `rhm/page/dev-media/sample`. Before the release PR the owner sends a photo, which is uploaded to `rhm/page/home-hero/default` with `pnpm media:upload-seed` (or a small extension of it), and the default changes in one line. A default is never destroyed (D10). | Owner answers B, F |
| D3 | **The ✎ and its dialog.** With editing on, a 24px ✎ sits on the image's top-right corner, inside the image box, so nothing moves (Phase 27, D9 amended). It is labelled `Edit image: "<first 40 characters of the alt text>"`. It opens a native `<dialog>` (one at a time, through `openKey`; Escape and Cancel close it; focus returns to the ✎) holding: the current image; a file input (`accept` the four formats) that shows the chosen file's name and size; the **alt text**, required, at most 150 characters, with a live count; **Save**; and **Remove**, shown only while the slot holds an upload. Save with no file chosen changes only the alt text. There is no local thumbnail of the chosen file, so `img-src` needs no `blob:`. After Save or Remove, `router.refresh()` shows the new image. A failure keeps the dialog open with the draft and shows the error. The dialog copy goes in `cmsCopy`. | Owner answer C; MRU profile pill; Phase 27, D2 |
| D4 | **One slot this phase.** `lib/media/slots.ts` lists only `home.hero`: owner `PAGE`, `ownerId` `home.hero`, folder `rhm/page/home-hero`, aspect `4/5`, the D1 `sizes`, and the D2 default. A later slot is one entry plus its layout. An action refuses any slot that is not listed. | Owner answer D |
| D5 | **Upload path: our own picker, a signed `fetch`.** The browser checks the file's type and size (≤ 15 MB) first, calls `signCloudinaryUpload(slot)`, then posts the file as `FormData` straight to `https://api.cloudinary.com/v1_1/{cloud}/image/upload` with the returned parameters, then calls `attachMedia`. No Cloudinary script or iframe loads, and the upload never passes through a Vercel function (whose body limit is 4.5 MB). No client-side compression: Cloudinary serves `f_auto`/`q_auto` renditions, so the original's weight never reaches visitors, and 15 MB covers phone photos. | Owner answer E; MRU `media-upload.tsx` |
| D6 | **`signCloudinaryUpload(slot)`.** In order: `requireRole("editor")` → the rate limit (D9) → Zod (a listed slot) → it picks the **full public ID** itself, `{folder}/{env}/{random}` (e.g. `rhm/page/home-hero/preview/k3x9…`), so the client chooses neither folder nor name. It signs `public_id`, `asset_folder` (the same path without the random name, so the upload shows in that Media Library folder; the account uses dynamic folders, as `scripts/upload-seed-media.mts` does; added in the build), `timestamp` and `allowed_formats=jpg,png,webp,avif` with the API secret through the `cloudinary` SDK, and returns those values with the API key, the cloud name and the signature. Cloudinary rejects a signature more than an hour old. A signed upload can restrict formats but not size (Cloudinary docs, checked 2026-10-28), so the size is checked again in D9. `{env}` is `production`, `preview` or `local`, from `VERCEL_ENV`. | tech-stack *In-place CMS* 5; Cloudinary upload docs |
| D7 | **One row per page slot.** The migration adds a partial unique index on `MediaItem ("ownerId") WHERE "ownerType" = 'PAGE'`. *Amended in the build:* it is declared in `schema.prisma` (`@@unique(..., where: raw(...))`, the `partialIndexes` preview feature of Prisma 7.10), not only written by hand in the SQL, because an index missing from the schema shows as drift and the next `migrate dev` would drop it. A replace deletes the old row and creates the new one in one transaction, so a race fails on the index instead of leaving two rows. Gallery owners (Phase 29) keep many rows. | MRU ADR-016 (explicit slot, at most one cover enforced by the database) |
| D8 | **One cached read, tag `media`.** `readMediaSlots()` is a `"use cache"` read of the `PAGE` rows, with `cacheTag("media")` and `cacheLife("days")`; a failed read returns the failure result with `cacheLife("minutes")`, and every slot shows its default, as in Phase 27, D6. A save calls `updateTag("media")`. The homepage keeps its prerender marker. | Phase 27, D6; rule 13 |
| D9 | **`attachMedia(slot, publicId, alt)`.** In order: `requireRole("editor")` → the rate limit → Zod (a listed slot; alt trimmed, 1–150 characters, one line; `publicId` either the one now in force, for an alt-only save, or matching exactly `^{folder}/{env}/[A-Za-z0-9_-]+$` for this environment) → for a new upload, the Admin API `resource(publicId)` must show an image whose format is one of the four and whose `bytes` ≤ 15 MB, otherwise the upload is destroyed and the save refused → in one `$transaction`: read the old row, delete it, create the new one, `audit()` → `updateTag("media")` → destroy the old asset (D10). `removeMedia(slot)` follows the same guard, limit and check, deletes the row with its audit, refreshes, then destroys the asset; the slot shows its default. **Rate limit:** `rateLimit("media", userId, { max: 30, windowSec: 600 })`, one allowance shared by the three actions, checked after the guard. Results are `{ ok: true }` or `{ ok: false, error }` with generic messages, and the actions never throw to the client. Logic lives in `lib/media/attach-core.ts` and `sign-core.ts`, wired up in `lib/media/actions.ts` after `await requireRole(...)`, as in Phase 27. | tech-stack *In-place CMS* 5; Phase 27, D5, D8 (Claude's numbers; the owner can change them before "build it") |
| D10 | **Destroy and audit.** After the transaction commits, the old asset is destroyed with `uploader.destroy` (`invalidate: true`) **only if** its public ID sits under the slot's folder for the **current** environment. A default, a seed asset or another environment's upload is never destroyed: one Cloudinary cloud serves every environment, and a preview database branched from production would otherwise destroy production's images. A failed destroy is logged as `[media] destroy failed <publicId>` and the save still stands (Phase 36 surfaces these). Audit actions: `media.replace`, `media.alt` and `media.remove`, entity `MediaItem` / the slot key, with `diff: { before, after }` of `{ publicId, alt }` (the default's when there was no row), written in the same transaction as the change. | tech-stack *In-place CMS* 5; Phase 25, D5 |
| D11 | **Env, CSP and key.** `NEXT_PUBLIC_CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` join `lib/env.ts`, required on Vercel wherever `CMS_ENABLED=1` (Preview now, Production at Phase 34). The owner creates a **second API key used only by the site**, stored on Vercel Preview with the secret marked Sensitive. The local seed key in `.env.local` stays separate, so either can be rotated alone; the secret-rotation runbook gets a row for the site key. CI builds with placeholder values, because every Cloudinary call in CI is stubbed (D13). `connect-src` gains `https://api.cloudinary.com`, with its test in `lib/security/headers.test.ts`. | Owner answer G |
| D12 | **Two PRs.** **PR A** (this branch): the spec folder, the constitution changes, the migration, `slots.ts`, `readMediaSlots()`, and the hero layout with the stand-in default. Visitors see the new hero image; nothing is editable yet. **PR B** (a new branch from `develop` after PR A merges and `migrate-preview` has run): the env and CSP change, the actions, `<EditableImage>`, the e2e spec and the runbook. | Phase 27, D10; memory of Phases 12 and 19 |
| D13 | **Tests stub Cloudinary.** Vitest and database tests pass a fake Cloudinary client (`resource`, `destroy`) and a fixed secret to the cores. preview-e2e routes `api.cloudinary.com` to a local stub with `page.route()`, so CI never spends credits or leaves assets. The preview's server has no editor session in e2e, so e2e covers the dialog and the refused save, as Phase 27 did. A real upload is tested only in the owner's preview check. | Owner answer H |
| D14 | **Manual checks:** the owner's real replace on PR B's preview, then `scripts/media-check.mts` (Admin API `resource`) shows the old public ID is gone; a replace from the owner's phone; and mobile Lighthouse on `/` at 90 or above with the hero image. No NVDA pass this phase. | Owner answer I |

### Owner answers (2026-10-28)

- **A** Hero layout: the image beside the text (4:5), stacked under it on mobile.
- **B** Before any upload: a default photo of the owner's.
- **C** Controls: replace, alt text and remove.
- **D** Slots: the homepage hero only.
- **E** Upload path: a plain file picker and a signed `fetch`.
- **F** Default photo: a stand-in now; the owner's photo before the release.
- **G** Credentials: a new API key used only by the site.
- **H** Tests: stub Cloudinary in CI; real uploads only on the preview.
- **I** Manual checks: a phone upload and Lighthouse on `/`, besides the real replace.

## Constraints

- **C1 — Static pages.** Every public route keeps its `○` / `◐` marker from `develop` in both PRs. `<EditableImage>` reads edit state only from `useEditMode()`, and nothing on a public page reads the session on the server.
- **C2 — No new dependency.** `cloudinary` 2.11.0 moves from `devDependencies` to `dependencies`, as `tech-stack.md` already plans. The dialog is native `<dialog>`, and the upload is `fetch`.
- **C3 — Visitor HTML.** Apart from the new hero image in PR A, visitor markup matches `develop`. No ✎, dialog or `data-` hook ships in visitor HTML.
- **C4 — Guarded.** The CI unguarded-action scan passes with no new allowlist entry.
- **C5 — Secrets.** The API secret is read only on the server and never sent to the browser; only the signature is. Nothing secret goes in a `NEXT_PUBLIC_*` variable (the API key is not secret).
- **C6 — Owner steps** are marked **(owner)** in `plan.md`: the site API key, Vercel variables, merges, the photo and the preview checks.
