# Plan — Phase 2 content defaults

Scope, decisions (D1–D10) and constraints (C1–C4) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 1. Constitution first

- [x] 1.1 `roadmap.md`: open question 6 marked answered (six services, `BRANDING` dropped, CMS muting requested). Muting is threaded through Phases 2, 3, 4, 5, 14, 18, 21 and 31, and the developer-content note is updated.
- [x] 1.2 `tech-stack.md`: the muting paragraph in *Architectural rules* 3, the editor row in *Roles*, *In-place CMS* 8 (service muting in place, with the old item 8 renumbered to 9), and *Schema decisions* (`BRANDING` row, `ServiceSetting` row).
- [x] 1.3 README: the §5 enum comment, the `ServiceSetting` model and the §4 D edit-mode bullet.

## 2. Keys and defaults

- [x] 2.1 `lib/content/keys.ts`: `BLOCK_KEY_PREFIXES`, `BLOCK_KEY_PATTERN` (`RegExp`) and the `BlockKeyShape` template-literal type (D4).
- [x] 2.2 `content/defaults.ts`: every key in the spec's inventory with its verbatim value, `as const satisfies Record<BlockKeyShape, string>` (D4, D5).
- [x] 2.3 `lib/content/block.ts`: `BlockKey` and async `block(key)`, which throws on an unknown key (D2, D3).

## 3. Services

- [x] 3.1 `content/services.ts`: the `ServiceCategory` union, the `pillars` list, and the `services` list (six entries, as in the spec's table, `muted: false`), typed so that `nameKey` / `summaryKey` must be `BlockKey`s (D6, D8).
- [x] 3.2 `lib/content/services.ts`: `resolveVisibility(services, overrides?)`, `visibleServices()` and `visiblePillars()` (D7).
- [x] 3.3 `lib/site.ts`: header comment updated to point at this spec (D9).

## 4. Tests

- [x] 4.1 `lib/content/block.test.ts`: every default is returned, the `@ts-expect-error` unknown key fails, the runtime throws, every key matches the pattern, and the value rules hold (C3).
- [x] 4.2 Verbatim table test: each legacy string equals its default (D5).
- [x] 4.3 `lib/content/services.test.ts`: the config invariants (spec Scope 8), the README enum drift guard (D8), and the muting cases (D7).

## 5. Verify and open the PR

- [x] 5.1 Work through every item in [`validation.md`](validation.md).
- [x] 5.2 **Ask the owner first:** push the branch and open the PR `feature/phase-02-content-defaults` → `develop`, linking this spec folder.
