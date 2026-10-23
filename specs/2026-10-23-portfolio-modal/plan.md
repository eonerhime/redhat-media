# Plan — Phase 22 Portfolio modal

Scope, decisions (D1–D12) and constraints (C1–C6) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 1. Constitution

- [x] 1.1 `tech-stack.md` → *Architectural rules* 1, 2 and 8, as listed in the spec's *Constitution changes*.
- [x] 1.2 Phase 12 spec D7: add the dated note on the card link opening the modal on `/portfolio`.

## 2. Shared item read

- [x] 2.1 Move `readItem` and the metadata builder out of `app/(public)/portfolio/[slug]/page.tsx` into one shared module (D9). The full page imports them, with no change in behaviour.
- [x] 2.2 Run the existing portfolio unit tests and `portfolio-detail.spec.ts` (unavailable state) to confirm the full page is unchanged.

## 3. Routes

- [x] 3.1 `app/(public)/portfolio/layout.tsx` rendering `{children}` and `{modal}` (D1).
- [x] 3.2 `@modal/default.tsx` and `@modal/page.tsx`, both returning `null` (D1).
- [x] 3.3 `@modal/(.)[slug]/page.tsx`: the same `generateStaticParams` and `generateMetadata` as the full page (D7, D9), then the detail body in its modal variant, or the unavailable state.
- [x] 3.4 `@modal/(.)[slug]/layout.tsx` (the modal shell), `loading.tsx` (the detail skeleton) and `error.tsx` (D8).
- [x] 3.5 Build, and check the route table against C2 (`/portfolio` `◐`, every published slug listed). If a mode changed, stop and ask the owner (D2).

## 4. Modal shell

- [x] 4.1 `components/portfolio/portfolio-modal.tsx`: a `<dialog>` with `showModal()` on mount; Close, `cancel` (Escape) and backdrop clicks all call `router.back()` (D4).
- [x] 4.2 Labelling: by the item title, or by the loading text while loading (D4, D8).
- [x] 4.3 Focus: Close gets focus on open, and focus returns to the opening card link on unmount (D4).
- [x] 4.4 Scroll lock on the page behind while open; the dialog scrolls inside, with a pinned header bar (D4, D5).
- [x] 4.5 Layout: full screen under 768px, the centred panel and backdrop from 768px (D5).
- [x] 4.6 Opening motion with `starting:`, under `motion-safe` only (D6).
- [x] 4.7 Check that Escape in the nested lightbox closes only the lightbox (D4).

## 5. Detail in the modal

- [x] 5.1 `PortfolioDetail` and `PortfolioDetailUnavailable`: add a `modal` variant with no back link and a title `id` (D3, D8).
- [x] 5.2 `content/defaults.ts`: add `portfolio.modal.close` (D10, Appendix A).

## 6. Tests

- [x] 6.1 `e2e/portfolio-modal.spec.ts` with the cases in `validation.md`; it skips unless the state is `ready` (D11).
- [x] 6.2 Update the card-click steps in `portfolio-detail.spec.ts` and `smoke.spec.ts` (D11, C4).
- [x] 6.3 Add the new spec to the preview-e2e list in `.github/workflows/preview-headers.yml` (C3).
- [x] 6.4 Local run against Neon `dev`: build, then the modal spec with `E2E_PORTFOLIO_STATE=ready`, `PW_CHANNEL=msedge` and `--workers=1`. Log the result.
- [x] 6.5 Record where the not-found case renders from inside the slot (D8). It replaced the grid, so on the owner's answer H, `@modal/(.)[slug]/not-found.tsx` shows it inside the dialog, with an e2e case.

## 7. Close-out

- [x] 7.1 Gates: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`; the route table per C2.
- [ ] 7.2 Open the PR into `develop`; CI is green, including preview-e2e.
- [ ] 7.3 NVDA spot check on the preview (D12).
- [ ] 7.4 Owner preview check (D12).
- [ ] 7.5 Tick `validation.md` and log the work in `implementation.md`, then merge.
