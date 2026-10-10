# Phase 2 — Content defaults + `block()` helper

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 1, Phase 2
- **Branch:** `feature/phase-02-content-defaults` (from `develop`)
- **Started:** 2026-10-10

## What and why

Give every later page one way to read copy and one way to read services. Phases 3–6 then render text through `block(key)` and services through `visibleServices()`. Milestone 3 can later put the CMS behind both helpers (`ContentBlock` in Phase 27, `ServiceSetting` in Phase 31) without touching any page (`tech-stack.md` → *In-place CMS* 4 and 8).

This phase also ports the current site's copy into the new codebase, **verbatim**, so nothing written for the live page is lost or reworded by accident (mission principle 4).

No page changes what it renders in this phase. The first consumer is the Phase 3 homepage.

## Constitution sections this phase relies on

- `mission.md` → *Guiding principles* 4 (honest claims), 7 (spec-driven) and 10 (staff self-service, in place)
- `tech-stack.md` → *Architectural rules* 3 (services are config, **muting**), *In-place CMS* 4 (key pattern, `block()` from Phase 2) and 8 (service muting in place), *Schema decisions* (`ServiceCategory`, `ServiceSetting`)
- `roadmap.md` → open question 6 (answered in D1)

## Scope

1. **Constitution updates first** (done at kickoff, in this branch):
   - `roadmap.md` marks open question 6 answered and threads muting through Phases 2, 3, 4, 5, 14, 18, 21 and 31.
   - `tech-stack.md` updates *Architectural rules* 3, *Roles*, *In-place CMS* 8 (new) and *Schema decisions* (`BRANDING` dropped, `ServiceSetting` added).
   - README §4 D and §5 get the same changes (enum comment and the `ServiceSetting` model).
2. **`content/defaults.ts`.** One `as const` object maps each block key to its default string (D3–D5). It is the only home for copy, and staff edits in Phase 27 override it per key.
3. **`lib/content/keys.ts`.** It holds the CMS key pattern `^(home|about|services|portfolio|contact|footer)\.[a-zA-Z0-9.]+$` as a single exported `RegExp`, plus a matching template-literal type. Phase 27's Zod check imports the same constant (D4).
4. **`lib/content/block.ts`.** `block(key: BlockKey): Promise<string>` returns the default for `key` (D2). `BlockKey` is `keyof typeof defaults`, so an unknown key fails `pnpm typecheck`. An unknown key forced through at runtime (`as never`) throws.
5. **`content/services.ts`** (D6–D8):
   - `ServiceCategory`: a TS union of the six README §5 values.
   - Three pillars, `production`, `growth` and `build`, each with a name key.
   - Six services in display order. Each has `category`, `id` (the camelCase key segment), `slug` (URL), `pillar`, `muted: false`, `nameKey` and `summaryKey`.
6. **`lib/content/services.ts`**, the only way public code reads services (D7):
   - `resolveVisibility(services, overrides?)` is a pure function. It drops muted services and keeps config order. `overrides` is the per-category muted map that Phase 31 fills from `ServiceSetting`.
   - `visibleServices(): Promise<readonly Service[]>`.
   - `visiblePillars(): Promise<readonly { pillar, services }[]>` leaves out any pillar with no visible service.
7. **`lib/site.ts`** keeps the site name, nav and contact details (D9). Only its header comment changes, to point at this spec instead of "Phase 2 moves these strings".
8. **Unit tests** (Vitest, D10):
   - `block()` returns each default, and an unknown key is a type error (`@ts-expect-error`) and a runtime throw.
   - Every key matches the CMS pattern. Every value is non-empty, trimmed, at most 5,000 characters and free of HTML tags and entities.
   - Verbatim port: a table of the legacy strings equals the defaults.
   - Services config:
     - six services in three pillars, grouped exactly as *Architectural rules* 3;
     - unique categories, ids and slugs;
     - slugs match `^[a-z0-9-]+$`;
     - every `id` is the camelCase form of its category;
     - at least one service is visible.
   - Drift guard: the `ServiceCategory` union equals the README §5 enum.
   - Muting: a muted service is left out, config order is kept, a pillar whose services are all muted is left out, and overrides win over config defaults in both directions.

## Out of scope

- Rendering any of this copy (Phases 3–6). No page output changes in Phase 2.
- Page metadata (Phase 3 for `/`, Phase 14 site-wide). `home.meta.description` is ported now and wired later.
- New copy: pillar descriptions, service detail text and process steps (Phases 3–5, owner-supplied). Phase 2 only ports what exists, plus the pillar names already fixed by the constitution.
- The database, `ContentBlock`, `ServiceSetting`, `server-only` and any CMS UI (Phases 7, 27 and 31).
- Changes to the security headers or CSP. None are needed.

## Key inventory (verbatim port, D5)

Every user-visible string in `git show main:index.html` goes to one of these places. HTML entities are decoded (`&amp;` → `&`, `&middot;` → `·`, `&copy;` → `©`). Everything else is kept exactly, including the em dashes and straight apostrophes.

| Legacy location | String | Destination |
| --- | --- | --- |
| `<title>` | RedHat Media | `siteName` in `lib/site.ts` (already there) |
| `<meta name="description">` | RedHat Media — photography, videography, digital marketing, social media management, and web development. If it's media, it's ours to handle. | `home.meta.description` |
| Header wordmark | RED / HAT / MEDIA | `components/wordmark.tsx` (brand mark, already there) |
| Hero tagline | If it's media, it's ours to handle. | `home.hero.tagline` |
| Hero subtext | Photography. Videography. Digital & social media marketing. Online presence management. Websites & web apps. One team, every medium. | `home.hero.subtext` |
| About paragraph | RedHat Media (RHM) is a registered Nigerian media company built on one simple idea: … not juggling five different vendors. | `about.intro` |
| Section heading | What We Do | `home.services.heading` |
| Service cards (×6) | Name and one-line description | `services.<id>.name`, `services.<id>.summary` |
| Footer brand, contact row and RC line | RedHat Media · email · phone · Lagos, Nigeria · RC 1379619 · © {year} RedHat Media | `lib/site.ts` plus the footer component (already there, D9) |

Pillar names come from `tech-stack.md` → *Architectural rules* 3, not from `index.html`: `services.pillars.production.name` "Production", `services.pillars.growth.name` "Growth" and `services.pillars.build.name` "Build".

## Services config (D6)

| Order | `category` | `id` | `slug` | Pillar | Name (verbatim) |
| --- | --- | --- | --- | --- | --- |
| 1 | `PHOTOGRAPHY` | `photography` | `photography` | production | Photography |
| 2 | `VIDEOGRAPHY` | `videography` | `videography` | production | Videography |
| 3 | `DIGITAL_MARKETING` | `digitalMarketing` | `digital-marketing` | growth | Digital Marketing |
| 4 | `SOCIAL_MEDIA` | `socialMedia` | `social-media-marketing` | growth | Social Media Marketing |
| 5 | `ONLINE_PRESENCE` | `onlinePresence` | `online-presence-management` | growth | Online Presence Management |
| 6 | `WEB_APP` | `webApp` | `web-app-development` | build | Web & App Development |

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **Six services.** `BRANDING` is not offered and is dropped from the enum. | Answers roadmap open question 6. The current site sells six. Adding Branding later is an enum value plus a config entry, which Phase 4's "Done when" proves. | Owner, kickoff Q (open question 6) |
| D2 | **`block()` is async** (`Promise<string>`), even though Phase 2 only reads an in-memory object. | Phase 27 adds a cached database read behind it. If `block()` became async only then, every call site written in Phases 3–6 would need rewriting, which `tech-stack.md` → *In-place CMS* 4 rules out ("turning on editing later needs no rewrite"). Server Components already await freely, and the footer is async. | Kickoff analysis |
| D3 | **Unknown keys fail twice.** At compile time, `BlockKey = keyof typeof defaults`, and a test holds a `@ts-expect-error` call that `pnpm typecheck` checks. At runtime, `block()` throws on a key missing from `defaults`. | The roadmap's "Done when" needs the type-check failure. The runtime throw covers a key widened through a cast, and keys arriving from the database or a URL later on. | Roadmap "Done when"; kickoff analysis |
| D4 | **Key scheme `<page>.<section>.<name>`**, using camelCase segments and only `[a-zA-Z0-9.]` after the prefix. The `defaults` object uses `satisfies Record<BlockKeyShape, string>` (a template-literal type for "prefix, dot, rest"), so a key outside the six prefixes is a type error. A test also runs every key through the exported `RegExp`. The `RegExp` lives once, in `lib/content/keys.ts`. | Phase 27's `updateContentBlock` validates keys with this exact pattern, so a default that the CMS could never override would be a latent bug. One exported constant means the type, the test and the Zod schema cannot drift apart. | `tech-stack.md` → *In-place CMS* 4 |
| D5 | **Verbatim port with an inventory.** Every user-visible legacy string has a recorded destination (table above). Entities are decoded, and nothing else changes. A Vitest table pins each ported string. A one-off Node check against `git show main:index.html` confirms the table itself (validation). | "Port every string verbatim" is only checkable if each string has a known home. The test is self-contained, so it does not depend on `main` still holding `index.html` (it is deleted in Phase 16). | Roadmap Phase 2; mission principle 4 |
| D6 | **Service identity.** `category` is the README enum value, and `id` is its camelCase form (used in block keys, because the CMS pattern bans `_`). `slug` is the full service name in kebab case, which Phase 5 uses for URLs. The display order and pillar grouping follow *Architectural rules* 3 and the current page. | Three names for three jobs: the database enum, the CMS key and the public URL. Descriptive slugs help search (Phase 14). Phase 5 inherits these slugs, so changing one later needs a spec update and a redirect. | `tech-stack.md` → *Architectural rules* 3; kickoff analysis |
| D7 | **Muting is built in now.** Each service has a `muted` default (`false` for all six). Public code reads services only through `visibleServices()` / `visiblePillars()`, which are async for the same reason as D2. Visibility is decided in one pure function, `resolveVisibility(services, overrides?)`. Phase 31 passes in `ServiceSetting` overrides, and the tests exercise it now without a database. | The owner wants staff to mute a service from the CMS. If Phases 3–23 read the raw list, Phase 31 would have to find and patch every consumer. With one helper, Phase 31 changes a single function. | Owner, kickoff (mute request); `tech-stack.md` → *Architectural rules* 3 |
| D8 | **`ServiceCategory` is a TS union until Phase 7**, when Prisma's generated enum replaces it. Until then a test parses `enum ServiceCategory { … }` from README §5 and checks that it equals the union. | There is no Prisma client before Phase 7. The drift test keeps the config and the schema blueprint in step, in the same way as Phase 1's token-copy guard. | Kickoff analysis |
| D9 | **Contact details, nav labels and the site name stay in `lib/site.ts`, not `block()`.** This supersedes Phase 1 D12's "footer.* keys". | They are data, not copy. The email and phone drive `mailto:` and `tel:` links, and later the `LocalBusiness` JSON-LD (Phase 14) and emails (Phase 20). A free-text CMS edit could break the link or desync it from the JSON-LD. Nav labels have no allowed key prefix (`nav`/`site` are not in the CMS pattern) and name routes. If staff need to edit contact details later, that needs a typed field (like `updateRecordField`), not a text block, and gets its own spec. | Kickoff analysis |
| D10 | **Tests live beside the helpers** in `lib/content/*.test.ts`. No new libraries are added. | Matches `lib/design/` and `lib/security/`. Vitest already includes `**/*.test.ts`, and `pnpm typecheck` covers test files, which D3 relies on. | Existing repo layout |

## Constraints

- **C1 — No new dependencies.** Plain TypeScript and Vitest only.
- **C2 — No rendered change.** `pnpm build`'s route table matches Phase 1 (`○ /`), and the e2e suite still passes unchanged.
- **C3 — Values are plain text.** Bold-only rich text is a Phase 27 editor feature. Defaults hold no markup, which a test enforces.
- **C4 — Server-only later.** `block()` gains `import "server-only"` when it first reads the database (Phase 27). It is left out now so Vitest can import it without a `react-server` condition.
