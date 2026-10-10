# Phase 3 — Homepage

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 1, Phase 3
- **Branch:** `feature/phase-03-homepage` (from `develop` at `d70c384`)
- **Started:** 2026-10-10

## What and why

Replace the Phase 1 placeholder at `/` with the real homepage:

- the hero;
- the three pillars as cards, listing only visible services;
- a featured-work placeholder;
- a process strip per pillar;
- an inquiry CTA to `/contact`.

It is the first page built on Phase 2. All text goes through `block()`, and all services through `visiblePillars()`. Editing (Phase 27) and muting (Phase 31) therefore reach the homepage without a rewrite.

## Constitution sections this phase relies on

- `mission.md` → *Guiding principles* 1 (inquiry first), 3 (credibility), **4 (honest claims; placeholders clearly marked)** and 8 (creative, but restrained)
- `tech-stack.md` → *Architectural rules* 3 (services through `visibleServices()`), *Design tokens* (contrast rules), *In-place CMS* 4 (key pattern)
- `roadmap.md` → Phase 3, and open question 11 (proof points, unanswered)
- Phase 2 spec → D2 (async `block()`), D7 (muting helpers)

## Scope

1. **Constitution updates first** (in this branch):
   - `roadmap.md`: Phase 3 adds a Growth process strip (D4). Open question 11 notes that Phase 3 ships with no proof points.
   - `tech-stack.md` → *Architectural rules* 3: the raw-list ban is enforced by lint (D7).
   - README: the `page.tsx` tree comment drops "core metrics" (D6).
2. **Copy** (`content/defaults.ts`): new keys for the pillar summaries, process steps, featured-work section and CTA (key table below). These are **sample copy adopted by the owner** (D2).
3. **Pillar config** (`content/services.ts`): each pillar gains a `summaryKey` and three `stepKeys`, all `BlockKey`s.
4. **Homepage** (`app/(public)/page.tsx` plus `components/home/*`), in roadmap order:
   1. **Hero:** `h1` tagline, subtext and a primary "Start a project" button to `/contact`.
   2. **What We Do:** one card per visible pillar. Each card shows the name, summary and its visible services, each as a name and summary linking to `/services/[slug]` (D3).
   3. **Featured work:** heading, an honest "coming" line and a link to `/portfolio` (D5).
   4. **How we work:** one process strip per visible pillar (D4).
   5. **CTA:** heading, line and the "Start a project" button.
5. **Metadata:** `/` uses `home.meta.description` (ported in Phase 2). The title stays "RedHat Media".
6. **Guards:**
   - ESLint bans importing `content/defaults` or the raw `services` list from `app/**` and `components/**` (D7).
   - A Playwright test checks that every visible text string in `<main>` is a `defaults` value (D8).

## Out of scope

- Proof points: numbers, testimonials and client logos (open question 11, unanswered). None are shown (mission principle 4).
- Real featured items. They come from the database in Phase 23.
- Hero imagery and media (Phases 8 and 28).
- The about paragraph (`about.intro`), which Phase 6 renders.
- Site-wide metadata, OG images and JSON-LD (Phase 14).
- The target pages `/services/*`, `/portfolio` and `/contact`. They 404 on previews until Phases 5, 10 and 13, as the nav links already do (Phase 1 D3).

## Key table

**P** = ported verbatim in Phase 2. **S** = sample copy written in Phase 3 and adopted by the owner, 2026-10-10 (D2).

| Key | Value | |
| --- | --- | --- |
| `home.meta.description` | (Phase 2) | P |
| `home.hero.tagline` | If it's media, it's ours to handle. | P |
| `home.hero.subtext` | Photography. Videography. Digital & social media marketing. … | P |
| `home.cta.button` | Start a project | S |
| `home.services.heading` | What We Do | P |
| `services.pillars.production.summary` | Photos and video that show your work at its best, from the first shot to the final cut. | S |
| `services.pillars.growth.summary` | Marketing, social and reputation management that keep you visible and trusted. | S |
| `services.pillars.build.summary` | Websites and web apps, planned first, then built to work as hard as you do. | S |
| `home.work.heading` | Featured work | S |
| `home.work.body` | Selected projects from across photography, video, marketing and software will appear here. | S |
| `home.work.link` | See the portfolio | S |
| `home.process.heading` | How we work | S |
| `services.pillars.production.step1`–`3` | Brief, Shoot, Deliver | roadmap |
| `services.pillars.growth.step1`–`3` | Audit, Plan, Grow | S |
| `services.pillars.build.step1`–`3` | Spec, Build, Ship | roadmap |
| `home.cta.heading` | Have a project in mind? | S |
| `home.cta.body` | Tell us what you want built, shot or grown, and we'll take it from there. | S |

The service names and summaries (`services.<id>.*`) and pillar names come from Phase 2.

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **Pillars render as cards.** There are three cards on a `md` grid and they stack on phones. Each card is an `ink` surface with a `line` border and a `brand` top edge, like the legacy service cards. Secondary text uses `muted` at 16px or more, on `ink` only. | The owner asked for cards. The tokens' contrast rules allow `muted` only at 16px or more on `ink`, and `brand` only as a decorative or UI edge. | Owner, 2026-10-10; `tech-stack.md` → *Design tokens* |
| D2 | **The sample copy is the owner's copy, not a placeholder.** The **S** strings make no claims (no numbers, clients or results). The owner adopted them on 2026-10-10 for review on the preview. The page shows no "sample" label. Each string can be replaced by a one-line edit now, or in place from Phase 27. The validation records the owner accepting or replacing each one. | The owner asked for samples without visible marking. Principle 4 bans placeholders posing as real *claims*, and descriptive copy the owner signs off is real copy. | Owner, 2026-10-10; mission principle 4 |
| D3 | **Each pillar card lists its services with name and summary, linking to `/services/[slug]`.** | It keeps all six legacy service descriptions visible, so nothing on the live page is lost when the homepage replaces it. It links into Phase 5's pages (the slugs are fixed in Phase 2, D6). | Phase 2 D5, D6 |
| D4 | **Every pillar gets a process strip**, Growth included ("Audit → Plan → Grow", sample). Steps are names only, with no lines under them. A strip is hidden when its pillar is hidden. | Three pillars with two strips would look unfinished. The roadmap names only two strips, so it is amended. Names only keeps the unapproved copy small. | Owner, 2026-10-10 ("start with these samples") |
| D5 | **The featured-work section says plainly that work is coming** and links to `/portfolio`. It shows no fake tiles or stock images. Before the Milestone 1 release (Phase 16), the section must show real items, link to a populated `/portfolio`, or be removed. That gate is recorded in `validation.md` and carried into the Phase 16 spec. | Principle 4: a placeholder is clearly marked and never shown in production as if it were real. Database-backed featured items only arrive in Phase 23, after the Phase 16 release. | Mission principle 4; roadmap Phases 16, 23 |
| D6 | **No proof points.** The README tree comment "core metrics" is dropped, and open question 11 stays open. | No real numbers or testimonials have been supplied. | Roadmap open question 11 |
| D7 | **Lint enforces the helpers.** `no-restricted-imports` in `app/**` and `components/**` bans `content/defaults` entirely and the value `services` from `content/services`. Type imports and `pillars` stay allowed. | `tech-stack.md` → *Architectural rules* 3 says public code never filters the raw list, and *In-place CMS* 4 says copy goes through `block()`. A lint rule makes both mechanical for Phases 4–23. | `tech-stack.md` → *Architectural rules* 3 |
| D8 | **"Every text string is keyed" is tested.** A Playwright test collects each visible text node in `<main>`, leaving out `aria-hidden` decoration such as the step arrows. It asserts that each node exactly equals a value in `content/defaults.ts`. | It turns the roadmap's "Done when" into a check that fails when someone hard-codes a string. | Roadmap Phase 3 "Done when" |
| D9 | **One button style for primary CTAs.** `ButtonLink` uses a `brand-deep` fill with an `fg` label (5.03:1). Hover lifts the button and never switches the fill to `brand`. `home.cta.button` is reused by the hero and the CTA section. | `fg` on `brand` is 4.02:1, which is not allowed for text. The two buttons do the same thing, so one key means one edit. | `tech-stack.md` → *Design tokens* |

## Constraints

- **C1 — No new dependencies.**
- **C2 — Static.** `/` stays `○` (prerendered) in the build route table.
- **C3 — Existing guards hold.** The Phase 1 e2e suite (layout at 360, 768 and 1440px, rendered contrast of every text element, reduced motion, mobile nav) passes unchanged against the new page.
- **C4 — Server Components only.** The homepage adds no client component.
