# Implementation log — Phase 28 Image upload & replace

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

## Progress

- **2026-10-28** — Branch `feature/phase-28-image-upload` created from `develop` at `fa0ad0c`. Before the interview: MRU's ADR-016, ADR-021, `media-upload.tsx`, `hero-image-manager.tsx` and a profile template were read, along with our `hero.tsx`, `<MediaImage>`, `lib/media/cloudinary.ts`, the `MediaItem` model and `update-core.ts`. The Cloudinary docs (ctx7, `/websites/cloudinary`) confirm that a signed upload can restrict formats but has no per-upload size limit. Owner answers A–I given; spec, plan and validation written.
- **2026-10-28** — Owner approved the build ("build it") and added the site's own Cloudinary key and secret to Vercel Preview (plan 6.1). PR A built (plan 1–5.1):
  - Constitution: `tech-stack.md` *Core* → Media: images, *Architectural rules* 12, the CSP row, *In-place CMS* 5, *Schema decisions* (the `MediaItem` row) and *Environment variables* (the paragraph and the `.env` block comment). `README.md` needed no change: its tree comments already name image editing under `components/cms/` and Cloudinary signing under `lib/media/`.
  - Migration `20261028010000_media_page_slot`: `CREATE UNIQUE INDEX "MediaItem_page_slot_key" ON "MediaItem"("ownerId") WHERE ("ownerType" = 'PAGE')`, applied on Neon `dev`. It is additive and needs no grants (an index on an existing table). After it, `prisma migrate diff` from `dev` to the schema is empty.
  - Cloudinary docs (ctx7, `/websites/cloudinary`, *Folder modes in integrations*): a `public_id` with slashes is the whole public ID in either folder mode. In dynamic folder mode the slashes do not place the asset, so `asset_folder` is passed too. The account uses dynamic folders: `scripts/upload-seed-media.mts` already passes both. D6 now signs `asset_folder` as well (plan 2.2).
  - `lib/media/slots.ts` (`MEDIA_SLOTS`, `home.hero` with the stand-in default `rhm/page/dev-media/sample`, a stock landscape, alt "Green rolling hills and trees under an evening sky"), `read-core.ts` (`fetchMediaSlots`, `resolveSlot`) and `read.ts` (`readMediaSlots`, tag `media`; `mediaSlot()`). Tests: `slots.test.ts`, `read-core.test.ts`, `read-core.db.test.ts` (the second `PAGE` row for a slot is refused; a delete and create in one transaction swaps it; a portfolio owner keeps two rows).
  - `components/home/hero.tsx`: a `lg:grid-cols-[3fr_2fr]` grid, with the image in a `rounded-xl` frame, `<MediaImage aspect="4/5" preload>`.
  - Local checks: `tsc` and ESLint clean, Prettier clean, `vitest run` 57 files and 1,896 tests. `pnpm test:db` runs in CI (no local test database).
  - `CMS_ENABLED= DATABASE_URL= next build` passes and logs `[media] read failed: DATABASE_URL is not set`, so the hero falls back to the default (D8). The top-level public routes keep their markers from `develop` run 40686660307 (`/`, `/about`, `/contact`, `/privacy`, `/services` `○`; `/portfolio` `◐`; all `1m / 1h` without a database, as on `develop`) (C1).
  - Screenshots of `/` from `next start` with Edge (plan 4.2), measured with Playwright. No width scrolls sideways (`scrollWidth` = viewport):
    - 360px: the image is 326 × 408 under the button (y 496), served at `w_384,h_480`.
    - 768px: 446 × 558 (the `max-w-md` cap), left-aligned under the button, served at `w_640,h_800`.
    - 1440px: 408 × 510 in the right column, centred vertically against the text, served at `w_640,h_800`.
  - Playwright against that build (`PW_BASE_URL=http://localhost:3100`, `PW_CHANNEL=msedge`): 435 passed, 124 skipped (the CMS-on and preview-only cases), 0 failed. This covers layout, contrast, axe and reduced motion on `/`.
  - `CMS_ENABLED=1 next build` (a random `BETTER_AUTH_SECRET`, no database) passes. The top-level markers match the CMS-off build, except `/admin` at `◐`. A CMS-on build of `develop` at `fa0ad0c` gives the same `◐`; CI's one build runs with the CMS off, which is why its table shows `○`.

## Deviations from plan

- **D7 amended:** the partial index is declared in `schema.prisma` (`@@unique([ownerId], map: "MediaItem_page_slot_key", where: raw(...))`, the `partialIndexes` preview feature of Prisma 7.10.1) instead of only in hand-written SQL. Prisma's docs (ctx7, `/websites/prisma_io`) support `where` on `@@unique` behind that flag. An index the schema does not declare shows as drift, and the next `migrate dev` would drop it.
- **The migration was generated with `prisma migrate diff`**, not `migrate dev --create-only`. `migrate dev` stops at its "unique constraint … if there are existing duplicate values" prompt, which a non-interactive shell can't answer. The SQL is the diff's output.
- **`sizes` for `home.hero`** is `(min-width: 1152px) 440px, (min-width: 1024px) 40vw, (min-width: 480px) 448px, 100vw`, not D1's `(min-width: 1024px) 40vw, 100vw`. Below `lg` the image is capped at `max-w-md` (448px): a full-width 4:5 image would have been 960px tall at 768px. Above the 72rem container, the column stops growing at about 440px.
- **`next-cloudinary` removal added to PR B (plan 6.4):** after the Phase 16 amendment, nothing imports it except the upload widget this phase doesn't use. Removing it also clears the GHSA-mrhx-c7xc-m3w5 ignore, whose stated removal condition is that `next-cloudinary` moves off zod 3.

## Issues and fixes
