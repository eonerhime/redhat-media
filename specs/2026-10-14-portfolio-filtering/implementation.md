# Implementation log — Phase 11 Portfolio filtering

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

- **2026-10-14** — Branch `feature/phase-11-portfolio-filtering` created from `develop` at `ed629a3`. The owner chose to ship Phase 11 before the photo-seed amendment (roadmap open question 4), with only Web & Apps populated. Spec, plan and validation drafted for approval. Docs read through ctx7 (`/vercel/next.js`): with `cacheComponents`, passing the `searchParams` promise to a component inside `<Suspense>` keeps the page shell static (spec D2).

- **2026-10-14** — The owner approved the spec and answered A–D as recommended: Appendix A as drafted, the bar shows All and Web & Apps, Marketing groups the three Growth services, and stale or unknown links show All.
  - Constitution amendments (plan 0.1–0.3): `tech-stack.md` rules 1 and 2, roadmap open question 4, and Phase 10 spec D8.
  - `lib/portfolio/filters.ts` adds `resolveFilter` beside the D1 exports, so the page and its tests share the "empty filter shows All" rule. `PortfolioListing` takes an optional `filter` (default All), so `/dev/portfolio-states` is unchanged. The loading placeholder moved to `components/portfolio/portfolio-skeleton.tsx`, shared by `loading.tsx` and the `<Suspense>` fallback. The fallback's 50px strip matches the bar: 4px padding on each side plus a 42px pill (16px text at a 24px line height, 8px padding top and bottom, 1px border).
  - Build against the Neon `dev` branch: `/portfolio` is `◐` (1h / 1d). All six service pages are still fully prerendered; only the generic `/services/[slug]` fallback shell has a postponed part, which is why the table groups them as `◐`.
  - **Deviations from the draft:**
    - **No JavaScript (D2 amended).** With JavaScript off, a filtered URL's listing is in the HTML but stays hidden, because React reveals streamed content with an inline script. The e2e test therefore reads the server HTML with CSS locators, hidden nodes included, instead of asserting a visible page.
    - **Focus (D4 amended).** Choosing a filter by keyboard keeps the focus on its link and keeps the scroll position, so the bar stays a server component with no focus-restore code.
  - Unit: 758 passed. E2E, ready (`dev` branch): 240 passed, 1 skipped (the unavailable-only test). E2E with `DATABASE_URL` blank, as in CI: the build logs `[portfolio] read failed`, `/portfolio` is `◐` (1m / 1h), and 233 passed with 8 ready-only tests skipped.
  - **Plan 4.2:** local `postgres:17` replica of the `db` job, each step chained with `set -euo pipefail` and the target host checked as `localhost:55432` before any write: bootstrap, `db:deploy`, `db:seed` and `pnpm test:db` (24 passed). The container and the credentials file were removed.
