# Plan — Phase 15 Launch readiness + security gate

Scope, decisions (D1–D11) and constraints (C1–C8) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md). Owner steps are written out in full when they come up (C8).

## 0. Constitution first

- [x] 0.1 `specs/tech-stack.md`: the *Supporting tools* rows (Analytics, E2E, Performance, Monitoring, Edge protection), rule 8, the Firewall, Monitoring and rotation rows, the checklist pointer, and *Environment variables* (`MONITOR_DATABASE_URL`, `MONITOR_BASE_URL`), per the owner's answers.
- [x] 0.2 `specs/roadmap.md`: the Phase 16 additions (monitor on production, scheduled test alert, smoke test and PageSpeed Insights on production, Bot Protection review) and open question 9 (owner answer A).

## 1. Error pages

- [x] 1.1 `<PublicShell>` extracted from `app/(public)/layout.tsx`; `notFoundCopy` in `lib/site.ts`; `<NotFoundView>`; `app/(public)/not-found.tsx` and `app/not-found.tsx` (D1, owner answer G).
- [x] 1.2 `app/error.tsx`, `app/global-error.tsx` and the `/dev/error` fixture (D2).
- [x] 1.3 Unit tests, `not-found.spec.ts`, `error.spec.ts`, and the `service-pages.spec.ts` heading assertion updated (D11, C7).

## 2. Analytics

- [x] 2.1 `@vercel/analytics` and `@vercel/speed-insights` pinned and rendered in the root layout on Vercel deployments only, with a unit test (D3).
- [ ] 2.2 Owner turns on Web Analytics and Speed Insights in the Vercel dashboard (D3).
- [ ] 2.3 The preview loads both scripts from its own origin, and `csp.spec.ts` logs no violation (D3, C4).

## 3. Accessibility, smoke test, Lighthouse

- [ ] 3.1 `@axe-core/playwright` (owner answer C); `e2e/a11y.spec.ts`; every finding fixed (D4).
- [ ] 3.2 `e2e/smoke.spec.ts`: desktop, mobile and keyboard variants; CI and preview paths (D5).
- [ ] 3.3 `smoke`, `a11y` and `csp` in `preview-e2e` (D11).
- [ ] 3.4 Lighthouse per owner answer B: the `lighthouse` job with `@lhci/cli`, no report uploaded, scores printed only (D6, C6). Every template ≥ 0.90 in all four categories.
- [ ] 3.5 Manual checks: 200% zoom, and the owner's screen-reader spot check (D4).

## 4. Monitoring and alerting

- [ ] 4.1 `scripts/monitor.mts` and its pure core, with `monitor-core.test.ts` (D7, D11).
- [ ] 4.2 Baseline on the Neon preview: connections and transaction rate, sampled over a normal preview-e2e run. Thresholds fixed and recorded (D7).
- [ ] 4.3 `.github/workflows/monitor.yml` (schedule, dispatch with `test_alert`, the `test-alert` label trigger). Owner creates the `monitor` environment with `MONITOR_DATABASE_URL` (preview `rhm_readonly`) and the repository variable `MONITOR_BASE_URL` (develop's preview URL) (D7, C6).
- [ ] 4.4 Test alert: the owner adds the `test-alert` label to the PR, and the "Run failed" email arrives (D7, owner answer D).
- [ ] 4.5 Neon Free usage alerts and Vercel deployment-failure notifications confirmed on and routed (D7).
- [ ] 4.6 `docs/runbooks/monitoring.md` (D7).

## 5. Firewall

- [ ] 5.1 Count the requests in a normal browsing session; the owner sets the three rules per owner answer E; `curl` checks: `/.env` gives 403 and a burst gives 429; record which deployments the rules cover (D8).
- [ ] 5.2 Attack Challenge Mode availability on Hobby confirmed; `docs/runbooks/firewall.md` with the rules and the runbook (D8).

## 6. Secret rotation

- [ ] 6.1 `docs/runbooks/secret-rotation.md` (D9).
- [ ] 6.2 Rehearsal per owner answer F: `RATE_LIMIT_SALT` rotated on Vercel Preview, redeployed, `preview-e2e` green, time recorded (D9).

## 7. Security gate and close

- [ ] 7.1 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, `pnpm test:e2e --workers=1` (ready, then with `DATABASE_URL` blank). Route table compared with develop's CI log (C2).
- [ ] 7.2 `/security-review` over the Milestone 1 code; findings fixed or accepted in writing (D10).
- [ ] 7.3 Pre-launch checklist filled in `validation.md`, each item done, N/A with its phase, or Phase 16 (D10).
- [ ] 7.4 PR into `develop`: `ci`, `db`, `gitleaks`, `preview-headers`, `preview-e2e` and `lighthouse` green.
- [ ] 7.5 Owner check on the preview (the 404 page, a phone walk-through), then every `validation.md` box ticked.
