# Validation — Phase 10 Portfolio grid

## Roadmap success check ("Done when", verbatim)

> All seeded items are listed, with loading, error and empty states.

- [ ] **All seeded items listed:** on the Vercel preview, `preview-e2e` finds the five seeded items in order, each with a loaded cover, category badge, tech pills and an `https:` live link (D3, D4, D7, D11)
- [ ] **Loading state:** `app/(public)/portfolio/loading.tsx` exists and renders a labelled `role="status"` placeholder (D5)
- [ ] **Error state:** the CI build has no database, and the e2e run sees the **unavailable** message and the CTA on `/portfolio`. `app/(public)/error.tsx` exists with fixed copy and a working "Try again" (D3, D6, D11)
- [ ] **Empty state:** `/dev/portfolio-states` shows the empty message and the CTA, and the e2e spec checks it (D10)

## Page behaviour

- [ ] **Related work:** the Web & App Development page shows SportsPred, AfroJamz and toutMessages with a "See all work" link; the other five service pages show no related-work section (D8)
- [ ] **Static:** the build route table shows `/portfolio` and the service pages as prerendered, not dynamic (C2)
- [ ] **Links safe:** every live link has `target="_blank"` and `rel="noopener noreferrer"` (D4)
- [ ] **Motion:** the hover lift and zoom run normally and are absent under `prefers-reduced-motion` (D4)
- [ ] **Keyed text:** every visible string on `/portfolio` is a content key or seeded database content (D9)
- [ ] **Owner preview check:** the owner viewed `/portfolio` and the Web & App service page on the preview and approved them (owner check)

## Accessibility and layout

- [ ] `/portfolio` passes the shell checks at 360, 768 and 1440px, with no horizontal overflow (D10)
- [ ] The rendered-contrast check passes on `/portfolio` (C5)
- [ ] Every cover has alt text, and the hover cue also appears on keyboard focus (D4)

## Quality gates

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass locally
- [ ] `pnpm test:db` passes, including `read-core.db.test.ts`
- [ ] `pnpm test:e2e --workers=1` passes locally (ready state), with existing specs changed only to add `/portfolio` (C4)
- [ ] CI is green on the PR (`ci`, `db`, `gitleaks`, `preview-headers`, `preview-e2e`, Vercel)
- [ ] No secret appears in logs or artifacts; gitleaks is green (C6)

## Spec hygiene

- [ ] The `tech-stack.md`, Phase 5 and Phase 8 spec, and `CLAUDE.md` amendments are in the same PR
- [ ] Every `plan.md` box is ticked, and `implementation.md` records any deviations
