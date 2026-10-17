# Phase 6 — About page

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 1, Phase 6
- **Branch:** `feature/phase-06-about` (from `develop` at `698dadb`)
- **Started:** 2026-10-11

## What and why

Add `/about`. The header nav has linked to it since Phase 1, and the link 404s today. The page tells a prospect:

- who RedHat Media is, who leads it and since when;
- why one team for every medium beats one supplier per job;
- how the three pillars (Production, Growth, Build) feed each other;
- how RHM builds software: Spec-Driven Development.

This answers "who are these people?" before the inquiry (mission principles 1 and 3), using facts the owner supplied and sample copy the company will edit (D3).

## Constitution sections this phase relies on

- `mission.md` → *Guiding principles* 1 (inquiry first), 3 (credibility), 4 (honest claims), 7 (spec-driven) and 8 (creative, but restrained); *Who we serve* 3 (SDD as engineering proof)
- `tech-stack.md` → *Architectural rules* 1 (server-first, static) and 3 (services through the helpers; muting removes a service everywhere); *In-place CMS* 4 (key pattern, `about.` prefix); *Security baseline* (report-only CSP); *Design tokens* (contrast rules)
- `roadmap.md` → Phase 6; Phase 14 adds the title template, OG images and `Organization` JSON-LD; Phase 27 makes the copy editable in place
- Phase 2 spec → D3–D5 (`block()` and defaults), D9 (site data stays in `lib/site.ts`)
- Phase 3 spec → D2 (sample copy reviewed on the preview), D8 (keyed-text check), D9 (one primary button)
- Phase 4 spec → D1 (card surface), D3 (title), D4 (shared components), D5 (tests follow the config), D6 (shell checks per route)

No constitution file changes. The Phase 1 spec gets a dated amendment for the sticky header (its D14; D10 here). The roadmap row, the README tree comment ("Agency story, mission, and multidisciplinary capabilities") and the key pattern already cover the page.

## Scope

1. **Config** (`content/services.ts`): each pillar gains `roleKey`, the key of one sentence on its part in the whole (D4).
2. **Copy** (`content/defaults.ts`): **21 new keys**: 3 owner facts (**O**) and 18 sample strings (**S**) (D3). `about.intro` (ported in Phase 2) is reused unchanged.
3. **Page** (`app/(public)/about/page.tsx`), all Server Components (D5):
   1. **Header:** the `h1` and `about.intro`.
   2. **Our story:** an `h2`, the story paragraph and a facts list (D6).
   3. **One team, every medium:** an `h2` and one paragraph.
   4. **How the pillars work together:** an `h2`, an intro line and one card per visible pillar (D4).
   5. **How we build:** an `h2`, the SDD paragraph, the Build pillar's `StepList` and a text link to the Build service page. It is shown only while the Build pillar is visible (D7).
   6. **CTA:** the shared `Cta` (Phase 4 D4).
4. **Metadata:** title `<about.heading> | RedHat Media` and `about.meta.description` (D8).
5. **Tests:**
   - `e2e/about.spec.ts` derives the pillar and SDD expectations from the config (D9).
   - `e2e/shell.spec.ts` adds `/about` to `routes`.
   - Unit tests cover the `roleKey` pattern and the "ported vs. new copy" list.
6. **Shell amendment: sticky header** (D10). The site header stays at the top of the viewport while the page scrolls, on every public route and at every width. This amends Phase 1 (header, D14).

## Out of scope

- Team photos, a team grid or bios beyond the founder line. No assets exist (roadmap open question 4).
- Proof points: project counts, client logos, testimonials (open question 11).
- `Organization` / `Person` JSON-LD with `founder` and `foundingDate` (Phase 14; the keyed facts here are ready for it).
- OG image and the title template (Phase 14).

## Key table

**O** = owner fact (2026-10-11). **S** = sample copy written in Phase 6 for the company to accept or replace (D3). The story paragraph is invented history, written at the owner's request for the company to correct. S strings name no clients, numbers, awards or guarantees (mission principle 4).

| Key | Value | |
| --- | --- | --- |
| `about.meta.description` | Who RedHat Media is: a Lagos media company where one team handles photography, video, marketing and software. | S |
| `about.heading` | About us | S |
| `about.story.heading` | Our story | S |
| `about.story.body` | Emo Onerhime founded RedHat Media in Lagos as a photography and video studio. As clients asked for more, first campaigns to share their content and then websites to hold it, the studio grew into a full media company. One idea has stayed the same throughout: a business should have one dependable partner for all of its media, not a different supplier for every job. It still shapes how we work: one brief, one team and one standard across everything we make. | S |
| `about.facts.founded` | Founded | S |
| `about.founded.year` | 2019 | O |
| `about.facts.leadership` | Leadership | S |
| `about.founder.name` | Emo Onerhime | O |
| `about.founder.title` | Founder, Managing Director and CEO | O |
| `about.facts.registered` | Registered | S |
| `about.facts.based` | Based in | S |
| `about.oneTeam.heading` | One team, every medium | S |
| `about.oneTeam.body` | Most businesses need more than one kind of media work. Hiring a photographer, a video crew, a marketing agency and a developer separately means four briefs, four timelines and nobody who sees the whole picture. At RHM one team holds the brief from start to finish, so your photos, videos, campaigns and website look and sound like the same business. | S |
| `about.pillars.heading` | How the pillars work together | S |
| `about.pillars.intro` | Our services fall into pillars. Each stands on its own, and they work best together. | S |
| `about.pillars.production.role` | Production creates the photos and video that show what your business does. | S |
| `about.pillars.growth.role` | Growth puts that content in front of the right people and keeps your presence active. | S |
| `about.pillars.build.role` | Build gives it all a home: a fast, secure website or app that turns visitors into inquiries. | S |
| `about.sdd.heading` | How we build: Spec-Driven Development | S |
| `about.sdd.body` | Every website and app we build starts with a written spec: what it must do, who it is for and how we will know it works. You agree the spec before any code is written. We then build in small steps, check each one against the spec, and ship only when it passes. This website was built the same way. | S |
| `about.sdd.link` | See Web & App Development | S |

Pillar names and steps come from Phases 2 and 3, the registration number and location from `lib/site.ts` (Phase 2 D9), and the CTA from `home.cta.*` (Phase 4 D4).

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **One static route, `/about`.** It renders as `○` in the build. | Nothing on it varies per request. | `tech-stack.md` → *Architectural rules* 1 |
| D2 | **The founder is a fact, not sample copy.** Emo Onerhime, Founder, Managing Director and CEO, and the founding year come from the owner. They are keyed (`about.founder.*`, `about.founded.year`) rather than put in `lib/site.ts`, so staff can update them in place from Phase 27. Copy refers to the founder by name and title, never by pronoun. | Mission principle 4 allows only real facts. Keying them keeps them editable and ready for Phase 14's `Organization` JSON-LD. | Owner, 2026-10-11 (corrected the same day: Emo Onerhime, 2019) |
| D3 | **New copy is sample copy, reviewed on the preview.** The 18 **S** strings are proposed for the company to accept or replace. As in Phases 3–5, the page shows no "sample" label, and the validation records the owner's decision. The owner expects the company to edit them. | This keeps the phase moving while the owner decides. | Owner, 2026-10-11; Phase 3 D2 |
| D4 | **One card per visible pillar, each with its own role sentence.** `Pillar` gains `roleKey` (`about.pillars.<id>.role`, checked by a unit test). Cards come from `visiblePillars()`, so a fully muted pillar loses its card and its sentence together. No copy names all three pillars or counts them. Each card is the Phase 4 surface (`ink`, `line` border, `brand` top edge) with the pillar name as an `h3`, the role sentence and the pillar's `StepList`. | A shared paragraph naming all three would be wrong once a pillar is muted. A typed key means a new pillar cannot type-check without its sentence. | `tech-stack.md` → *Architectural rules* 3; Phase 3 D4; Phase 4 D1 |
| D5 | **Layout.** The header matches `/services`: `display-1` `h1`, then the intro in `text-lg muted`. Each `h2` section sits in its own `border-t` band and is a labelled region. The pillar cards are a grid, three columns from `md`. The only button is the CTA; the SDD link is a text link. | It uses the same visual language as `/services` and `/services/[slug]`, with one primary button. The labelled regions let the e2e tests find each section by name. | Phase 3 D9; Phase 4 D1 |
| D6 | **Facts list.** "Our story" ends with a `dl`: Founded → year, Leadership → name and title, Registered → `contact.registration`, Based in → `contact.location`. Labels are keyed. Registration and location stay site data in `lib/site.ts`, the same values the footer shows. | Plain, checkable facts build credibility without invented metrics. Reusing the site data keeps one source for the RC number and location. | Mission principles 3, 4; Phase 2 D9 |
| D7 | **The SDD section shows only while the Build pillar is visible.** Its link goes to the first visible Build service's page (today `/services/web-app`). | A muted service disappears from the whole public site. Describing how RHM builds software while software is not offered would invite inquiries the site then refuses (mission principle 1). | Owner asked for advice, 2026-10-11; adopted as recommended, and the owner can reverse it on the preview. `tech-stack.md` → *Architectural rules* 3 |
| D8 | **Title and description.** Title `About us \| RedHat Media` (`about.heading` plus the site name) and `about.meta.description`, both through `block()`. | Same pattern as `/services` until Phase 14 adds a title template. | Phase 4 D3 |
| D9 | **Tests follow the config.** `e2e/about.spec.ts` checks the `h1` and `h2` order, the intro, the story, the facts list, one card per visible pillar (name, role, steps), the SDD section present only if Build is visible (body, steps, link `href`), the CTA, title, description, `aria-current` on the About nav item, and keyed text. `e2e/shell.spec.ts` adds `/about`. The keyed-text check also accepts the `lib/site.ts` contact values (the registration number and location in the facts list, D6), and only those, through an explicit list passed by the About test. | Muting a pillar changes the page and the expectations together, as in Phases 4 and 5. Site data is not copy (Phase 2 D9), so the check names the two values it allows rather than loosening for every page. | Phase 4 D5, D6 |
| D10 | **Sticky header.** `SiteHeader` gets `sticky top-0 z-40` and an opaque `bg-ink`, so page content never shows through it and the contrast check sees the same background as before. It stays visible the whole time; it does not hide on scroll down. The mobile menu panel still opens directly below it, because a sticky element is a containing block for its absolutely positioned children. `html` gets `scroll-padding-top: 6rem`, a little more than the header's height (about 80px), so the skip link and any in-page anchor land below the header rather than under it. CSS only: no JavaScript and no motion are added. `e2e/shell.spec.ts` checks, per route and width, that the header is still at the top of the viewport after scrolling to the bottom. The 360px test also checks that the menu opens in view after scrolling. | Owner request, 2026-10-11. CSS sticky keeps the header a Server Component (*Architectural rules* 1). A hide-on-scroll header would need a client scroll listener and new motion, for little gain on pages this short. | Owner, 2026-10-11; amends Phase 1 spec (D14) |

## Constraints

- **C1 — No new dependencies.**
- **C2 — Static.** `/about` is `○` in the route table. `/`, `/services` and the six service pages are unchanged.
- **C3 — Existing guards hold.** The Phase 1, 3, 4 and 5 e2e suites pass, unchanged in what they assert.
- **C4 — Server Components only.** No client component is added. The sticky header is CSS only (D10).
- **C5 — No hard-coded copy.** Every visible string on `/about` comes from `block()` or `lib/site.ts`.
