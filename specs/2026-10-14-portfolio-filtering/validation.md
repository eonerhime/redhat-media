# Validation — Phase 11 Portfolio filtering

## Roadmap success check ("Done when", verbatim)

> Filtered URLs are shareable and survive reload, and empty categories never show.

- [ ] **Shareable:** opening `/portfolio?category=web-apps` in a fresh page shows the Web & Apps filter as current and its items, already in the server HTML (D2, D9)
- [ ] **Survives reload:** after choosing Web & Apps, a reload keeps the URL, the current filter and the items (D9)
- [ ] **Empty categories never show:** on the preview the bar holds only All and Web & Apps. The unit tests cover every category with no items, and `?category=photography` shows All (D3, D9)

## Page behaviour

- [ ] **Stale and bad links:** unknown, repeated and wrongly cased `category` values show All, with no error (D3)
- [ ] **Unavailable and empty states:** no filter bar, whatever the URL (D3); CI's e2e run checks `?category=web-apps` while unavailable
- [ ] **Related work:** "See all work" on the Web & App Development page links to `/portfolio?category=web-apps` (D7)
- [ ] **Static shell:** the build route table shows `/portfolio` as `◐` and the service pages as prerendered (C2)

## Accessibility and layout

- [ ] **Semantics:** the bar is a labelled `<nav>` of links, and the current one has `aria-current="page"` (D4)
- [ ] **Focus and scroll:** after a filter is chosen, focus is on its link and the page has not jumped to the top (D4)
- [ ] **Contrast and layout:** the shell spec passes on `/portfolio?category=web-apps` at 360/768/1440px, with no sideways page scroll (C5)

## Gates

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass
- [ ] `pnpm test:e2e` passes locally (ready and unavailable) and in CI; `preview-e2e` passes on the Vercel preview
- [ ] `pnpm test:db` passes (no schema change, C3)
- [ ] Owner check on the preview
