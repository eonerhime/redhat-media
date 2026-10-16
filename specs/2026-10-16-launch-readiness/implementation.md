# Implementation log — Phase 15 Launch readiness + security gate

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

- **2026-10-16** — Branch `feature/phase-15-launch-readiness` created from `develop` at `d8a9145`. Spec, plan and validation drafted for approval.
  - Today: no `app/not-found.tsx`, so unknown URLs get Next's default 404. `service-pages.spec.ts` expects its "404" heading "until Phase 15". `app/(public)/error.tsx` exists (Phase 10 D6), but nothing covers errors in the layouts. There is no analytics, axe audit, Lighthouse measurement, monitor, Firewall rule or runbook. No server actions exist yet.
  - Platform facts (Vercel, Neon and GitHub docs via ctx7 and docs.github.com, 2026-10-16):
    - **Vercel Hobby:** non-commercial use only. Alerts need Pro with Observability Plus, and Log Drains need Pro. Runtime logs are kept for 1 hour. Analytics includes 50,000 events a month, and Speed Insights 10,000 data points over 30 days. The Firewall allows 3 custom rules, 1 of them a rate limit (IP or JA4 key, window 10 s to 10 min). Bot Protection is available on all plans.
    - **Neon:** no connection or query-volume alerts on any plan. Free sends usage emails at 80% and 100% (storage, data transfer, compute). Metrics export is Scale only. A 0.25 CU compute has `max_connections` 104, 97 of them usable, and the pooler's `default_pool_size` is 93. `pg_stat_statements` data is lost when the compute suspends.
    - **GitHub:** scheduled workflows run only on the default branch. Their notifications go to the user who last changed the cron line. `workflow_dispatch` needs the workflow file on the default branch.
  - Owner answers (later the same day): A, stay on Hobby; B, automated Lighthouse; C, axe plus a phone screen-reader check; D, forward alerts to `redhatmediang@gmail.com` through a Gmail filter; G, the 404 copy as written. E (Firewall) asked for advice, and F found the full rotation rehearsal too much work. A recommendation (the three D8 rules) and a smaller rehearsal (`RATE_LIMIT_SALT` on Preview) were proposed, and the owner approved them and the spec.

- **2026-10-16** — Constitution (plan 0.1, 0.2) in `7a33c32`. Versions pinned from the npm registry: `@vercel/analytics` 2.0.1, `@vercel/speed-insights` 2.0.0, `@lhci/cli` 0.15.1 (Lighthouse 12.6.1), and `@axe-core/playwright` **4.13.0**. 4.14.0 was published the day before (2026-10-15), so the previous release is pinned until it has aged.
  - Error pages (plan 1.1–1.3):
    - `<PublicShell>` was extracted from the public layout, and `<NotFoundView>` is used by `app/(public)/not-found.tsx` and `app/not-found.tsx`.
    - `<ErrorView>` is shared by `app/(public)/error.tsx`, the new `app/error.tsx` and `app/global-error.tsx`. The fonts moved to `app/fonts.ts`, so `global-error` can load them.
    - **Spec D2 amended before code:** under `cacheComponents` a server-side throw fails the prerender, so `/dev/error` throws in the browser, through `useSyncExternalStore`. The React Compiler lint rules ban mutating module state during render. The e2e test sets a `sessionStorage` flag before it presses retry.
  - Checks: `pnpm test` 944 passed. The new specs, `service-pages`, `shell` and `portfolio-detail` give 235 passed and 1 skipped against the dev database. The build's route table adds only `/_not-found` and `/dev/error` (`○`). The views were screenshotted at 360px and 1440px.

- **2026-10-16** — Analytics (plan 2.1): `<VercelInsights>` renders both components when `VERCEL_ENV` is `production` or `preview`. Both packages wrap their `useSearchParams` in their own `<Suspense>`, so the static routes stay static; the preview build's route table confirms it (plan 7.1).
  - Accessibility (plan 3.1): `e2e/a11y.spec.ts` covers every route, `/no-such-page`, `/dev/error` and `/dev/portfolio-detail`, at 360px and 1440px, plus the open mobile nav and lightbox. Result: **0 violations** (36 passed against the dev database). A control test plants an `<img>` with no alt text, and axe reports `image-alt`, so the clean result is real. No fixes were needed.
  - Smoke test (plan 3.2): desktop, mobile and keyboard variants pass against the dev database (ready path).
  - **Lighthouse (D6 amended).** `@lhci/cli` was replaced by `lighthouse` 13.5.0 and `scripts/lighthouse.mts`. Lighthouse's `extraHeaders` reach every origin (`Network.setExtraHTTPHeaders` in `core/gather/driver/prepare.js`), so the bypass secret would have reached Cloudinary. The script sets Vercel's bypass cookie for the preview host only. The removal and install took 16 minutes on this machine.
    - Local trial against `next start` (benchmarkIndex 1065, near the slow end of Lighthouse's calibrated range): Accessibility, Best Practices and SEO are **100** on every template. Performance was 68–90, held back by Total Blocking Time (homepage 740 ms; FCP 0.9 s, LCP 1.9 s, CLS 0). The gate is the preview run, so these are not acted on until the preview numbers exist.
    - Lighthouse refuses a 4xx page (`ERRORED_DOCUMENT_REQUEST` on `/services/branding`, which `next start` answers with 404), so the 404 view is left out of the Lighthouse paths.
  - Monitor (plan 4.1, 4.2): `scripts/monitor.mts`, `lib/monitor/monitor-core.ts` and `.github/workflows/monitor.yml`. Local run against `next start` and the dev branch: every site check passes. Connections were 1 of 897 usable: the dev compute is larger than 0.25 CU, and the check reads the live `max_connections` and `superuser_reserved_connections`. With `MONITOR_TEST_ALERT=1`, the run fails with "TEST ALERT — not an incident".
    - **D7 amended:** the first design averaged transactions since the compute started, and it failed on a just-woken compute (970/min). Measured: about 970 of Neon's own transactions in a compute's first minute, then 3 a minute at idle, and 6 a minute during a busy e2e run. It is now a 60-second sample in the run, skipped on computes younger than 5 minutes, with a limit of 60 a minute. Re-run: 4 a minute, pass.

- **2026-10-16** — Draft PR #21 opened, to get the preview checks running early.
  - **Lighthouse on the preview (plan 3.4), first run:** every template is at or above the budget. Performance: `/`, `/services`, `/services/photography`, `/about` and `/contact` 99; `/portfolio` 92; `/portfolio/sportspred` 93. Accessibility, Best Practices and SEO are **100** everywhere. The local 68–90 came from this machine's CPU, not the site.
  - **CI fixes:**
    - CI's no-database build sends two `noindex` robots metas on an unknown service slug, from the page and from the not-found boundary. `service-pages.spec.ts` now checks every robots meta, as `portfolio-detail.spec.ts` already did.
    - The axe control test failed under load, because the planted image was missing when axe ran. It now plants the image after the network settles and asserts it is visible first.
    - A scripted edit wrote a literal `\n` into the `preview-e2e` file list, so Playwright got a stray `n` filter and ran the whole suite. The specs without the bypass fixture then met Vercel's login page. The list is now on one line. Among the intended specs, only the axe control failed on the preview.
  - **Local full run** (dev database): 376 passed, 2 skipped, 1 failed (the axe control, since fixed). Re-run of `a11y` and `service-pages`: 91 passed. A `next start` from the full run outlived Playwright on Windows and held port 3217, and the next run stalled until it was stopped.
  - **Security review (plan 7.2)** with `/security-review` over `origin/main...HEAD`: **no findings** at the reporting bar.
    - One candidate was excluded by the false-positive check (3/10): the `deployment_status` jobs run the deployment's commit with the bypass secret. Only the Vercel App fires that event, and Vercel deploys a fork PR only with a maintainer's approval.
    - It was hardened anyway. A `same-repo` job lets the three preview jobs run only when the commit is the head of a branch in this repository. The Lighthouse step takes its URL from `env:`.
  - **Runbooks (plans 4.6, 6.1):** `docs/runbooks/monitoring.md`, `firewall.md` and `secret-rotation.md`.
    - Rate limit: a fast scripted session (9 pages with prefetching) made 124 site requests in 19 seconds. The rule is set at 1,200 per 60 s per IP, kept generous for carrier-grade NAT on Nigerian mobile networks.
    - The `rhm_readonly` preview password is not stored locally, since the Phase 7 output file is gone. The monitor's credential is re-keyed with one `ALTER ROLE` in the Neon SQL editor, not a full `db-bootstrap` run.

- **2026-10-16** — PR #21 after `4f258a7`: every check is green, including `ci`, `db`, `gitleaks`, `preview-headers`, `preview-e2e` (now only the intended specs), `lighthouse` and `same-repo`. The guard let this repository's own commit through (plan 3.3).
  - **Local gates (plan 7.1):**
    - `pnpm typecheck`, `lint`, `format:check` (apart from the git-ignored `.claude/settings.local.json`) and `test` (960) pass.
    - E2E against the dev database: 376 passed, 2 skipped; the one earlier failure, the axe control, was since fixed and re-run.
    - With `DATABASE_URL` blank, the build logged "DATABASE_URL is not set", and the suite gave **359 passed, 20 skipped, 0 failed**.
  - **Route table (C2)**, compared with develop run 38883504229's `ci` log: every route keeps its rendering mode. `/dev/error` is new. `/_not-found` and the `/dev/*` fixtures now revalidate at 1d / 1w, because they include `<PublicShell>`, whose footer year is cached with `cacheLife("days")`. No public route changed.
  - The monitor's preview `rhm_readonly` password was generated into the git-ignored `.env.monitor-preview.local`, together with a one-statement `ALTER ROLE` file for the owner. The rehearsal salt is in `.env.salt-rehearsal.local`. None of them was printed.

- **2026-10-16** — Owner steps A and B were done.
  - **A:** `rhm_readonly` on the preview branch was re-keyed with one `ALTER ROLE` in the Neon SQL editor. Checked by connecting with the new URL: `current_user` is `rhm_readonly` and it sees 5 portfolio items. The one-off SQL file was deleted.
  - **B:** Web Analytics and Speed Insights are enabled, and the three Firewall entries are set. The dashboard calls Attack Challenge Mode **Attack Mode**, under Firewall → Rules → Danger Zone, and it is off. The runbook was corrected. The owner rotated `RATE_LIMIT_SALT` on Preview (plan 6.2); the next push redeploys the preview.
  - **Firewall checks (plan 5.1), against production (still the static page, same project):** `/.env`, `/.git/config`, `/wp-login.php`, `/xmlrpc.php` and `/index.php` answer **403**, and `/` answers 200.
  - **Rate-limit burst:** 1,300 requests, 25 at a time, gave 58 × 200, then 403 with `X-Vercel-Mitigated: challenge` (Vercel's Security Checkpoint, its own DDoS mitigation), not the rule's 429. `curl` from this IP was still challenged 5 minutes later; a browser passes the checkpoint. The per-IP rule is the backstop for slower floods. Validation was reworded to what was observed.
  - Vercel's account menu on Hobby has no "Notifications" page where the plan expected one (owner).
