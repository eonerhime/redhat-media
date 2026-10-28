# Phase 27 — Editable text

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 3, Phase 27
- **Branch:** `feature/phase-27-editable-text` (from `develop` at `3980d49`); PR B gets its own branch from `develop` after PR A merges (D10)
- **Started:** 2026-10-28
- **Status:** owner answers A–J given 2026-10-28; waiting for "build it"

## What and why

Phase 26 gave editors and admins the Editing: On/Off pill, but nothing on the page can be edited yet. This phase makes the site's copy editable in place:

- the `ContentBlock` table, whose rows override `content/defaults.ts` per key;
- `block()` reading those rows through one cached read, so public pages stay pre-rendered;
- `<Editable>`, a ✎ button beside each visible text block that opens an editor dialog;
- the server action `updateContentBlock`, which saves, resets on an empty value, writes an `AuditEvent` and refreshes every page.

Every public component already reads its copy through `block()` (Phase 2, C4), so no copy moves.

## Constitution sections this phase relies on

- `mission.md` → *Users* 4 (editors work on the live pages through the toggle) and principle 10 (Editing Off shows exactly what a visitor sees).
- `tech-stack.md`:
  - *Architectural rules* 1 (public pages static; the session is never read on the server for them), 3 (copy only through `block()`), 5 (`requireRole` on every mutation), 8 (typed `{ ok, error }` results; the editor stays open on failure), 10 (labelled, keyboard-reachable edit controls), 12 (no `dangerouslySetInnerHTML`) and 13 (cache refresh after writes; the API is confirmed here, D6);
  - *In-place CMS* → *How it works* 3 (✎ always visible, one open editor at a time, Escape closes) and 4 (`<Editable>`, `updateContentBlock`, key pattern, 5,000 cap, empty resets);
  - *Schema decisions*: `ContentBlock` as in README §5.
- Roadmap Milestone 3 preamble: every mutation has refusal tests, a per-user `rateLimit` and an `AuditEvent`.
- Phase 2 spec: D2–D5 (`block()`, defaults, key scheme) and C4 (`block()` gains `import "server-only"` when it first reads the database).
- Phase 24 spec, D16 (✎ buttons). Phase 25 spec, D1–D7 (`requireRole`, `audit()` in the same transaction). Phase 26 spec, D1 amended (state in the `useSyncExternalStore` store, never React context) and D8 (`openKey`).
- MRU (`memories-r-us`), read before this spec, per the owner's rule that staff UX mirrors MRU: `src/components/editable.tsx`. It has a ✎ beside the text, opens a modal for every block, uses an input for short blocks and a textarea for long ones, adds a **B** button that wraps the selection in `**…**`, keeps the dialog open with the draft on failure, and shows the saved value at once.

## Scope

1. **Constitution first** (listed below).
2. **`ContentBlock` migration** (README §5 model, unchanged). It is additive, so it can merge on its own (D10).
3. **Cached read behind `block()`**: one `"use cache"` read of all rows, tagged `content`. A failed read falls back to the defaults (D6). `block()` gains `import "server-only"` (Phase 2, C4).
4. **Editable keys and kinds**: `lib/content/editable.ts` lists every key that may be edited, each with a kind that sets its input, its cap and whether bold is allowed (D1, D3, D4).
5. **Bold renderer**: `**bold**` becomes `<strong>` through React elements, never HTML (D3).
6. **`updateContentBlock`** server action (D4, D5, D7, D8).
7. **`<Editable>`** and the editor dialog, placed at every visible text block on the public pages (D1, D2, D9).
8. **Tests**: Vitest, database tests and a preview-e2e spec with a mocked session (see `validation.md`).
9. **The e2e skip fix** from the last handoff, in PR A (D11).

## Constitution changes (in PR A, before the code)

- `tech-stack.md`:
  - *Architectural rules* 13: the API is `updateTag("content")` inside the action, and all copy is one cached read tagged `content` (D6).
  - *In-place CMS* 3: "one editor popover" becomes "one editor dialog" (D2).
  - *In-place CMS* 4: only keys listed in `lib/content/editable.ts` can be edited, the caps per kind, bold on body blocks only, the audit diff and the rate limit (D1, D3, D4, D7, D8).
- `lib/content/keys.ts` comment: a key matching the pattern is no longer editable by that alone; it must also be listed (D4).
- `README.md`: the `components/cms/` tree comment if needed.

## Out of scope

- The inquiry form's own labels, choices and hints, meta descriptions, Open Graph cards, the error page and email-only copy. Their keys keep their defaults and are not editable (D1). They still read `block()`, so an edit to a shared key (a service name) reaches them.
- Images, galleries and video (Phases 28–30); portfolio item fields and service muting (Phase 31).
- Viewing the audit log or undoing an edit from it (Phase 33). D7 records enough to do both later.
- Concurrent editing: the last save wins.
- Formatting beyond bold (links, lists, italics).
- `CMS_ENABLED` in production (Phase 34).

## Decisions

| # | Decision | Source |
| --- | --- | --- |
| D1 | **Scope:** every block shown as visible text on `/`, `/services`, `/services/[slug]`, `/about`, `/contact`, `/portfolio` (page copy, not item fields), `/portfolio/[slug]` (page copy only), the footer and `/privacy` gets a ✎. Inquiry form copy, metadata, OG cards, the error page and email-only keys stay default-only. | Owner answer A |
| D2 | **Editor dialog for every block, as in MRU.** A native `<dialog>` opened with `showModal()`: focus moves into it and returns to the ✎ on close, and Escape and Cancel close it without saving. Label, line and heading kinds get a one-line input; body gets a textarea. One dialog is open at a time through `openKey` (Phase 26, D8), and turning editing off closes it. The roadmap's "popover" wording becomes "editor dialog". | Owner answer B; MRU `editable.tsx` |
| D3 | **Bold on body blocks only.** Body-kind blocks get a **B** button that wraps the selection in `**…**`, and their text renders one `<p>` per non-empty line with `**x**` as `<strong>`. Unmatched markers render literally. No HTML is ever stored or rendered, and no other formatting is supported. Other kinds are plain text, and a line break is refused outside body. | Owner answer C; MRU `rich-text` |
| D4 | **Kinds and caps.** Each editable key has one kind: `label` ≤ 40 characters (buttons, links), `heading` ≤ 120, `line` ≤ 300, `body` ≤ 5,000. The server enforces the cap from the kind, and the dialog shows a live count. A key that isn't listed is refused even when it matches the key pattern. A test checks that every listed key's default fits its cap. | Owner answer D |
| D5 | **The action.** `updateContentBlock(key, value)`, in order: `requireRole("editor")` → the rate limit (D8) → Zod (pattern, listed key, value trimmed with `\r` removed, the kind's cap and line rule) → in one `$transaction`, read the old row, then upsert, or delete when the trimmed value is empty, plus `audit()` → `updateTag("content")`. It returns `{ ok: true, value }`, where `value` is the text now in force (the default after a reset), or `{ ok: false, error }` with a generic message. It never throws to the client. | tech-stack *In-place CMS* 4; rule 8 |
| D6 | **One cached read, tag `content`.** `readContentBlocks()` is a `"use cache"` function with `cacheTag("content")`. `cacheLife("days")` on success (amended in the build from `hours`: every page reads copy, so `hours` would have made each one regenerate hourly instead of daily; a save expires the tag at once anyway). On failure it returns the failure result with `cacheLife("minutes")`, as `lib/portfolio/read.ts` does, and `block()` uses the defaults. `block()` keeps its signature, so no call site changes. A save calls `updateTag("content")` (in `next/cache` in the installed Next 16; see the docs in the build), so the editor's next render reads the write and visitors get it on their next load. Pages keep their prerender markers. | Owner answer F; rule 13 |
| D7 | **Audit:** `content.update` or `content.reset`, entity `ContentBlock` / the key, and `diff: { before, after }`. `before` is the text that was showing (the row, or the default), and `after` is the new text (the default after a reset). It is written in the same transaction as the change (Phase 25, D5). | Owner answer G |
| D8 | **Rate limit:** `rateLimit("content", userId, { max: 60, windowSec: 600 })`, checked after the guard so a visitor can't use up an editor's allowance. Over the limit, the action returns a generic "Too many saves. Try again in a few minutes." and writes nothing. | Owner answer H |
| D9 | **Where the ✎ goes.** `<Editable>` is a client component that takes `blockKey`, the server-read `value`, `as` and `className`. With editing off, it renders exactly the markup the page has today: no wrapper, no button. With editing on, the ✎ sits **beside** the text, never inside a link or button (a button inside `<a>` is invalid), so link and button labels get their ✎ next to the control. It is always visible, at least 24×24 px, and labelled `Edit "<first 40 characters of the text>"`, so each ✎ is distinct with no hand-written label list. After a save it shows the returned value at once. | Phase 24, D16; MRU; rule 10 |
| D10 | **Two PRs.** **PR A** (this branch): the spec folder, the constitution changes, the migration, `readContentBlocks()` and `block()` with `server-only`, database tests, and the e2e skip fix (D11). With no rows yet, the site is unchanged. **PR B** (a new branch from `develop` after PR A merges and `migrate-preview` has run): `editable.ts`, the renderer, the action, `<Editable>`, the call sites and the e2e spec. Its preview-e2e can then save against a migrated preview database. | Owner answer E; memory of Phases 12 and 19 |
| D11 | **e2e skip fix in PR A.** `e2e/a11y.spec.ts:73` and `e2e/shell.spec.ts:70` wait for the streamed content when `E2E_PORTFOLIO_STATE=ready` instead of deciding to skip before it arrives. | Owner answer J |
| D12 | **Manual check:** the owner's preview edit check on PR B only (see `validation.md`). No NVDA or phone pass this phase. | Owner answer I |

### Owner answers (2026-10-28)

- **A** Scope: all visible page text.
- **B** Editor UI: a modal for every block, like MRU.
- **C** Bold: long body paragraphs only.
- **D** Length: per-kind caps.
- **E** PRs: migration PR first.
- **F** Cache: one cached read, tag `content`.
- **G** Audit: the key plus before and after.
- **H** Rate limit: 60 saves per 10 minutes.
- **I** Manual checks: the preview edit check.
- **J** e2e skips: fix them in PR A.

## Constraints

- **C1 — Static pages.** Every public route keeps its `○` / `◐` marker from `develop` in both PRs. `<Editable>` reads edit state only from `useEditMode()`, and nothing on a public page reads the session on the server.
- **C2 — No new dependency.** The dialog is native `<dialog>`, and the bold renderer is a few lines of string splitting.
- **C3 — Visitor HTML unchanged.** With editing off, and for visitors, the rendered markup of every page matches `develop`, apart from body blocks that now carry bold. No ✎, dialog or `data-` hook ships in visitor HTML.
- **C4 — Guarded.** The CI unguarded-action scan passes with no new allowlist entry.
- **C5 — Owner steps** are marked **(owner)** in `plan.md`: merges, and the preview edit check.
