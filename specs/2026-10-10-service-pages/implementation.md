# Implementation log — Phase 5 service detail pages

## Progress

- **2026-10-10** — Kickoff.
  - Branch `feature/phase-05-service-pages` created from `develop` at `d4f9612` (Phase 4 merged).
  - No owner copy exists for included items or deliverables, so 44 strings are proposed as sample copy for review on the preview (D3).
  - JSON-LD approach checked before design (D5). The Next.js 16 JSON-LD guide uses `dangerouslySetInnerHTML`, which is lint-banned here. On React 19.3, `renderToString(<script type="application/ld+json">{json}</script>)` writes the text raw: `&` and `"` are not entity-escaped, and `</script` becomes `</\u0073cript`. Escaping every `<` as `\u003c` first leaves nothing that can end the tag.
  - Spec folder written. The constitution amendment is the `tech-stack.md` row on `dangerouslySetInnerHTML`.
- **2026-10-10** — Plan groups 1–5 built.
  - Config: `includedKeys` and `deliverableKeys` on all six services. Copy: 44 **S** keys (45 after D9).
  - Helpers: `allServiceSlugs()`, `visibleServiceBySlug()` and `pillarOf()`, plus `lib/seo/json-ld.ts`.
  - Page: `app/(public)/services/[slug]/page.tsx`, with `ItemList`, `RelatedWork` (empty slot) and the shared `JsonLd`.
  - Tests: unit tests 198 → 347. `e2e/service-pages.spec.ts` covers the visible services plus the muted and unknown slugs. `e2e/shell.spec.ts` runs on 8 routes, and the keyed-text helper skips `<script>`.
  - Build: the six slugs are prerendered (`.html` and `.rsc` each, no postponed state). `/` and `/services` stay `○`.
  - The first build failed on `dynamicParams` (see *Deviations*). An unknown slug was a soft 404 (see *Issues and fixes*).
  - Negative tests, each an uncommitted change reverted with a reverse edit:
    - **Raw list:** `import { services } from "@/content/services"` in the service page failed `eslint` (`no-restricted-imports`).
    - **Hard-coded text:** `<p>NEGTEST hard-coded line</p>` on the service page failed the keyed-text e2e check with exactly `["NEGTEST hard-coded line"]`.
    - **Script break-out:** the Photography summary was set to end in `NEGTEST </script><script>alert(1)</script> <!-- x`. The built `photography.html` had exactly one `application/ld+json` block, containing no `<`. Its parsed `description` held the string intact, and the HTML had no raw `<script>alert(1)`.
    - **Banned prop:** not run. Claude Code's auto-mode classifier refused the temporary edit that adds `dangerouslySetInnerHTML` to `json-ld.tsx`. Substitute evidence: `eslint --print-config components/shared/json-ld.tsx` shows `react/no-danger` at level 2 (error). The owner decides whether that is enough, or runs the edit by hand.
    - Afterwards no `NEGTEST` string remained. Format, typecheck, lint and 347 unit tests pass.
  - Final local run:
    - frozen install and audit (no known vulnerabilities) both pass;
    - the build passes;
    - e2e passes 137/137 on one worker: 76 shell (9 per route × 8 routes, plus 4 nav and motion tests), 5 homepage, 7 services index and 49 service pages (8 per visible service × 6, plus the unknown slug).
    - The first final run failed one test: the unknown-slug test expected no `h1`, but Next's default not-found UI has `<h1>404</h1>`. The test now checks that no `h1` is a service name, and the spec passes 49/49.
  - Muted run, with Videography muted in the config and a fresh build:
    - `e2e/service-pages.spec.ts` and `e2e/services.spec.ts` passed 49/49, including "muted videography returns 404" and "shows no muted service".
    - The mute was reverted with a reverse edit.

- **2026-10-10** — PR #8 opened (`d1a0e2c`). CI is green: `ci` (including Playwright and the audit), `gitleaks`, `preview-headers` and Vercel (preview Ready).
  - Owner preview check: "/services/[...] all work, but there needs to be a back arrow to /services instead of clicking the back browser button".
  - Added D9: "← All services" above the eyebrow, with one new **S** key, `services.detail.back` (45 in total), and an e2e test that follows the link to `/services`.
  - The arrow is `brand` at 20px extra-bold, because `brand` on `ink` is a large-text pairing only (`lib/design/tokens.ts`).
  - Local results: 350 unit tests pass, the build passes, and `e2e/service-pages.spec.ts` plus `e2e/shell.spec.ts` pass 131/131.

## Deviations from plan

| Item | Planned | Actual | Reason |
| --- | --- | --- | --- |
| Unknown slugs (D1) | `dynamicParams = false` 404s them without rendering | `notFound()` alone: the slug finds no visible service | Next 16.4 fails the build: "Route segment config "dynamicParams" is not compatible with `nextConfig.cacheComponents`". The spec was amended before re-building. |

## Issues and fixes

- **Unknown slug answered 200.** `GET /services/branding` returned 200 with Next's not-found page and `<meta name="robots" content="noindex"/>`.
  - The build stores a Partial Prerender fallback shell for `/services/[slug]` (`[slug].meta`: `status 200`, `postponed`). An unknown slug resumes that shell, which has already started streaming before `notFound()` runs.
  - The Next.js docs (`not-found.mdx`, "Calling `notFound()` after streaming has started") confirm this, and name a Proxy check as the only request-time route to a real 404.
  - The six service pages are fully static: each has `.html` and `.rsc` and no `postponed` state.
  - Muting check: with Videography muted, its `.meta` held `status 404`, the server answered 404, and `/` and `/services` held no link to it. Photography still answered 200. Videography was then unmuted with a reverse edit.
  - **Owner decision (2026-10-10): accept the soft 404** rather than add `proxy.ts` now. The e2e test checks for the not-found page with `noindex` and accepts 200 or 404.

## Carried forward

- Unknown `/services/<slug>` is a soft 404 (D1). If Phase 24 adds `proxy.ts` for `/cms`, its matcher can also return a real 404 for slugs outside `allServiceSlugs()`.
