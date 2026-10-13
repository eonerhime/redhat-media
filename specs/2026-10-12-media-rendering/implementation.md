# Implementation log — Phase 8 Media rendering

## Log

- **2026-10-12** — Branch `feature/phase-08-media-rendering` from `develop` at `98035f5`.
  - Phase 7's last validation box ("Migrations from CI only") is ticked: `develop` push run 38300618439 passed `ci`, `db`, `gitleaks` and `migrate-preview`.
  - Spec drafted, waiting for owner approval. Docs read through ctx7: `next-cloudinary` (`CldImage`, placeholders, App Router use), Next.js `next/image` (`blurDataURL`, `preload`) and Cloudinary *Folder modes in integrations*. `npm view` shows that `next-cloudinary@6.19.3` is `latest` (published 2026-09-17), with peers `next ^16` and `react ^19`.

- **2026-10-13** — Owner approved the spec and created the Cloudinary account (cloud `lezxe6hz`, which resolves). Sample videos: Big Buck Bunny on YouTube and Vimeo (CC BY 3.0, both checked through oEmbed). Committed the spec and the Phase 7 tick (`eec8c3e`).
  - Constitution amendments (plan 0.1–0.3), `next-cloudinary@6.19.3` exact (`pnpm audit --prod`: no known vulnerabilities; no build scripts requested), env rule, `.env.example`, `ci.yml`.
  - `lib/media/`: `video-url.ts` (81 table tests), `cloudinary.ts`, `fetch-capped.ts` (shared timeout + no-redirect + byte cap), `blur-core.ts` / `blur.ts`, `video-thumbnail-core.ts` / `video-thumbnail.ts`; `lib/dev-pages.ts`. Unit suite: 599 passed.
  - `components/media/`: `cld-image.tsx`, `media-image.tsx`, `video-embed.tsx`, `video-facade.tsx`. `app/(dev)/` layout and `/dev/media`.
  - Lint guards: throwaway files in `app/` and `lib/` importing `next-cloudinary`, and an `<iframe>` in `components/`, each failed `eslint` with the custom message; the files were deleted.
  - **Plan 3.4:** the built `/dev/media` HTML has `<link rel="preload" as="image" imageSrcSet=…>` with `f_auto`/`q_auto` Cloudinary URLs, and the hero `<img>` has `fetchPriority="high"` and no `loading`. The second image has `loading="lazy"`. Thumbnails render from `i.ytimg.com` and `i.vimeocdn.com`; the robots meta is `noindex, nofollow`.
  - Route table: `develop` plus `/dev/media` (revalidate 1m / expire 1h while the blur lookup fails; it becomes static once the sample photo exists).
  - e2e (`--workers=1`): 196 passed, 2 failed. Both failures are the hero tests that need the sample photo in Cloudinary (`naturalWidth` 0, no blur placeholder).

## Deviations

- **Env name:** the owner had put the cloud name in `.env.local` as `CLOUDINARY_CLOUD_NAME`; renamed in place to `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (one line edited, no other values read).
- **D5, no `format` prop:** `CldImage` passed `format="auto"` through to the `<img>` as a stray attribute. It already adds `f_auto` by default, so the prop was dropped (spec amended).
- **D5 / D8, failure caching:** the first build failed because an error thrown inside a `"use cache"` function fails the prerender even when the caller catches it. Both helpers now return the failure, cached with `cacheLife("minutes")` (Next docs: conditional `cacheLife`, via ctx7), and successes keep `"max"` / `"weeks"` (spec amended).
- **D5, `onError`:** with a missing image, `CldImage` retried by polling `res.cloudinary.com` with `fetch()`, which the e2e CSP check caught as a `connect-src` violation. The client wrapper passes an `onError` that returns `false` (spec amended).
- **D12:** the e2e also stubs `i.vimeocdn.com`, and the blur check reads the server HTML, because `next/image` clears the placeholder style once the image loads.
- `Env` gains `vercelEnv`, which `isDevPagesEnabled` reads.

## Issues and fixes

- `pnpm add` failed once on Windows with `os error 183` (directory already exists) while linking `@cloudinary/url-gen`; a retry succeeded.
- e2e: splitting `srcset` on commas broke on Cloudinary URLs (`c_fill,w_640,…`); split only before each `https:`.
- **Fetched URL not restricted (fixed):** on 2026-10-13 a fresh `res.cloudinary.com/lezxe6hz/image/fetch/<wikimedia URL>` returned 200 (`desc=miss`). The owner re-ticked and saved the setting; the same kind of request then returned `401` with `X-Cld-Error: Images of type fetch are restricted in this account`.
- **Sample photo (done):** the owner first dropped the logo, then an Unsplash photo (Claudio Testa, 5184×3240), into `public/`; neither was committed, and both were deleted at the owner's request. The console upload first landed with the public ID `sample` (dynamic folders do not prefix the folder), then the owner set it to `rhm/page/dev-media/sample`. `fl_getinfo` confirms 5184×3240, and the blur rendition is a 348-byte JPEG.
- After the photo: `pnpm build` shows `/dev/media` as static (1w / 30d), and `pnpm test:e2e --workers=1` passes 198/198.
- **Vercel env (done):** the owner asked me to run `vercel env add`. Production took the documented form. For Preview, CLI 54.4.1 kept asking for a branch (`git_branch_required`) even with none given, until an explicit empty branch `""` was passed. `vercel env ls` now lists `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` on Preview and Production, beside `DATABASE_URL` and `RATE_LIMIT_SALT` (Preview); there is no Cloudinary key or secret.
