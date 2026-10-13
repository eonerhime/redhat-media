# Validation — Phase 8 Media rendering

## Roadmap success check ("Done when", verbatim)

> A test page shows an optimised image, and a video that loads its iframe only on click. Parser tests cover every accepted URL shape and reject the others.

- [ ] **Optimised image:** `e2e/media.spec.ts` passes. The hero image comes from `res.cloudinary.com/{cloud}` with `f_auto` and `q_auto`, has at least 3 `srcset` widths and a `sizes` value, is preloaded, shows a `data:` blur placeholder and loads. The second image is lazy (D5, D12).
- [ ] **Preview look:** on the Vercel preview, `/dev/media` shows the sample photo sharp at mobile and desktop widths, with the blur visible on a throttled reload (owner check)
- [x] **Video on click:** the e2e test shows no request to `youtube-nocookie.com` or `player.vimeo.com` and no iframe before a click, and exactly one iframe after a click or Enter, with focus inside it (D9, D12)
- [ ] **Videos play:** on the preview, both the YouTube and the Vimeo video play after one click (owner check)
- [x] **Parser:** `video-url.test.ts` covers every shape D7 accepts and every class it rejects, each rejection with its message (D7)

## Security

- [ ] **Fetched URL restricted:** a `res.cloudinary.com/{cloud}/image/fetch/https://…` request is refused (D2)
- [ ] **Cloudinary 2FA:** the console sign-in uses 2FA (owner check)
- [ ] **No Cloudinary secret anywhere:** `vercel env ls` shows `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` only, and gitleaks is green (C3)
- [x] **Public IDs only:** unit tests show that `<MediaImage>`'s check rejects full URLs and IDs outside `rhm/{portfolio_item|service|page}/…` (D6)
- [x] **Fixed endpoints only:** the thumbnail tests show that a non-`i.vimeocdn.com` or `http:` thumbnail is dropped and that a failed fetch falls back. A code read confirms that the only server fetches are the two in C4 (D8).
- [x] **Dev page not public:** the unit test shows that `isDevPagesEnabled` is false for `VERCEL_ENV=production`, and the e2e test finds the `noindex` meta (D11)
- [x] **CSP clean:** the e2e test records no report-only CSP violation on `/dev/media` (D12)
- [x] **Lint guards:** a throwaway direct `next-cloudinary` import and a throwaway `<iframe>` outside the facade each fail `pnpm lint` (made as uncommitted edits, then reverted) (D10)

## Quality gates

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass locally
- [ ] `pnpm test:e2e --workers=1` passes locally, with the existing specs unchanged (C5)
- [ ] CI is green on the PR (`ci`, `db`, `gitleaks`, `preview-headers`, Vercel)
- [x] The build route table matches `develop` plus `/dev/media` (C2)

## Spec hygiene

- [x] The `tech-stack.md`, `roadmap.md` and `CLAUDE.md` amendments are in the same PR
- [ ] Every `plan.md` box is ticked, and `implementation.md` records any deviations
