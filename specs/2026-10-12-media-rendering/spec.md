# Phase 8 — Media rendering

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 1, Phase 8
- **Branch:** `feature/phase-08-media-rendering` (from `develop` at `98035f5`)
- **Started:** 2026-10-12
- **Status:** approved by the owner, 2026-10-13

## What and why

Build the two rendering primitives that every later media phase uses, before any real content needs them:

- **`<MediaImage>`**: a Cloudinary image with responsive sizes, automatic format and quality, and a blur placeholder;
- **`<VideoEmbed>`**: a YouTube or Vimeo video shown as a thumbnail facade, which loads its `<iframe>` only on click;
- **`parseVideoUrl()`**: the single parser that decides which video links are accepted. Phase 30's `attachVideo` reuses it unchanged.

It also sets up the Cloudinary account and its folders and security settings, plus a test page that is not public and proves the primitives work on a Vercel preview.

Phases 9 (seed), 10–12 (portfolio grid and detail) and 28–30 (CMS media) all render through these components. Getting performance (tech-stack *Architectural rules* 11) and the "no fetches to user-supplied URLs" rule right once, here, means later phases inherit both.

## Constitution sections this phase relies on

- `mission.md` → *Guiding principles* 2 (the site is the proof), 6 (small, verifiable steps) and 9 (secure from the first commit)
- `tech-stack.md`:
  - *Core* → the *Media: images* (`next-cloudinary` 6.19) and *Media: video* rows;
  - *Architectural rules* 1 (server-first; video facades are client components), 11 (performance budget: LCP image prioritised, others lazy, no iframe before a click) and 12 (CSP `img-src` / `frame-src`);
  - *Security baseline* → "No fetches to user-supplied URLs" (phases 8 / 30);
  - *In-place CMS* 5–6, which define the folder convention and the accepted video URL shapes;
  - *Environment variables*.
- `roadmap.md` → Phase 8; open question 4 (media assets); Phases 9, 12, 14, 28 and 30, which build on this phase.
- `README.md` → the `lib/media/` folder ("Cloudinary signing utility and video provider metadata parsers"), and the `MediaItem` model with its `VideoProvider` enum.

## Owner answers

Given 2026-10-13:

1. **Spec approved** as drafted.
2. **Cloudinary account created.** The cloud name is `lezxe6hz`; it resolves (`res.cloudinary.com/lezxe6hz/image/upload/samples/…` returns 200).
3. **Security settings and folders done** (*Owner setup* 2–3).
4. **Sample photo: pending.** The owner is choosing one. It is uploaded through the Cloudinary console, not committed to `public/`, because uploading from code needs the API secret (C3).
5. **Videos:** use free sample videos. Both are the Blender Foundation's *Big Buck Bunny* (CC BY 3.0), checked through each provider's oEmbed endpoint on 2026-10-13:
   - YouTube: `https://www.youtube.com/watch?v=aqz-KE-bpKQ`
   - Vimeo: `https://vimeo.com/1084537` (its thumbnail is on `i.vimeocdn.com`, as D8 requires)

## Scope

1. **Cloudinary account** (D1, D2): the owner creates a Free account with 2FA, restricts *Fetched URL* delivery, and creates the folders `rhm/portfolio_item`, `rhm/service` and `rhm/page`. One sample photo is uploaded as `rhm/page/dev-media/sample`.
2. **Dependency** (D3): `next-cloudinary` pinned at `6.19.3`. The server `cloudinary` SDK is **not** added; it comes with the Phase 9 seed.
3. **Env** (D4): `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` joins `lib/env.ts`. It is required on Vercel `preview` and `production`, and it is not a secret.
4. **`<MediaImage>`** (D5, D6): server component `components/media/media-image.tsx`, which wraps a `"use client"` `CldImage` re-export. It takes a public ID, alt text, an aspect ratio, `sizes` and an optional `preload`, and fetches a ≤ 10 px blur placeholder on the server.
5. **Video parser** (D7): `lib/media/video-url.ts` → `parseVideoUrl(input)`, `videoEmbedUrl(video)` and `youtubeThumbnailUrl(id)`. These are pure functions with a table-driven unit test.
6. **Video thumbnails** (D8): `lib/media/video-thumbnail.ts` (server-only). YouTube thumbnails are derived from the video ID. Vimeo thumbnails come from Vimeo's fixed oEmbed endpoint, and the result is cached and validated.
7. **`<VideoEmbed>`** (D9): server component `components/media/video-embed.tsx`, which resolves the poster, plus client component `components/media/video-facade.tsx`, which swaps the poster for the `<iframe>` on click.
8. **Lint** (D10):
   - `next-cloudinary` may be imported only inside `components/media/**`;
   - a JSX `<iframe>` is allowed only in `video-facade.tsx`.
9. **Test page** (D11): `/dev/media` shows a preloaded image, a lazy image, a YouTube video and a Vimeo video. It is `noindex`, and it returns 404 when `VERCEL_ENV=production`.
10. **Tests** (D12): unit tests for the parser, thumbnails, blur helper, public-ID check, env rule and dev-page gate, plus a Playwright spec for `/dev/media`.
11. **Docs**: `.env.example`, `CLAUDE.md` and the constitution changes listed below.

## Constitution changes (in this PR, before the code)

- **`tech-stack.md`:**
  - *Core → Media: images:* pin `next-cloudinary` at `6.19.3` (7.x is still in beta). The `cloudinary` SDK pin stays, and it is installed in Phase 9.
  - *Security baseline → No fetches to user-supplied URLs:* correct `img.youtube.com` to **`i.ytimg.com`**, the host the CSP already allows. Also add "Vimeo thumbnails must be `https://i.vimeocdn.com`" (D8).
  - *Security baseline:* add a row for **Cloudinary hardening**: *Fetched URL* delivery restricted, console 2FA, and public IDs limited to `rhm/…` (D2, D6). Phase 8.
  - *Environment variables:* `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is required on Vercel from Phase 8. `NEXT_PUBLIC_CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` arrive in Phase 9 (local seed only) and Phase 28 (Vercel) (D4).
- **`roadmap.md`:** the Phase 14 row gains "the sitemap excludes `/dev/*`", and the Phase 16 row gains "confirm `/dev/*` returns 404 in production" (D11).
- **`CLAUDE.md`** → *Rules that are easy to break:* images go through `<MediaImage>` and videos through `<VideoEmbed>`; lint enforces both (D10).

## Out of scope

- Uploads, `signCloudinaryUpload`, `attachMedia`, `destroy`, and the server `cloudinary` SDK (Phases 9 and 28).
- `attachVideo`, and storing video thumbnails in `MediaItem` (Phase 30).
- Galleries, the lightbox and uncropped images (Phase 12).
- `VideoObject` JSON-LD (Phase 12).
- Seed content and real portfolio media (Phase 9; open question 4).
- Enforcing the CSP (Phase 14). Its report-only `img-src` and `frame-src` already cover everything this phase loads.
- Vimeo unlisted links (`vimeo.com/{id}/{hash}`), YouTube playlists, `/live/` links and start times (`t=`) (D7).
- Cloudinary *strict transformations* (D2).

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **Cloudinary Free plan, created under the owner's own account, with 2FA.** The cloud name is chosen once, because it appears in every image URL. It is public, so it may be shared in chat; the API secret is never shared. | Free gives 25 monthly credits, which a brochure site with cached derived images fits easily. The cloud name cannot be renamed later without changing every URL. | `tech-stack.md` → *Core*; open question 9 |
| D2 | **Account hardening.**<br>• **Security → Restricted media types: tick *Fetched URL*.** This stops anyone from using our cloud as an open image proxy for third-party URLs, which would spend our credits and serve their content under our name.<br>• No *allowed fetch domains*, and no auto-upload mapping.<br>• **Strict transformations stay off.** `CldImage` asks for a different width for each `srcset` entry, and strict mode would need every one allow-listed in advance. Phase 34 revisits this.<br>• **Folders:** `rhm/portfolio_item`, `rhm/service` and `rhm/page`, which match `rhm/{ownerType}/{ownerId}` (*In-place CMS* 5). New accounts use *dynamic folders*, where the asset folder and the public ID are separate. **The public ID is the contract:** every public ID starts with its folder path. Phase 28 enforces this when it signs uploads. | The Fetched URL restriction closes the only delivery path that takes an outside URL. A single, fixed folder rule keeps Phase 28's "folder check before attaching" simple. | Cloudinary docs → *Folder modes in integrations* (ctx7, 2026-10-12); `tech-stack.md` → *In-place CMS* 5 |
| D3 | **`next-cloudinary@6.19.3`, exact pin.** Its peer ranges include Next 16 and React 19. It was published on 2026-09-17, more than two weeks ago, and it is npm's `latest`. 7.0 is still in beta. | It is the library `tech-stack.md` names. `CldImage` wraps `next/image` with a Cloudinary loader, so images skip Vercel's optimiser (no Vercel image quota) and get `f_auto`/`q_auto` and responsive widths from Cloudinary. | `npm view next-cloudinary`, 2026-10-12 |
| D4 | **Env rule** (`lib/env.ts`, unit-tested):<br>• `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` must match `^[a-z0-9][a-z0-9_-]{0,63}$`.<br>• It is **required when `VERCEL_ENV` is `preview` or `production`**, and optional elsewhere.<br>• It is exposed as `env.cloudinaryCloudName`. `<MediaImage>` throws a clear error when it is unset.<br>• CI sets it as a plain `env:` value in `ci.yml`, because it is public and Dependabot runs cannot read secrets or variables.<br>• The API key and secret are **not** added in this phase. | A variable becomes required in the phase that first uses it. Passing the validated value down from the server means the client never reads `process.env` itself. | `tech-stack.md` → *Environment variables* |
| D5 | **`<MediaImage>` props:** `publicId`, `alt` (required; pass `""` only for decorative images), `aspect` (`"16/9"`, `"4/3"`, `"3/2"`, `"1/1"`, `"3/4"` or `"4/5"`), `sizes` (required), `preload?` and `className?`.<br>• It renders `CldImage` with `width` 1600, `height` from the aspect, `crop="fill"`, `gravity="auto"`, `quality="auto"`, and `config={{ cloud: { cloudName } }}`. `CldImage` adds `f_auto` by default; a `format` prop is not passed, because it leaks onto the `<img>` as an attribute (amended 2026-10-13).<br>• The `"use client"` wrapper passes an `onError` that returns `false`. That stops `CldImage` polling `res.cloudinary.com` with `fetch()` after a failed load (meant for assets still processing after an upload), which would break `connect-src 'self'` (amended 2026-10-13).<br>• `preload` maps to Next 16's `preload` prop, which replaced `priority`, and adds `fetchPriority="high"`. Every other image is lazy (the `next/image` default).<br>• **Blur:** the server fetches the same crop at `w_10`, `q_auto:low`, `f_jpg` with a 5 s timeout, `redirect: "error"`, an `image/*` content type and a 4 KB cap, and passes it as a base64 `blurDataURL`. The helper is a `"use cache"` function, keyed by public ID and aspect: a success gets `cacheLife("max")`. If the fetch fails, the image renders with no placeholder, a warning is logged with the public ID, and the failure is cached with `cacheLife("minutes")` so the page regenerates and retries. (Throwing inside a `"use cache"` function fails the prerender even when the caller catches it; amended 2026-10-13.) | A fixed set of aspect ratios lets Cloudinary crop to the slot. That avoids layout shift without storing image dimensions; `MediaItem` has no width or height columns. Phase 28 replaces an image by uploading a new public ID, so a cache that never expires stays correct. Next recommends a placeholder of 10 px or less. The fetch goes only to our own cloud, with our own public IDs. | `next-cloudinary` docs → *Placeholders* (ctx7, 2026-10-12); Next.js docs → `next/image` `blurDataURL`, `preload` (ctx7, 2026-10-12); `tech-stack.md` → *Architectural rules* 11 |
| D6 | **Public IDs are checked before rendering.** `isRhmPublicId(id)` accepts only `^rhm/(portfolio_item\|service\|page)/[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+)*$`. `<MediaImage>` throws on anything else, including full URLs. | `CldImage` also accepts full remote URLs, which would turn it into a fetch proxy. Together with D2, only our own uploads can render. | `tech-stack.md` → *Security baseline* |
| D7 | **`parseVideoUrl(input)` returns `{ ok: true, video: { provider, id, canonicalUrl } }` or `{ ok: false, error }`.**<br>• **Input:** it is trimmed and capped at 2,048 characters, and `https://` is added when no scheme is given. Only `https:` is accepted: no other scheme, no credentials and no port. The host must match exactly, case-insensitively.<br>• **YouTube** (`provider: "YOUTUBE"`), with an ID matching `^[A-Za-z0-9_-]{11}$`:<br>&nbsp;&nbsp;– `youtube.com`, `www.youtube.com` and `m.youtube.com` → `/watch?v={id}`, `/shorts/{id}` and `/embed/{id}`;<br>&nbsp;&nbsp;– `youtu.be/{id}`;<br>&nbsp;&nbsp;– `www.youtube-nocookie.com/embed/{id}`.<br>• **Vimeo** (`provider: "VIMEO"`), with an ID matching `^[0-9]{1,12}$`: `vimeo.com/{id}`, `www.vimeo.com/{id}` and `player.vimeo.com/video/{id}`.<br>• A trailing slash and extra query parameters (`si`, `t`, `share`, `feature`) are allowed and **dropped**.<br>• **Rejected, each with a specific message:** other hosts (including look-alikes such as `youtube.com.evil.example`), playlists, channels, `/live/`, Vimeo unlisted hashes, showcases and channels, and a malformed ID.<br>• **Canonical URLs:** `https://www.youtube.com/watch?v={id}` and `https://vimeo.com/{id}`.<br>• `provider` uses the Prisma `VideoProvider` values, and a type test keeps them in step.<br>`videoEmbedUrl()` returns `https://www.youtube-nocookie.com/embed/{id}?autoplay=1&rel=0` or `https://player.vimeo.com/video/{id}?autoplay=1&dnt=1`. | These are exactly the shapes *In-place CMS* 6 lists, plus the no-cookie embed (our own embed form). An exact host match and a strict ID pattern mean every output URL is built from fixed parts. Vimeo unlisted links need their hash in the embed URL, and `MediaItem` has no field for it. Dropping `t` keeps the stored form canonical. | `tech-stack.md` → *In-place CMS* 6, *Security baseline* |
| D8 | **Thumbnails come only from fixed endpoints.**<br>• **YouTube:** `https://i.ytimg.com/vi/{id}/hqdefault.jpg`, built from the ID with no fetch. `hqdefault` exists for every video; `maxresdefault` can 404.<br>• **Vimeo:** `getVimeoThumbnail(id)` (`server-only`, `"use cache"`, `cacheLife("weeks")`) fetches `https://vimeo.com/api/oembed.json?url=https%3A%2F%2Fvimeo.com%2F{id}&width=1280`, with a 5 s timeout and `redirect: "error"`. Zod validates the JSON, and `thumbnail_url` must be `https://i.vimeocdn.com/…`; anything else gives `null`, cached with `cacheLife("minutes")` so it is retried (amended 2026-10-13).<br>• **Fallback:** an optional custom poster (`posterPublicId`, rendered with `<MediaImage>`) takes precedence. With no poster and no thumbnail, a branded placeholder is shown.<br>• The logic takes `fetch` as a parameter (`video-thumbnail-core.ts`), so the unit tests need no network, the same split as the Phase 7 limiter. | It meets "video handling extracts the ID and calls only fixed endpoints". The host check keeps the rendered `<img>` inside the CSP's `img-src`, even if Vimeo's answer changed. | `tech-stack.md` → *Security baseline*; CSP in `lib/security/headers.ts` |
| D9 | **The facade.**<br>• `<VideoEmbed video title posterPublicId? />` (server) resolves the poster and renders `<VideoFacade>` (client).<br>• **Before a click:** an `<a href={canonicalUrl} target="_blank" rel="noopener noreferrer">` inside a 16:9 box, with the poster (`object-cover`), a red play button (at least 44 px, visible focus ring) and the accessible name "Play video: {title}". Without JavaScript, the link opens the video on YouTube or Vimeo.<br>• **On click** (no modifier keys, primary button) or Enter: `preventDefault`, then the anchor is replaced by `<iframe src={videoEmbedUrl} title={title} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin">`, and focus moves into the frame. A ctrl- or middle-click keeps the browser's default and opens a new tab.<br>• The poster is a plain `<img loading="lazy" decoding="async">`, with an inline lint exception that gives the reason. Third-party thumbnails cannot go through Cloudinary (*Fetched URL* is restricted, D2) and should not use Vercel's optimiser.<br>• No `sandbox` attribute. The frames are cross-origin and limited to two hosts by `frame-src`, and sandboxing breaks YouTube playback controls.<br>• Hover zoom is turned off under `prefers-reduced-motion`. | No iframe and no third-party script loads before a click (*Architectural rules* 11). With the no-cookie and `dnt=1` hosts, nothing tracks a visitor who never presses play. Starting from a link keeps the video reachable without JavaScript. YouTube rejects embeds that send no referrer. | `tech-stack.md` → *Architectural rules* 11, 12; *In-place CMS* 6 |
| D10 | **Lint guards** (`eslint.config.mjs`):<br>• `no-restricted-imports`: `next-cloudinary` may be imported only inside `components/media/**`.<br>• `no-restricted-syntax`: a JSX `iframe` element is allowed only in `components/media/video-facade.tsx`. | Every image then gets the public-ID check and the blur placeholder, and no page can add an iframe that loads eagerly. | — |
| D11 | **`/dev/media` test page.**<br>• It lives in the route group `app/(dev)/`, whose layout sets `robots: { index: false, follow: false }` and calls `notFound()` when `VERCEL_ENV === "production"`. The check is `isDevPagesEnabled(env)`, which is unit-tested.<br>• It is statically rendered. Its copy is fixed developer text, not `block()` keys, because the page is not public content.<br>• Contents:<br>&nbsp;&nbsp;– a preloaded 16:9 `<MediaImage>`;<br>&nbsp;&nbsp;– a spacer, then a lazy 4:3 image of the same asset;<br>&nbsp;&nbsp;– one YouTube and one Vimeo `<VideoEmbed>`, using URLs the owner supplies.<br>• Phases 9–12 can reuse it as a fixture page. | The roadmap's "Done when" needs a page on the preview. Production never serves it, and search engines never index it. | Roadmap Phase 8 "Done when" |
| D12 | **Tests.**<br>• **Unit (Vitest):**<br>&nbsp;&nbsp;– `video-url.test.ts`: a table of every accepted shape (with and without a scheme, with `www`/`m`/no subdomain, upper-case hosts, a trailing slash, extra parameters) and every rejected one from D7, each rejection checking its message;<br>&nbsp;&nbsp;– `video-thumbnail-core.test.ts`: success, a non-200 status, invalid JSON, a wrong thumbnail host, an `http:` thumbnail and a timeout;<br>&nbsp;&nbsp;– blur helper tests: success, an oversized body, a non-image response and a fetch error;<br>&nbsp;&nbsp;– `isRhmPublicId`, the env rule, and `isDevPagesEnabled`.<br>• **Playwright (`e2e/media.spec.ts`):**<br>&nbsp;&nbsp;– the hero `img` uses `res.cloudinary.com/{cloud}/image/upload/` with `f_auto` and `q_auto`, has at least 3 `srcset` candidates and a `sizes` value, is preloaded, carries a `data:` blur background, and loads (`naturalWidth > 0`);<br>&nbsp;&nbsp;– the second image has `loading="lazy"`;<br>&nbsp;&nbsp;– **no request reaches `youtube-nocookie.com` or `player.vimeo.com` before a click**, and no iframe exists;<br>&nbsp;&nbsp;– a click adds one iframe with the expected `src`, and focus is inside it;<br>&nbsp;&nbsp;– Enter on the focused facade does the same;<br>&nbsp;&nbsp;– the page has a `noindex` robots meta tag;<br>&nbsp;&nbsp;– the report-only CSP logs no violation on the page.<br>• Playwright routes the two player hosts, `i.ytimg.com` and `i.vimeocdn.com` to local stubs, so the suite does not depend on YouTube or Vimeo. | It covers both halves of the roadmap's "Done when", plus the security rules (D6–D8). The CSP check is early evidence for Phase 14's enforcement. | Roadmap Phase 8 "Done when"; `tech-stack.md` → *Testing* |

## Constraints

- **C1 — Only listed libraries.** `next-cloudinary` is already listed. Nothing else is added.
- **C2 — Existing pages unchanged.** The build route table matches `develop`, plus `/dev/media`.
- **C3 — No Cloudinary secret exists in any environment.** This phase needs only the public cloud name. The API secret stays in the Cloudinary console until Phase 9.
- **C4 — No fetches to user-supplied URLs.** The only server-side fetches go to `res.cloudinary.com/{our cloud}` with a checked public ID, and to `vimeo.com/api/oembed.json` with a numeric ID.
- **C5 — Existing suites hold.** `pnpm test`, `pnpm test:db` and `pnpm test:e2e` pass. No change to the CSP is needed.

## Owner setup (before the build can be verified)

Do not paste the API secret, or any other secret, into the chat. The cloud name is public, so you may share it.

1. **Account.** Sign up at cloudinary.com on the **Free** plan, under an account you control, and turn on 2FA. Choose the cloud name (product environment name) carefully; it appears in every image URL. **Tell me the cloud name.**
2. **Security.** Settings → Security:
   - under *Restricted media types*, tick **Fetched URL**;
   - leave *Allowed fetch domains* empty;
   - leave *Strict transformations* off.
3. **Folders.** In the Media Library, create `rhm/portfolio_item`, `rhm/service` and `rhm/page`.
4. **Sample photo.** Upload one landscape photo that RHM owns (at least 1,600 px wide) into `rhm/page/dev-media`, and set its **public ID** to `rhm/page/dev-media/sample`. In dynamic-folder mode the public ID does not include the folder automatically, so edit it in the asset's details. **Tell me when it is done.**
5. **Videos.** Give me one YouTube URL and one Vimeo URL for the test page. Use RHM's own videos if they exist (open question 4); otherwise use any public video you are happy to show on a page that is not indexed.
6. **Vercel.** Add `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` to **Preview** and **Production**. Since it is public, I can do this with `vercel env add` once you give me the name. Also add it to your `.env.local`.

I will build and unit-test everything against stubs while you do this. Steps 1, 4 and 6 are needed before the e2e and preview checks in `validation.md` can pass.
