# Plan — Phase 8 Media rendering

Scope, decisions (D1–D12) and constraints (C1–C5) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 0. Constitution first

- [ ] 0.1 `specs/tech-stack.md`: the Media pin, the `i.ytimg.com` correction and Vimeo host rule, the Cloudinary hardening row and the Environment variables edits listed in the spec.
- [ ] 0.2 `specs/roadmap.md`: Phase 14 (sitemap excludes `/dev/*`) and Phase 16 (`/dev/*` returns 404 in production).
- [ ] 0.3 `CLAUDE.md`: the `<MediaImage>` / `<VideoEmbed>` rule.

## 1. Dependency and env

- [ ] 1.1 Install `next-cloudinary@6.19.3` (exact). Check `pnpm audit --prod` and any build scripts it asks for.
- [ ] 1.2 `lib/env.ts` and `lib/env.test.ts`: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` format, required on preview and production, `env.cloudinaryCloudName` (D4).
- [ ] 1.3 `.env.example`: the cloud name, with a comment saying it is public and that the key and secret come in Phases 9 and 28.
- [ ] 1.4 `ci.yml`: the cloud name as a plain job `env:` value for the build and e2e steps (D4).

## 2. Video parser and thumbnails

- [ ] 2.1 `lib/media/video-url.ts`: `parseVideoUrl`, `videoEmbedUrl`, `youtubeThumbnailUrl`, plus a type test that the providers match Prisma's `VideoProvider` (D7).
- [ ] 2.2 `lib/media/video-url.test.ts`: the accepted and rejected tables (D7, D12).
- [ ] 2.3 `lib/media/video-thumbnail-core.ts` (injected `fetch`) and `video-thumbnail.ts` (`server-only`, `"use cache"`) (D8).
- [ ] 2.4 `lib/media/video-thumbnail-core.test.ts` (D12).

## 3. Images

- [ ] 3.1 `lib/media/cloudinary.ts`: `isRhmPublicId` and the allowed aspect ratios (D5, D6), with tests.
- [ ] 3.2 `lib/media/blur-core.ts` and `blur.ts` (`server-only`, `"use cache"`, `cacheLife("max")`), with tests (D5).
- [ ] 3.3 `components/media/cld-image.tsx` (`"use client"` re-export) and `components/media/media-image.tsx` (server) (D5).
- [ ] 3.4 Confirm in the built HTML that `preload` produces a preload link and `fetchpriority="high"` through `CldImage`. Record the result in implementation.md.

## 4. Video facade

- [ ] 4.1 `components/media/video-embed.tsx` (server: poster resolution) (D8, D9).
- [ ] 4.2 `components/media/video-facade.tsx` (client: link, click and Enter handling, iframe, focus, reduced motion) (D9).

## 5. Guards

- [ ] 5.1 `eslint.config.mjs`: the `next-cloudinary` import restriction and the `iframe` restriction (D10). Prove that each one fires on a throwaway file, then revert it.

## 6. Test page

- [ ] 6.1 `lib/dev-pages.ts`: `isDevPagesEnabled(env)`, with tests (D11).
- [ ] 6.2 `app/(dev)/layout.tsx` (noindex, production 404) and `app/(dev)/dev/media/page.tsx` (D11).

## 7. End-to-end

- [ ] 7.1 `e2e/media.spec.ts`, with the routed stubs for the player hosts and `i.ytimg.com` (D12).
- [ ] 7.2 The full `pnpm test:e2e` locally with `--workers=1`.

## 8. Owner setup and preview

- [ ] 8.1 The owner completes *Owner setup* steps 1–5. I add the env var to Vercel Preview and Production (step 6).
- [ ] 8.2 Check `res.cloudinary.com/{cloud}/image/fetch/…` is refused (D2).
- [ ] 8.3 `vercel env ls` lists the cloud name and no Cloudinary key or secret (names only).

## 9. Verify and open the PR

- [ ] 9.1 Work through every item in [`validation.md`](validation.md).
- [ ] 9.2 Push the branch and open the PR `feature/phase-08-media-rendering` → `develop`.
