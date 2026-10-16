# Implementation log — Phase 15 Launch readiness + security gate

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

- **2026-10-16** — Branch `feature/phase-15-launch-readiness` created from `develop` at `d8a9145`. Spec, plan and validation drafted for approval.
  - Today: no `app/not-found.tsx`, so unknown URLs get Next's default 404. `service-pages.spec.ts` expects its "404" heading "until Phase 15". `app/(public)/error.tsx` exists (Phase 10 D6), but nothing covers errors in the layouts. There is no analytics, axe audit, Lighthouse measurement, monitor, Firewall rule or runbook. No server actions exist yet.
  - Platform facts (Vercel, Neon and GitHub docs via ctx7 and docs.github.com, 2026-10-16):
    - **Vercel Hobby:** non-commercial use only. Alerts need Pro with Observability Plus, and Log Drains need Pro. Runtime logs are kept for 1 hour. Analytics includes 50,000 events a month, and Speed Insights 10,000 data points over 30 days. The Firewall allows 3 custom rules, 1 of them a rate limit (IP or JA4 key, window 10 s to 10 min). Bot Protection is available on all plans.
    - **Neon:** no connection or query-volume alerts on any plan. Free sends usage emails at 80% and 100% (storage, data transfer, compute). Metrics export is Scale only. A 0.25 CU compute has `max_connections` 104, 97 of them usable, and the pooler's `default_pool_size` is 93. `pg_stat_statements` data is lost when the compute suspends.
    - **GitHub:** scheduled workflows run only on the default branch. Their notifications go to the user who last changed the cron line. `workflow_dispatch` needs the workflow file on the default branch.
  - Owner answers (later the same day): A, stay on Hobby; B, automated Lighthouse; C, axe plus a phone screen-reader check; D, forward alerts to `redhatmediang@gmail.com` through a Gmail filter; G, the 404 copy as written. E (Firewall) asked for advice, and F found the full rotation rehearsal too much work. A recommendation (the three D8 rules) and a smaller rehearsal (`RATE_LIMIT_SALT` on Preview) were proposed, and the owner approved them and the spec.
