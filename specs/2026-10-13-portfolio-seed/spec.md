# Phase 9 — Portfolio seed: engineering case studies

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 1, Phase 9
- **Branch:** `feature/phase-09-portfolio-seed` (from `develop` at `0ab945d`)
- **Started:** 2026-10-13
- **Status:** approved by the owner, 2026-10-13

## What and why

Load the first real portfolio content into the database, so Phases 10–12 (grid, filters, detail page) build against real rows instead of fixtures:

- **five engineering case studies**: SportsPred, HireFlow, AfroJamz, toutMessages and Abara. Each has a summary, description, highlights, tech stack, live URL, credit line and a cover screenshot on Cloudinary;
- **one rule for external links**: `https:` only, checked when content is written and again when it is rendered, and always rendered with `rel="noopener noreferrer"`;
- **the server `cloudinary` SDK**, used only by a local script that uploads the cover screenshots under fixed public IDs.

The seed is the developer's content tool until the CMS (Milestone 3), so it must be safe to re-run and must never touch production.

## Constitution sections this phase relies on

- `mission.md` → *Guiding principles* 2 (the site is the proof), 6 (small, verifiable steps) and 9 (secure from the first commit)
- `tech-stack.md`:
  - *Core* → *Media: images* (the `cloudinary` SDK pin) and *Database*;
  - *Architectural rules* 11 (performance budget);
  - *Security baseline* → database security ("preview and dev branches hold **seed data only**", production holds none), Cloudinary hardening, and secrets handling;
  - *In-place CMS* 5 (folder convention `rhm/{ownerType}/{ownerId}`);
  - *Environment variables*.
- `roadmap.md` → Phase 9; open questions 1 (logo), 4 (media assets) and 5 (engineering case studies); Phases 10–12, 23, 28 and 31, which build on this phase.
- `README.md` → §5 `PortfolioItem` and `MediaItem`, and the portfolio hub objective.
- Phase 7 spec (D5 schema, D6 runtime client, D9 database tests, D11 migrations from CI only) and Phase 8 spec (D2 folders, D5 `<MediaImage>`, D6 public-ID check).

## Owner answers

Given 2026-10-13:

1. **Phase confirmed:** Phase 9, portfolio seed.
2. **All five products may be shown**, SportsPred included (open question 5).
3. **Screenshots:** use the ones in `emo-onerhime/public/projects/` (see D6 and the owner checks below).
4. **Media case studies: not yet.** The owner has many photos to use later. This phase seeds engineering items only (D10; open question 4).
5. **Logo:** the real RedHat Media logo replaces the CSS wordmark (open question 1). This is done in a separate amendment PR, not in this phase (D11).

Given later on 2026-10-13, answering the questions asked with the draft:

- **A. Credit line:** `Design & Engineering: Emo Onerhime`, for all five items.
- **B. Featured:** SportsPred, toutMessages and AfroJamz, as drafted.
- **C. Screenshots:** use the five files in `emo-onerhime/public/projects/` as they are. The phone number on the Abara cover is the owner's own business number and may be shown.
- **D. Spec and Appendix A approved.** The owner created the Cloudinary API key and stored the key and secret in `.env.local` (*Owner setup* 2).

## Scope

1. **Constitution first** (listed below): `tech-stack.md`, `roadmap.md` (open questions 1, 4 and 5) and `CLAUDE.md`.
2. **Link rule** (D2): `lib/validation/https-url.ts` → `isHttpsUrl()` and `httpsUrlSchema`, with a table-driven unit test.
3. **Content schema** (D3): `lib/portfolio/schema.ts` → Zod schemas for a seeded portfolio item and its cover, with length caps. Phase 31 reuses them.
4. **`<ExternalLink>`** (D4): `components/shared/external-link.tsx`, plus a lint guard on `target="_blank"`.
5. **Seed content** (D1, D5): `prisma/seed-data/portfolio.ts`, the five items in Appendix A.
6. **Seed runner** (D7): `lib/db/seed.ts` → `runSeed(db)`, with `prisma/seed.mts` as the thin CLI. It is idempotent and guarded against production.
7. **Upload script** (D6): `scripts/upload-seed-media.mts` and `pnpm media:upload-seed`. It uses `cloudinary@2.11.0` (exact pin, devDependency) and runs locally only.
8. **CI** (D8): the `db` job proves the seed is idempotent, and `migrate-preview` seeds the Neon `preview` branch after migrating.
9. **Tests** (D9): unit tests for D2–D4 and the seed guard, and `seed.db.test.ts` against the throwaway Postgres.
10. **Docs:** `.env.example`, `CLAUDE.md` (the `media:upload-seed` command) and the constitution changes listed below.

## Constitution changes (in this PR, before the code)

- **`tech-stack.md`:**
  - *Core → Media: images:* pin `cloudinary` at **`2.11.0`** (exact; published 2026-08-27). It is a **devDependency** until Phase 28 first uses it at runtime; it then moves to `dependencies` (D6).
  - *Environment variables:* `NEXT_PUBLIC_CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` live **only in the developer's `.env.local`**, for `pnpm media:upload-seed`. They are not in `lib/env.ts`, Vercel or CI until Phase 28 (D6).
  - *Security baseline → database:* the `preview` branch is seeded by CI (`migrate-preview`), and the seed refuses the production endpoint (D7, D8).
  - *Security baseline:* add a row for **external links**: `https:` only, validated on write (`httpsUrlSchema`) and on render (`<ExternalLink>`), always `rel="noopener noreferrer"`. Phase 9.
- **`roadmap.md`:**
  - Open question 1: owner update 2026-10-13. The real logo replaces the wordmark, in an amendment PR (D11).
  - Open question 4: answered for Phase 9. No media case studies yet; the owner has photos to choose from before Phase 11 (D10).
  - Open question 5: answered. All five products are approved. The spelling is **toutMessages**, matching the live product and its repository (`eonerhime/toutMessages`). Only HireFlow's repository is public, so only HireFlow gets a repo link.
- **`CLAUDE.md`** → *Commands*: `pnpm db:seed` (dev branch locally; CI seeds preview) and `pnpm media:upload-seed`.

## Out of scope

- Rendering portfolio items: the grid, the detail page and related-work slots (Phases 10–12). Nothing public changes in this phase.
- Media (photography, videography, marketing) case studies (D10; open question 4).
- Galleries beyond one cover image per item (Phases 12 and 29).
- Signed browser uploads, `attachMedia` and `destroy` (Phase 28).
- The logo (D11).
- Seeding production. Production holds no seed data (`tech-stack.md`); Phase 16 decides how real content reaches it.

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **Five items, all `WEB_APP`, all `published`.**<br>• **Order (`sortOrder`):** SportsPred, HireFlow, AfroJamz, toutMessages, Abara, which is the order on `emo-onerhime.vercel.app`.<br>• **Featured (owner question B):** SportsPred, toutMessages and AfroJamz. Phase 23 is the first phase to read the flag.<br>• **`publishedAt`:** a fixed date in the content file (2026-10-13), not `now()`, so re-runs change nothing.<br>• **Credit (owner question A):** `Design & Engineering: Emo Onerhime`.<br>• **`client`:** empty. These are RHM's own products.<br>• **Live URLs:** the ones on `emo-onerhime.vercel.app`, each checked on 2026-10-13 (HTTP 200): `https://sportspred.ng`, `https://hireflow-track.vercel.app`, `https://afro-jamz.vercel.app`, `https://toutmessages.vercel.app` and `https://abara.vercel.app`.<br>• **Repo URL:** HireFlow only (`https://github.com/eonerhime/hireflow-track`). `gh repo view` shows the other four repositories are private.<br>• **Content:** Appendix A. Every highlight traces to a line in that product's README or to the text on `emo-onerhime.vercel.app`, and no metric is invented. Where the two sources disagree, the README wins. For example, AfroJamz's front end is React and Vite, not Next.js, and its "100+ tests" claim is left out because its own test table sums to 76. | Only real, checkable claims (*Guiding principles* 2). Private repositories cannot be linked. | Owner answers 1–2; READMEs (2026-10-13); `gh repo view` |
| D2 | **`isHttpsUrl(input)` and `httpsUrlSchema`** (`lib/validation/https-url.ts`):<br>• The input is trimmed and must be at most 2,048 characters. It is parsed with `new URL()`.<br>• The protocol must be `https:`. There must be no username or password, and no port other than the default.<br>• The host must be a domain name: at least one dot, not an IP literal and not `localhost`, and every label a valid DNS label (the URL parser alone accepts `a..b` and `a_b.com`; amended 2026-10-13).<br>• The schema outputs the normalised `url.href`.<br>• The rejection message names the reason (for example "Links must start with https://"). | One rule, used by the seed now and by the CMS later (Phase 31). An `http:` or `javascript:` link, or one carrying credentials, can never be stored. | Roadmap Phase 9; `tech-stack.md` → *Security baseline* |
| D3 | **Content schemas** (`lib/portfolio/schema.ts`):<br>• `title` 1–80 characters; `slug` `^[a-z0-9]+(-[a-z0-9]+)*$`, at most 60;<br>• `summary` at most 200; `description` at most 1,200;<br>• `highlights` 3–6 entries, each at most 160; `techStack` 1–10 entries, each at most 40;<br>• `liveUrl` `httpsUrlSchema`; `repoUrl` optional, `httpsUrlSchema` with host `github.com`;<br>• `credit` at most 120;<br>• `cover`: a `source` file name (`.webp`, `.png`, `.jpg` or `.avif`) and `alt` text of 10–200 characters. The public ID is derived (D5), never written by hand.<br>The seed validates every item **before** opening a transaction, so bad content writes nothing. | The caps keep the Phase 10 cards and Phase 12 pages predictable, and Phase 31's `updateRecordField` reuses the same field rules. | `README.md` §5; `tech-stack.md` → *In-place CMS* |
| D4 | **`<ExternalLink href>`** (`components/shared/external-link.tsx`, a server component):<br>• When `isHttpsUrl(href)` passes, it renders `<a href target="_blank" rel="noopener noreferrer">`. A visually hidden "(opens in a new tab)" follows the children.<br>• Otherwise it renders the children as plain text and logs a warning. It never renders the link.<br>• **Lint guard:** a JSX `target="_blank"` attribute is allowed only in `external-link.tsx` and `video-facade.tsx`, the Phase 8 facade (`no-restricted-syntax`). | The roadmap asks for `rel="noopener noreferrer"`. A single component, enforced by lint, makes that structural rather than a review checklist item. The render check protects against rows written before validation existed or edited directly in Studio. | Roadmap Phase 9 |
| D5 | **Stable IDs.**<br>• `PortfolioItem.id` = `seed_{slug with - replaced by _}` (e.g. `seed_hireflow_track`).<br>• The cover `MediaItem`: `id` = `{itemId}_cover`, `ownerType` `PORTFOLIO_ITEM`, `ownerId` the item ID, `kind` `IMAGE`, `sortOrder` 0, plus the `alt`.<br>• The cover public ID is `rhm/portfolio_item/{itemId}/cover`, which `isRhmPublicId` (Phase 8, D6) accepts. | Fixed IDs make the seed an upsert, so a re-run updates in place. The Cloudinary folder then matches `rhm/{ownerType}/{ownerId}` (*In-place CMS* 5), which Phase 28's folder check relies on. | Phase 8 spec, D2 and D6 |
| D6 | **Cover upload: a local script, not the seed.**<br>• `scripts/upload-seed-media.mts` (`pnpm media:upload-seed -- --from <dir>`) reads `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` from `.env.local`, and validates them with Zod.<br>• For each item in the seed content it uploads `{dir}/{cover.source}` with `public_id` = the D5 ID, `asset_folder` = `rhm/portfolio_item/{itemId}`, `overwrite: false`, `unique_filename: false`, `resource_type: "image"` and `allowed_formats` jpg, png, webp, avif. It refuses files over 15 MB.<br>• An asset that already exists is reported and skipped. It prints `uploaded` or `exists` with the width and height for each item.<br>• The source directory defaults to `../emo-onerhime/public/projects`. **No image is committed** to this repository.<br>• `cloudinary@2.11.0` is a **devDependency**; nothing in `app/`, `components/` or `lib/` imports it (lint guard).<br>• **Owner question C (answered):** the five existing screenshots are used as they are. The Abara cover shows the owner's own number, which the owner allows. SportsPred shows "0% accuracy" and an empty predictions list, and HireFlow and toutMessages are cropped mid-logo; a better screenshot can replace any of them later by uploading under a new public ID. | Phase 8 showed that setting public IDs by hand in the console is error-prone. A script sets them exactly and can be re-run. Keeping the upload out of `db:seed` means CI can seed the preview branch with no Cloudinary secret anywhere but the developer's machine. | `tech-stack.md` → *Core*, *Environment variables*; Cloudinary docs → upload parameters, *Folder modes in integrations* (ctx7, 2026-10-13) |
| D7 | **Seed runner.**<br>• `lib/db/seed.ts` exports `runSeed(db, items)`. In one transaction it **upserts** each item and its cover by ID. It never deletes rows it did not create, so content added later on a preview branch survives. It returns counts (created, updated).<br>• `prisma/seed.mts` (run by `pnpm db:seed`) connects as `rhm_migrator` through `@prisma/adapter-pg` with `MIGRATOR_DATABASE_URL`. That is TCP, so the same code works against Neon and the CI container.<br>• **Production guard** (`lib/db/seed-guard.ts`, unit-tested): it refuses to run when the database host contains the production endpoint ID (`ep-muddy-star-za4k6uom`), and when `VERCEL_ENV` is `production`. It prints the target host (never the password) before writing. | `runSeed` takes the client as a parameter, so the database test can call it directly. Upserts make the seed safe to run on every `develop` push. The endpoint ID is not a secret; it appears in every connection host name. | Phase 7 spec, D5, D9, D11; `tech-stack.md` → *Security baseline* |
| D8 | **CI.**<br>• **`db` job:** after the migrations and drift check, it runs `pnpm db:seed` twice (proving the CLI runs under plain Node and is idempotent), then `pnpm test:db`, which includes `seed.db.test.ts` (D9). No new secret is needed.<br>• **`migrate-preview`:** after `pnpm db:deploy`, it runs `pnpm db:seed` against the Neon `preview` branch with the same `MIGRATOR_DATABASE_URL`. Phase 10's preview deploys then show real items.<br>• The `dev` branch is seeded locally with `pnpm db:seed`. | Migrations already reach Neon only from CI (Phase 7, D11), and seeding follows the same path. The preview branch must hold content before Phase 10 can be checked on a preview. | Phase 7 spec, D11 |
| D9 | **Tests.**<br>• **Unit (Vitest):**<br>&nbsp;&nbsp;– `https-url.test.ts`: a table of accepted URLs and of rejected ones (`http:`, `javascript:`, `data:`, protocol-relative `//x`, credentials, a port, an IP literal, `localhost`, no dot, over 2,048 characters, whitespace inside), each rejection with its message;<br>&nbsp;&nbsp;– `schema.test.ts`: every cap in D3, a non-GitHub `repoUrl`, and **the five seeded items all parse**;<br>&nbsp;&nbsp;– `external-link.test.ts` (`renderToStaticMarkup`; a `.ts` file, because the unit suite collects `*.test.ts` only): the `rel` and `target` attributes, the hidden text, and plain text for an `http:` or `javascript:` link;<br>&nbsp;&nbsp;– `seed-guard.test.ts`: refuses the production endpoint and `VERCEL_ENV=production`, and accepts the dev and preview hosts and `localhost`.<br>• **Database (`seed.db.test.ts`):** `runSeed` twice in a row. The second run creates nothing. There are 5 published items and 5 cover media rows; every `liveUrl` and `repoUrl` starts with `https://`; every cover public ID passes `isRhmPublicId`; and a row created outside the seed is left untouched.<br>• Throwaway lint checks: a `target="_blank"` outside the two allowed files, and a `cloudinary` import in `lib/`, each fail `pnpm lint`. | It covers the roadmap's two checks ("`pnpm db:seed` loads the approved items with their media", "`https:`-only link validation is tested") plus idempotency and the production guard. | Roadmap Phase 9 "Done when"; `tech-stack.md` → *Testing* |
| D10 | **No media case studies in this phase.** The owner has photos but has not chosen them yet. They will be seeded through the same content file and upload script, in an amendment PR before Phase 11, once each is chosen and cleared for public use. | The roadmap says to seed media items "only where real assets exist". Phase 11 hides empty categories, so nothing breaks meanwhile. | Owner answer 4; open question 4 |
| D11 | **The logo is a separate amendment PR**, like the favicon amendment after Phase 1. It needs the logo file, a check of how a JPEG with a background sits on the dark header, possibly an SVG or transparent PNG, and updates to the Phase 1 spec and the layout e2e tests. | It changes the layout shell, not the portfolio. Keeping it apart keeps both PRs small. | Owner answer 5; open question 1 |

## Constraints

- **C1 — Only listed libraries.** `cloudinary` is already listed in `tech-stack.md`; it is pinned here. Nothing else is added.
- **C2 — No public change.** The build route table matches `develop`. No page reads portfolio data yet.
- **C3 — Secrets stay local.** The Cloudinary API key and secret exist only in the developer's `.env.local` and the Cloudinary console. They are never pasted into chat, never selected in the editor, and never added to Vercel or CI in this phase. gitleaks stays green.
- **C4 — Production untouched.** The seed refuses production (D7). No workflow seeds production.
- **C5 — Existing suites hold.** `pnpm test`, `pnpm test:db` and `pnpm test:e2e` pass unchanged.

## Owner setup (before the build can be verified)

Do not paste the API secret, or any other secret, into the chat, and do not select it in the editor.

1. **Approve this spec**, including Appendix A and answers A–C.
2. **Cloudinary API key.** In the Cloudinary console, go to Settings → API Keys and create a key named `rhm-seed-local`. Copy the key and secret into `.env.local` as `NEXT_PUBLIC_CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`, through PowerShell or by typing them, not by selecting text in VS Code. Tell me when it is done; I will check that the variables are set without printing them.
3. **Screenshots (question C).** Either:
   - **(a)** use the five files in `emo-onerhime/public/projects/` as they are, after replacing the Abara screenshot with one that shows no phone number or personal name; or
   - **(b)** give me new screenshots (at least 1,600 px wide, 16:10 or 16:9) in a folder outside this repository, and I will point the script at it.
4. **Run nothing else.** I run `pnpm media:upload-seed` and `pnpm db:seed` on the `dev` branch, and CI seeds `preview` after the merge.

---

## Appendix A — Seed content (for approval)

All items: category `WEB_APP`, published, `publishedAt` 2026-10-13, credit `Design & Engineering: Emo Onerhime` (question A).

### 1. SportsPred — featured

- **Slug:** `sportspred` · **Live:** https://sportspred.ng · **Repo:** none (private)
- **Summary:** AI-powered football predictions for African bettors.
- **Description:** A prediction platform that blends Poisson, Elo and form/head-to-head models across 13 football leagues. It ships an accumulator builder, a betting history tracker with real payout maths, 13-currency auto-detection and Paystack subscription tiers.
- **Highlights:**
  - Predictions across 13 football leagues from a three-model engine: Poisson, Elo and form/head-to-head.
  - A backtested weighted blend of the three models: Poisson 10%, Elo 60%, form/head-to-head 30%.
  - Accumulator builder with pick limits per plan (Free 3, Premium 7, Pro unlimited).
  - Tracked bets settle automatically when match results arrive.
  - 13 currencies, auto-detected from the visitor's location.
- **Tech stack:** Next.js 16, TypeScript, Tailwind CSS 4, Prisma, PostgreSQL (Neon), NextAuth, Paystack, Resend
- **Cover alt:** SportsPred home page with today's football predictions, league filters and accuracy figures.

### 2. HireFlow

- **Slug:** `hireflow-track` · **Live:** https://hireflow-track.vercel.app · **Repo:** https://github.com/eonerhime/hireflow-track
- **Summary:** A job application tracker, built in public with specs.
- **Description:** A six-stage Kanban pipeline for tracking job applications, contacts and follow-up reminders, built entirely in the open. Every feature starts as a written spec before any code ships.
- **Highlights:**
  - Six-stage Kanban pipeline for applications, contacts and follow-up reminders.
  - A browser extension that saves job postings from LinkedIn Easy Apply or any job page.
  - Applications are never hard-deleted; a timestamp marks deletion.
  - JWT sessions in HTTP-only cookies, verified at the edge with the Web Crypto API.
  - Built in public: every feature is specified before it is coded.
- **Tech stack:** Next.js 15, TypeScript, Prisma, PostgreSQL (Neon), Tailwind CSS 4, Zod, Jest
- **Cover alt:** HireFlow dashboard showing the application pipeline from Applied to Offer, with totals.

### 3. AfroJamz — featured

- **Slug:** `afro-jamz` · **Live:** https://afro-jamz.vercel.app · **Repo:** none (private)
- **Summary:** A marketplace for African beat producers and buyers.
- **Description:** A full-stack beat marketplace where producers upload and license beats and buyers purchase and download them. It has role-based access, Google sign-in and a Fiverr-style escrow wallet with a seven-day withdrawal hold.
- **Highlights:**
  - Escrow-style wallet that holds producer earnings for seven days before withdrawal.
  - A 30% platform commission enforced on the server for every transaction.
  - 60+ API endpoints documented with Swagger.
  - Producer and buyer roles, with Google sign-in.
  - Beat uploads in MP3, WAV, M4A or FLAC, up to 50 MB.
- **Tech stack:** React 19, Vite, Tailwind CSS 4, Express 5, Google OAuth, Cloudinary, Jest (the database is left out: the README says SQLite, but `package.json` has the Neon driver)
- **Cover alt:** AfroJamz home page with the headline "The sound of Africa, yours to own." and a beat search box.

### 4. toutMessages — featured

- **Slug:** `toutmessages` · **Live:** https://toutmessages.vercel.app · **Repo:** none (private)
- **Summary:** One inbox for every social channel, built for teams.
- **Description:** A multi-tenant support inbox that brings DMs, comments and mentions from nine platforms into one list: WhatsApp, Instagram, Facebook, Threads, Telegram, email, X, TikTok and LinkedIn. It includes AI-drafted replies, an analytics dashboard and organisation-level billing.
- **Highlights:**
  - Every DM and comment across nine channels in one inbox.
  - AI-drafted replies on demand, generated with Claude.
  - Outbound webhooks signed with HMAC-SHA256.
  - Billing through Stripe, or Paystack and Flutterwave in African markets, chosen by location.
  - Multi-tenant, with organisation-level billing and analytics.
- **Tech stack:** Next.js 16, Express 5, TypeScript, PostgreSQL (Neon), Clerk, Stripe, Paystack, Anthropic API
- **Cover alt:** toutMessages inbox with conversations grouped by channel and a reply box.

### 5. Abara

- **Slug:** `abara` · **Live:** https://abara.vercel.app · **Repo:** none (private)
- **Summary:** WhatsApp-first inventory and business management.
- **Description:** A business tool run entirely by WhatsApp message: sales, restocks, income and expenses are logged with plain-language commands and a small set of optional shortcuts. Stock and money always reconcile, because no sale posts without moving inventory and no restock posts without its real cost.
- **Highlights:**
  - Sales, restocks, income and expenses logged by WhatsApp message in plain language.
  - Optional shortcuts for speed: `s/` for a sale, `r/` for a restock, `+` and `-` for money, `?` for a question.
  - Stock and money always reconcile: every sale moves inventory and every restock records its cost.
  - Staff pay, invoices and receipts from the same chat.
  - A web dashboard for inventory, the ledger and reports.
- **Tech stack:** Next.js 16, Express 5, TypeScript, PostgreSQL (Neon), Drizzle ORM, BullMQ, Clerk, WhatsApp
- **Cover alt:** Abara dashboard with quick actions, today's snapshot, recent sales and restocks, and inventory alerts.
