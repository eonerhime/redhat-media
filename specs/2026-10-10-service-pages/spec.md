# Phase 5 — Service detail pages

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 1, Phase 5
- **Branch:** `feature/phase-05-service-pages` (from `develop` at `d4f9612`)
- **Started:** 2026-10-10

## What and why

Add `/services/[slug]`, one page per service, behind the cards on `/` and `/services` (those links have returned 404 since Phase 3). Each page says:

- what the service includes;
- how the work runs (the pillar's process);
- what the client receives;
- how to start a project.

That gives a prospect a concrete scope before the inquiry (mission principles 1 and 3).

Pages are pre-rendered for all six services. A muted service's page returns 404, and each page has its own metadata and `Service` JSON-LD.

## Constitution sections this phase relies on

- `mission.md` → *Guiding principles* 1 (inquiry first), 3 (credibility), 4 (honest claims) and 8 (creative, but restrained)
- `tech-stack.md` → *Architectural rules* 1 (server-first, static), 3 (services through the helpers; a muted service's page returns 404 while static params still list all six), 9 (`Service` JSON-LD per service page); *Security baseline* (lint ban on `dangerouslySetInnerHTML`, report-only CSP); *Design tokens* (contrast rules)
- `roadmap.md` → Phase 5; Phase 10 fills the related-work slot; Phase 14 adds the title template, OG images and site-wide JSON-LD; Phase 21 adds the `?service=` pre-fill
- Phase 2 spec → D6 (slugs fixed), D7 (muting helpers)
- Phase 3 spec → D2 (sample copy reviewed on the preview), D8 (keyed-text check), D9 (one primary button)
- Phase 4 spec → D1 (card surface), D3 (title), D4 (shared components), D5 (tests follow the config), D6 (shell checks per route)

## Scope

1. **Constitution updates first** (in this branch): the `tech-stack.md` row on `dangerouslySetInnerHTML` records how JSON-LD is emitted without it (D5). The README tree comment already reads "one page per service" (Phase 4 D7), and the roadmap row needs no change.
2. **Config** (`content/services.ts`): each service gains `includedKeys` and `deliverableKeys`, ordered lists of block keys (D2).
3. **Copy** (`content/defaults.ts`): two section headings plus four included items and three deliverables per service, **44 new keys**. All are **sample copy for the owner to accept or replace on the preview** (D3).
4. **Helpers** (`lib/content/services.ts`):
   - `allServiceSlugs()` returns every slug, muted included, for static params only.
   - `visibleServiceBySlug(slug)` returns the service, or `undefined` when the slug is muted or unknown (D1).
5. **Page** (`app/(public)/services/[slug]/page.tsx`), all Server Components (D4):
   1. **Header:** pillar name (eyebrow), `h1` service name and the service summary.
   2. **What's included** and **What you get:** an `h2` and a list each, side by side from `md`.
   3. **How we work:** an `h2` and the pillar's `StepList`.
   4. **Related work:** a slot that renders nothing until Phase 10 (D6).
   5. **CTA:** the shared `Cta` (Phase 4 D4).
6. **Metadata and JSON-LD:**
   - title `<service name> | RedHat Media`, and the service summary as the description (D7);
   - a `Service` JSON-LD block through a new shared `<JsonLd>` component (D5).
7. **Tests:**
   - `e2e/service-pages.spec.ts` derives every expectation from the config (Phase 4 D5).
   - The keyed-text check skips `<script>` contents.
   - The shell layout and contrast checks run on every visible service page (D8).
   - Unit tests cover the new helpers, key patterns and the JSON-LD serializer.

## Out of scope

- The `?service=` pre-fill on the CTA (Phase 21). The CTA links to `/contact`, which 404s until Phase 13, as on `/` and `/services`.
- Portfolio items in the related-work slot (Phase 10).
- Pricing, packages, turnaround times or proof points (roadmap open questions 7 and 11).
- Service imagery and OG images (Phases 8, 14 and 28).
- `Organization` / `LocalBusiness` JSON-LD, `sitemap.ts` and the title template (Phase 14).

## Key table

**S** = sample copy written in Phase 5, for the owner to accept or replace on the preview (D3). It describes typical work only. It names no clients, numbers, turnaround times, tools or guarantees (mission principle 4).

| Key | Value | |
| --- | --- | --- |
| `services.detail.included` | What's included | S |
| `services.detail.deliverables` | What you get | S |
| `services.photography.included1` | A pre-shoot brief to agree the shot list, style and where the images will be used | S |
| `services.photography.included2` | Product, event and portrait sessions | S |
| `services.photography.included3` | Selection of the strongest frames | S |
| `services.photography.included4` | Colour correction and retouching | S |
| `services.photography.deliverable1` | Edited, high-resolution images | S |
| `services.photography.deliverable2` | Web-ready versions sized for your site and social channels | S |
| `services.photography.deliverable3` | Files delivered by download link | S |
| `services.videography.included1` | Concept and script development | S |
| `services.videography.included2` | Filming of promotional content, events and interviews | S |
| `services.videography.included3` | Editing, colour grading and sound | S |
| `services.videography.included4` | Titles and captions | S |
| `services.videography.deliverable1` | A final cut in the formats your channels need | S |
| `services.videography.deliverable2` | Short cut-downs for social media | S |
| `services.videography.deliverable3` | Files delivered by download link | S |
| `services.digitalMarketing.included1` | An audit of your current channels and results | S |
| `services.digitalMarketing.included2` | A campaign plan with goals, audience and budget | S |
| `services.digitalMarketing.included3` | Ad creative and copy | S |
| `services.digitalMarketing.included4` | Campaign setup, monitoring and optimisation | S |
| `services.digitalMarketing.deliverable1` | A written campaign plan | S |
| `services.digitalMarketing.deliverable2` | Live campaigns on the agreed channels | S |
| `services.digitalMarketing.deliverable3` | Regular performance reports | S |
| `services.socialMedia.included1` | A content calendar for each platform | S |
| `services.socialMedia.included2` | Post design and caption writing | S |
| `services.socialMedia.included3` | Scheduling and publishing | S |
| `services.socialMedia.included4` | Replies to comments and messages | S |
| `services.socialMedia.deliverable1` | A monthly content calendar | S |
| `services.socialMedia.deliverable2` | Published posts on your channels | S |
| `services.socialMedia.deliverable3` | Monthly performance reports | S |
| `services.onlinePresence.included1` | Setting up and tidying your business profiles and listings | S |
| `services.onlinePresence.included2` | Keeping details, hours and photos up to date | S |
| `services.onlinePresence.included3` | Monitoring and responding to reviews | S |
| `services.onlinePresence.included4` | Account access and security checks | S |
| `services.onlinePresence.deliverable1` | Complete, consistent business profiles | S |
| `services.onlinePresence.deliverable2` | Review responses on your behalf | S |
| `services.onlinePresence.deliverable3` | A monthly presence report | S |
| `services.webApp.included1` | A written spec agreed before any code is written | S |
| `services.webApp.included2` | Design and development of websites and web apps | S |
| `services.webApp.included3` | Hosting, domain and security setup | S |
| `services.webApp.included4` | Testing on phones, tablets and desktops | S |
| `services.webApp.deliverable1` | A live, tested website or web app | S |
| `services.webApp.deliverable2` | Documentation for running and updating it | S |
| `services.webApp.deliverable3` | A handover session with your team | S |

Service names and summaries come from Phase 2, and pillar names and steps from Phases 2 and 3. The process heading reuses `home.process.heading` ("How we work"), and the CTA reuses `home.cta.*` (Phase 4 D4).

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **Static params list all six slugs, and the page 404s a muted one.** `generateStaticParams` returns `allServiceSlugs()`. A muted slug reaches `notFound()` during prerendering, so it is served as a static, real 404. Any other slug is rendered on request from the Partial Prerender fallback shell. That shell streams with status 200 before `notFound()` runs, so the visitor gets the not-found page with `noindex`, a soft 404. The owner accepted this on 2026-10-10. `dynamicParams` cannot be used with `cacheComponents`, and a real 404 would need a Proxy check on every service page view. The page looks its slug up with `visibleServiceBySlug()` and calls `notFound()` when it gets `undefined`. `allServiceSlugs()` is the only helper that returns muted entries, and it returns slugs only, never copy. | Architectural rule 3 says static params still list all six, so that unmuting from the CMS in Phase 31 needs no redeploy. The lint ban on importing the raw list stays in force for `app/**`. | `tech-stack.md` → *Architectural rules* 3; roadmap Phase 5 "Done when" |
| D2 | **Included items and deliverables are ordered key lists in the service config.** Keys follow `services.<id>.included<n>` and `services.<id>.deliverable<n>`, numbered from 1 and checked by a unit test. Each list is typed non-empty. | This follows the pillar `stepKeys` pattern. Each item is then a separate block that Phase 27 can edit in place, and a new service cannot type-check without its lists. | Phase 3 D4; `tech-stack.md` → *In-place CMS* 4 |
| D3 | **New copy is sample copy, reviewed on the preview.** No owner copy exists for included items or deliverables, so 44 **S** strings are proposed. They describe typical work and make no claims. As in Phases 3 and 4, the page shows no "sample" label, and the validation records the owner accepting or replacing them. | This avoids blocking the phase on copy while keeping the owner as the one who decides. | Phase 3 D2; Phase 4 D2; mission principle 4 |
| D4 | **Layout.** The header has the pillar name as a `muted` 16px eyebrow, the `h1` and the summary. The included and deliverables lists sit in two columns from `md`. Each is an `h2` and a `ul` on the Phase 4 card surface (`ink`, `line` border, `brand` top edge), with brand markers. The process strip and the CTA each sit in their own bordered section. Every `h2` section is a labelled region. | It is the same visual language as `/services`, with one primary button (the CTA). The labelled regions let the e2e tests find each section by name. | Phase 3 D9; Phase 4 D1 |
| D5 | **JSON-LD without `dangerouslySetInnerHTML`.** `components/shared/json-ld.tsx` renders `<script type="application/ld+json">{serializeJsonLd(data)}</script>`. `serializeJsonLd` (`lib/seo/json-ld.ts`) is `JSON.stringify` with every `<` replaced by `\u003c`, so the output contains no `<` at all. React 19 writes `<script>` text children raw, and the JSON stays valid. The `Service` object has `name`, `description`, `serviceType`, `url` and a `provider` (`Organization`, `siteName`, `env.siteUrl`). | The Next.js JSON-LD guide uses `dangerouslySetInnerHTML`, which is lint-banned here. Checked on React 19.3: script text children are not HTML-escaped (`&` and `"` stay intact), and React also neutralises `</script`. With `<` escaped first, nothing in the data can end the tag. Data blocks are not executed, so the report-only CSP and the later enforced one do not apply. | `tech-stack.md` → *Security baseline* (amended), *Architectural rules* 9 |
| D6 | **The related-work slot renders nothing until Phase 10.** `components/services/related-work.tsx` takes the service category and returns `null`. Phase 10 fills it with published portfolio items in that category and adds its heading key then. | The roadmap asks for an empty slot. A visible "work will appear here" placeholder on six more pages would multiply the Phase 3 D5 release gate, and an unused key would be dead copy. | Roadmap Phases 5 and 10; Phase 3 D5; mission principle 4 |
| D7 | **Title and description.** The title is `<service name> \| RedHat Media` and the description is the service summary, both through `block()`. | Each page gets its own metadata without six more strings. Renaming a service renames its tab. | Phase 4 D3 |
| D8 | **Tests follow the config.** `e2e/service-pages.spec.ts` loops over the visible services from `resolveVisibility(services)`. For each, it checks the headings, lists, steps, CTA, title, description, parsed JSON-LD, current nav item and keyed text. It also checks that every muted slug and an unknown slug return 404. `e2e/shell.spec.ts` adds every visible service page to `routes`. The keyed-text helper skips `<script>` contents (JSON-LD is not visible text). | Adding or muting a service then changes the pages and the expectations together, as in Phase 4. | Phase 4 D5, D6 |

## Constraints

- **C1 — No new dependencies.**
- **C2 — Static.** All six service paths are prerendered. With `cacheComponents`, the route table lists them as `○` under `/services/[slug]`, the later ones folded into `[+N more paths]`, beside the `◐` fallback shell (D1). Each path has `.html` and `.rsc` in `.next/server/app/services/`, and its `.meta` has no postponed state. `/` and `/services` stay `○`.
- **C3 — Existing guards hold.** The Phase 1, 3 and 4 e2e suites pass, unchanged in what they assert.
- **C4 — Server Components only.** The phase adds no client component.
- **C5 — No `dangerouslySetInnerHTML`.** The lint ban stays, with no disable comment.
