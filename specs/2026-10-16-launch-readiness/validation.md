# Validation — Phase 15 Launch readiness + security gate

## Roadmap success check ("Done when", verbatim)

> Lighthouse scores ≥ 90 on mobile for every template, and the smoke test is green. Every applicable checklist item is ticked, and a test alert reaches the team.

- [x] **Lighthouse:** Performance, Accessibility, Best Practices and SEO ≥ 90 on mobile for every template, with `is-crawlable` skipped on the preview only (D6). Scores recorded per URL in `implementation.md`: Performance 92–99 on `1cba4d3`, and 100 for the other three categories everywhere. `/portfolio/sportspred` dipped to 81 once on a slow runner, then gave 93 twice.
- [x] **Smoke test:** green in the desktop, mobile and keyboard variants, in CI and on the Vercel preview (D5). CI `ci` (unavailable path) and `preview-e2e` (full ready path) on `1cba4d3`; locally in both states.
- [x] **Checklist:** every applicable item below is ticked (D10). The not-yet-applicable items name the phase that brings them.
- [x] **Test alert:** the labelled run failed with "TEST ALERT" and its email reached the recipients from owner answer D (D7). Run 38945956023, 2026-10-16. Every real check passed against develop's preview and the Neon preview branch first. "[eonerhime/redhat-media] PR run failed: monitor - …" arrived at `emo.onerhime@gmail.com`, and the Gmail filter's forwarded copy at `redhatmediang@gmail.com` (owner).

## Error pages

- [x] `/nope` answers 404 with the branded view, the header and footer, `noindex` and the four links (D1) `not-found.spec.ts` in CI and on the preview; screenshots at 360px and 1440px.
- [x] An unknown service slug and an unknown portfolio slug show the same view, keeping the soft 404 (D1) The same spec covers `/services/branding` and `/portfolio/Not_A_Slug`.
- [x] `/dev/error` shows the branded error view from `app/error.tsx`, and retry recovers. Production answers 404 for it (D2, amended) `error.spec.ts` in CI and on the preview. In production, `isDevPagesEnabled` returns false (`dev-pages.test.ts`), and Phase 16 checks it live with the other `/dev/*` routes.

## Analytics

- [x] Web Analytics and Speed Insights are on in the dashboard and load from the preview's own origin. They are absent from local and CI builds (D3) Both are enabled in the dashboard (owner, step B). They render only when `VERCEL_ENV` is set (`vercel-insights.test.ts`), so local and CI builds have none. **Seeing visits arrive moved to Phase 16** on production (owner, 2026-10-16).
- [x] The CSP is unchanged, and `csp.spec.ts` on the preview logs no violation (D3, C4) `csp.spec.ts` on the preview of `1cba4d3`, with the analytics components rendered (`VERCEL_ENV=preview`).

## Accessibility

- [x] `a11y.spec.ts` finds zero WCAG 2.2 A/AA violations on every route at 360px and 1440px, with the nav and lightbox open, in CI and on the preview (D4) The control test proves the audit catches a planted `image-alt` violation.
- [x] 200% zoom checked, and the owner's screen-reader spot check recorded (D4) 200% zoom is covered by the 360px and 768px layout checks (`implementation.md`). **The screen-reader spot check moved to Phase 16** on production (owner, 2026-10-16).

## Monitoring and edge

- [x] `monitor.mts` passes against develop's preview and the Neon preview. The thresholds are recorded with their baseline (D7)
- [x] Neon usage alerts and Vercel deployment-failure notifications are confirmed on (D7): Neon's emails go to an inbox the owner reads. Vercel's Hobby account menu has no notification-preferences page, so deployment failures are seen as the failing `Vercel` check on the PR (owner, 2026-10-16).
- [x] Firewall rules are set as in `docs/runbooks/firewall.md`. `/.env` and the other scanner paths answer 403. A fast burst is stopped by Vercel's own mitigation (challenge) before the per-IP rule counts up (D8, as observed)
- [x] The runbooks exist: `monitoring.md`, `firewall.md` and `secret-rotation.md`. The rotation rehearsal passed, with its timing recorded (D9)

## Pre-launch security checklist (`tech-stack.md`, Phase 15 run)

Each item is marked **done** (with evidence), **N/A until Phase N**, or **Phase 16**.

- [x] All headers present, and the CSP enforced with no violations — **done**. `preview-headers` checks every header against the production values and that no report-only header is served. `csp.spec.ts` gives 0 violations in CI and on the preview with Analytics and Speed Insights live (PR #21, `1cba4d3`).
- [x] Rate-limit, Turnstile, honeypot and lockout tests green (where the feature exists) — **done** for the rate limiter (`rate-limit-core.test.ts` in CI `ci`; `rate-limit.db.test.ts` in CI `db`). **N/A until Phase 18** for Turnstile and the honeypot, and **N/A until Phase 24** for lockout: no form or sign-in exists yet.
- [x] Authorization tests cover every server action, and the unguarded-action CI check passes — **N/A until Phase 25**: the code has no `"use server"` module and no route handler that writes.
- [x] Least-privilege DB role in use, migrator credentials absent from the runtime, production branch protected, restore rehearsed:
  - **done:** the runtime uses `rhm_app`. `lib/env.ts` fails a Vercel build whose `DATABASE_URL` is another role or lacks `sslmode`, or that has `MIGRATOR_DATABASE_URL` or `BOOTSTRAP_DATABASE_URL` set. `roles.db.test.ts` proves `rhm_app` cannot run DDL.
  - **accepted in writing:** a protected production branch is not available on Neon Free (Phase 7 spec, D10; *Security baseline*).
  - **Phase 16:** production roles and the restore rehearsal.
- [x] No `*RawUnsafe`, `dangerouslySetInnerHTML` or `NEXT_PUBLIC_` secrets — **done**. A search of the app, lib, scripts, prisma and content code finds neither API: the 2 matches are comments that say it is not used. ESLint bans both. The only `NEXT_PUBLIC_` variables are `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, both public by design.
- [x] Dependency audit clean (no high or critical findings) — **done**. `pnpm audit --prod --audit-level high`: "No known vulnerabilities found", locally and in CI `ci`.
- [x] Alerting tested, and the Firewall and rotation runbooks written — **done**. The test alert reached both inboxes (run 38945956023). `docs/runbooks/monitoring.md`, `firewall.md` and `secret-rotation.md` exist, and the rotation was rehearsed on `RATE_LIMIT_SALT` (Preview). The hourly schedule goes live on `main` in Phase 16.
- [x] `/security-review` findings resolved or accepted in writing — **done**. No findings at the reporting bar over `origin/main...HEAD`. The one excluded candidate (preview jobs running a deployment's commit with the bypass secret) was hardened anyway with the `same-repo` guard (`implementation.md`).

## Gates

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass
- [x] The route table is unchanged apart from the not-found and `/dev/error` routes (C2)
- [x] `pnpm test:e2e` passes locally (ready and unavailable) and in CI; `preview-e2e` and `lighthouse` pass on the Vercel preview
- [x] `pnpm test:db` passes (no schema change)
- [x] No secret appears in any log, report or artifact (C6). The logs of the preview, Lighthouse and monitor runs were searched: every `***` is GitHub masking a step's environment listing or checkout token, and no script output contains one. Lighthouse writes no report, and no job uploads artifacts.
- [x] Owner check on the preview: the 404 page, and a walk-through on a phone **Moved to Phase 16** on the production URL, by owner decision (2026-10-16). The same journey is proven by `smoke.spec.ts` (desktop, mobile, keyboard) and `not-found.spec.ts` on the preview.
