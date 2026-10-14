# Implementation log — Phase 10 Portfolio grid

## Log

- **2026-10-14** — Branch `feature/phase-10-portfolio-grid` from `develop` at `4cabbe2`.
  - Read `mission.md`, `tech-stack.md`, `roadmap.md` (Phase 10 row), the Phase 9 spec folder, `prisma/schema.prisma`, `lib/portfolio/schema.ts`, `components/media/*`, `components/services/related-work.tsx` and the CI workflows.
  - Found that the CI `ci` job builds and runs e2e with no database, and the runtime client (Neon WebSocket, TLS required) cannot reach the CI Postgres container. That shaped D11: CI proves the unavailable state, and a new `preview-e2e` job proves the ready state on the Vercel preview.
  - The seeded covers are 1200×750 (16:10), which no existing aspect fits without cropping, hence D4's `16/10`.
  - Next 16 docs (ctx7, `/vercel/next.js`): a cache with expire under 5 minutes or revalidate 0 is short-lived and left out of prerenders; `"minutes"` (expire 1 hour) is not, so D2's failure path still prerenders.
  - Spec drafted, waiting for owner approval.

- **2026-10-14** — The owner approved the spec and answered A–D as recommended: Appendix A as drafted, "Visit live site" on cards, related work up to three (featured first), and the `preview-e2e` job.
  - Constitution amendments (plan 0.1–0.3): `tech-stack.md` rules 8 and 13 and the E2E row, Phase 8 spec D5 (`16/10`), Phase 5 spec D6 (filled), `CLAUDE.md` (`PW_BASE_URL`).
  - Docs read through ctx7 (`/vercel/next.js`): `cacheLife` and `cacheTag` may be called conditionally after an `await` inside `"use cache"` (the documented "cache missing content briefly" pattern). `node_modules/next` 16.4.0 passes error boundaries both `reset` and `retry`; `retry` re-fetches the server render, so the boundary uses it (spec D6 updated).
  - Read layer: `lib/portfolio/read-core.ts`, `read.ts`, the `16/10` aspect and `serviceByCategory()`. Unit suite: 720 passed (679 + 41).
  - **Deviations from the draft:**
    - `PortfolioListing` (the three states) lives in `components/portfolio/portfolio-grid.tsx` beside `PortfolioGrid`, so `/portfolio` and `/dev/portfolio-states` share it (spec D4 updated).
    - `read-core.ts` uses `@/` imports (it never runs under plain Node), so the spec's "relative imports" note was removed.
    - Besides adding `/portfolio` to the shell routes, three existing tests changed: `block.test.ts` lists the Phase 10 keys as new copy, and `service-pages.spec.ts` accepts the related-work heading and seeded card text where related work appears. Which pages show it is asserted in `portfolio.spec.ts` (spec C4 amended).
    - `ExternalLink`'s hidden "(opens in a new tab)" is not a content key, so the keyed-text checks allow it with the seeded card text (`e2e/portfolio-expect.ts`).
    - The bypass header is added by a Playwright `page.route` limited to the preview's origin, not `extraHTTPHeaders`. Otherwise it would also go to `res.cloudinary.com`. Traces are off for remote runs, so the header is never recorded (C6).
  - Build against the Neon `dev` branch: `/portfolio` is `○` (1h / 1d), the listed service pages `○` (1h / 1d, shortened from 1d / 1w by the hourly portfolio read), and all six service pages have prerendered `.html` files (the table collapses four under "[+4 more paths]"). The prerendered `portfolio.html` has `data-state="ready"` and all five titles. Only `web-app-development.html` has a "Related work" section.
  - `pnpm test:e2e --workers=1` (ready): 220 passed and 1 failed. The hover test read `transform`, but Tailwind 4 moves elements with the `translate` and `scale` properties. After fixing the test, `portfolio.spec.ts` passes 11/11.
  - **Plan 4.2:** local `postgres:17` replica of the `db` job: bootstrap, `db:deploy`, `db:seed` (5 created), and `pnpm test:db` with 24 passed. The container and its credentials file were removed. A first attempt ran the bootstrap before Postgres had finished starting, and the unchained steps then ran `db:deploy` (no pending migrations) and `db:seed` (idempotent upsert, production refused) against the Neon `dev` branch from `.env.local`. That changed nothing, and the rerun checked its target host before writing.
  - **Plan 3.5:** a build with `DATABASE_URL` blanked (as in CI) logs `[portfolio] read failed: DATABASE_URL is not set` and still prerenders: `/portfolio` is `○` with 1m / 1h (the `"minutes"` failure profile), and the service pages likewise. `DATABASE_URL= E2E_PORTFOLIO_STATE=unavailable pnpm test:e2e --workers=1`: 220 passed, with the hover test skipped (it needs published items).
  - **Plan 4.3:** PR #14. CI run 38578623545 passed (`ci` with `unavailable` pinned, `db`, `gitleaks`). On the Vercel preview (`redhat-media-git-feature-phase-10-portfolio-grid-e1rhyme.vercel.app`), run 38578733148 passed `preview-headers`, and `preview-e2e` passed 11/11 with `ready` pinned. That proves the five seeded items, their covers and related work on the deployed site.
