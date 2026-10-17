# Phase 4 — Services index

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 1, Phase 4
- **Branch:** `feature/phase-04-services-index` (from `develop` at `bfc7c56`)
- **Started:** 2026-10-10

## What and why

Add `/services`, the page behind the header's "Services" link. It lists the three pillars, each with its visible services, and links every service to its page at `/services/[slug]` (Phase 5).

The homepage gives one overview card per pillar. This page goes one level deeper and gives each service its own card, grouped under its pillar. It is built only from `visiblePillars()` and `block()`. Adding a service to `content/services.ts` therefore adds it to the page, and muting one removes it, with no page code changes.

## Constitution sections this phase relies on

- `mission.md` → *Guiding principles* 1 (inquiry first), 4 (honest claims) and 8 (creative, but restrained)
- `tech-stack.md` → *Architectural rules* 3 (services through `visibleServices()`, enforced by lint), *Design tokens* (contrast rules), *In-place CMS* 4 (key pattern)
- `roadmap.md` → Phase 4
- Phase 2 spec → D6 (slugs fixed), D7 (muting helpers)
- Phase 3 spec → D1 (card surface), D2 (sample copy adopted on preview), D4 (process steps), D7 (lint guard), D8 (keyed-text check), D9 (one primary button)

## Scope

1. **Constitution updates first** (in this branch): the README tree comment for `services/` names the index and all six services (D7).
2. **Copy** (`content/defaults.ts`): three new keys for the page heading, intro and meta description (key table below). They are **sample copy for the owner to accept or replace on the preview** (D2).
3. **Shared components** (`components/shared/`): `ButtonLink` and `Cta` move here from `components/home/`, and a `StepList` is extracted from the homepage process strip (D4).
4. **Page** (`app/(public)/services/page.tsx`):
   1. **Header:** `h1` heading and intro line.
   2. **One section per visible pillar:** `h2` pillar name, the pillar summary, its process steps, then a card per visible service. Each card has the service name as an `h3` link to `/services/[slug]` and the service summary (D1).
   3. **CTA:** the homepage CTA section, same keys (D4).
5. **Metadata:** title `<heading> | RedHat Media` and description `services.meta.description` (D3).
6. **Tests:**
   - `e2e/services.spec.ts` derives what the page should show from the config through the same helpers, so it follows any added or muted service (D5).
   - The keyed-text check moves to a shared e2e helper and runs on `/services` too (D5).
   - The Phase 1 layout and contrast checks run on `/services` as well as `/` (D6).

## Out of scope

- The service pages `/services/[slug]`. They 404 on previews until Phase 5, as the homepage links already do (Phase 3, *Out of scope*).
- Pricing, packages or any proof points (roadmap open question 11).
- Service imagery (Phases 8 and 28).
- Site-wide metadata, OG images, JSON-LD and the title template (Phase 14).

## Key table

**S** = sample copy written in Phase 4, for the owner to accept or replace on the preview (D2).

| Key | Value | |
| --- | --- | --- |
| `services.index.heading` | Services | S |
| `services.index.intro` | Production, growth and build: one team for every medium your business needs. | S |
| `services.meta.description` | Photography, videography, digital and social media marketing, online presence management, and web and app development from RedHat Media in Lagos. | S |

Pillar names, summaries and steps, and service names and summaries, come from Phases 2 and 3. The CTA reuses `home.cta.heading`, `home.cta.body` and `home.cta.button`.

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **A section per pillar, a card per service.** Each pillar section has its name (`h2`), summary and process steps, then a grid of service cards: one column on phones, two from `md`, three from `lg`. Cards use the Phase 3 surface: `ink`, a `line` border and a `brand` top edge, with `muted` text only at 16px or more. The service name is the card's link. | The homepage already shows a card per pillar, so repeating it here would add nothing. A card per service gives each service, and its future page, a clear entry point. | Phase 3 D1; `tech-stack.md` → *Design tokens* |
| D2 | **New copy is sample copy, reviewed on the preview.** The three **S** strings make no claims. As in Phase 3, the page shows no "sample" label, and the validation records the owner accepting or replacing each one. | The handoff expected no owner copy beyond a heading, so the strings are proposed here rather than blocking the phase. | Phase 3 D2; mission principle 4 |
| D3 | **Title is the page heading plus the site name.** It is built from `services.index.heading` and `siteName`, so renaming the heading renames the tab. The description is keyed. | Every route needs its own title before Phase 14, which adds the template. `siteName` is data (Phase 2 D9). | Phase 2 D9; roadmap Phase 14 |
| D4 | **Shared sections live in `components/shared/`.** `ButtonLink` and `Cta` move there from `components/home/`. `StepList` (the arrowed step names) is extracted from `ProcessStrip` and used by both pages. The CTA keeps its `home.cta.*` keys, so one edit changes both pages. | Two pages now use them. One component and one set of keys mean the CTA and the steps stay identical everywhere. | Phase 3 D9 |
| D5 | **Tests follow the config.** `e2e/services.spec.ts` computes the expected pillars and services with `groupByPillar(resolveVisibility(services))`, the code path `visiblePillars()` uses. It checks that every visible service links to its slug and that no muted service appears. The keyed-text check becomes `e2e/keyed-text.ts` and runs on `/` and `/services`. | Adding or muting a service then changes the page *and* the expectation, so the "Done when" holds as a passing test, not just a one-off negative test. | Roadmap Phase 4 "Done when"; Phase 3 D8 |
| D6 | **Shell checks cover `/services`.** The Phase 1 layout (no horizontal overflow) and rendered-contrast tests loop over `/` and `/services` at 360, 768 and 1440px. | The new page adds text on new surfaces; the contrast check must see it. | Phase 1 "Done when"; Phase 3 C3 |
| D7 | **README tree comment updated.** `services/` reads "Services index and one page per service (six services in three pillars)". | The old comment named four services and only detail pages. | Phase 2 (six services) |

## Constraints

- **C1 — No new dependencies.**
- **C2 — Static.** `/services` is `○` (prerendered) in the build route table, and `/` stays `○`.
- **C3 — Existing guards hold.** The Phase 1 and Phase 3 e2e suites pass unchanged in what they assert. Only the routes they visit and the helpers' locations change.
- **C4 — Server Components only.** The page adds no client component.
