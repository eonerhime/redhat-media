# Plan — Phase 5 service detail pages

Scope, decisions (D1–D8) and constraints (C1–C5) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 1. Constitution first

- [x] 1.1 `tech-stack.md`: the `dangerouslySetInnerHTML` row records the `<JsonLd>` approach (D5).

## 2. Config and copy

- [x] 2.1 `content/services.ts`: `includedKeys` and `deliverableKeys` on the `Service` type and on all six services (D2).
- [x] 2.2 `content/defaults.ts`: the 45 **S** keys from the spec's key table (D3).
- [x] 2.3 `lib/content/block.test.ts`: the "ported vs. new copy" test lists the Phase 5 keys.

## 3. Helpers

- [x] 3.1 `lib/content/services.ts`: `allServiceSlugs()` and `visibleServiceBySlug()`, with unit tests, plus key-pattern tests for the new lists (D1, D2).
- [x] 3.2 `lib/seo/json-ld.ts`: `serializeJsonLd()` and `serviceJsonLd()`, with unit tests (D5).

## 4. Components and page

- [x] 4.1 `components/shared/json-ld.tsx` (D5).
- [x] 4.2 `components/services/related-work.tsx`: the empty slot (D6).
- [x] 4.3 `app/(public)/services/[slug]/page.tsx`: static params, `notFound()`, metadata, the page sections and the JSON-LD (D1, D4, D7).

## 5. Tests

- [x] 5.1 `e2e/keyed-text.ts`: skip `<script>` contents (D8).
- [x] 5.2 `e2e/service-pages.spec.ts`: config-derived checks per visible service, plus a 404 for muted slugs and the not-found page for an unknown slug (D1, D8).
- [x] 5.3 `e2e/shell.spec.ts`: `routes` includes every visible service page (D8).

## 6. Verify and open the PR

- [x] 6.1 Work through every item in [`validation.md`](validation.md).
- [ ] 6.2 Push the branch and open the PR `feature/phase-05-service-pages` → `develop`.
