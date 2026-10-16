# Validation — Phase 15 Launch readiness + security gate

## Roadmap success check ("Done when", verbatim)

> Lighthouse scores ≥ 90 on mobile for every template, and the smoke test is green. Every applicable checklist item is ticked, and a test alert reaches the team.

- [ ] **Lighthouse:** Performance, Accessibility, Best Practices and SEO ≥ 90 on mobile for every template, with `is-crawlable` skipped on the preview only (D6). Scores recorded per URL.
- [ ] **Smoke test:** green in the desktop, mobile and keyboard variants, in CI and on the Vercel preview (D5).
- [ ] **Checklist:** every applicable item below is ticked (D10).
- [x] **Test alert:** the labelled run failed with "TEST ALERT" and its email reached the recipients from owner answer D (D7). Run 38945956023, 2026-10-16. Every real check passed against develop's preview and the Neon preview branch first. "[eonerhime/redhat-media] PR run failed: monitor - …" arrived at `emo.onerhime@gmail.com`, and the Gmail filter's forwarded copy at `redhatmediang@gmail.com` (owner).

## Error pages

- [ ] `/nope` answers 404 with the branded view, the header and footer, `noindex` and the four links (D1)
- [ ] An unknown service slug and an unknown portfolio slug show the same view, keeping the soft 404 (D1)
- [ ] `/dev/error` shows the branded error view from `app/error.tsx`, and retry recovers. Production answers 404 for it (D2, amended)

## Analytics

- [ ] Web Analytics and Speed Insights are on in the dashboard and load from the preview's own origin. They are absent from local and CI builds (D3)
- [ ] The CSP is unchanged, and `csp.spec.ts` on the preview logs no violation (D3, C4)

## Accessibility

- [ ] `a11y.spec.ts` finds zero WCAG 2.2 A/AA violations on every route at 360px and 1440px, with the nav and lightbox open, in CI and on the preview (D4)
- [ ] 200% zoom checked, and the owner's screen-reader spot check recorded (D4)

## Monitoring and edge

- [ ] `monitor.mts` passes against develop's preview and the Neon preview. The thresholds are recorded with their baseline (D7)
- [x] Neon usage alerts and Vercel deployment-failure notifications are confirmed on (D7): Neon's emails go to an inbox the owner reads. Vercel's Hobby account menu has no notification-preferences page, so deployment failures are seen as the failing `Vercel` check on the PR (owner, 2026-10-16).
- [ ] Firewall rules are set as in `docs/runbooks/firewall.md`. `/.env` and the other scanner paths answer 403. A fast burst is stopped by Vercel's own mitigation (challenge) before the per-IP rule counts up (D8, as observed)
- [ ] The runbooks exist: `monitoring.md`, `firewall.md` and `secret-rotation.md`. The rotation rehearsal passed, with its timing recorded (D9)

## Pre-launch security checklist (`tech-stack.md`, Phase 15 run)

Each item is marked **done** (with evidence), **N/A until Phase N**, or **Phase 16**.

- [ ] All headers present, and the CSP enforced with no violations
- [ ] Rate-limit, Turnstile, honeypot and lockout tests green (where the feature exists)
- [ ] Authorization tests cover every server action, and the unguarded-action CI check passes
- [ ] Least-privilege DB role in use, migrator credentials absent from the runtime, production branch protected, restore rehearsed
- [ ] No `*RawUnsafe`, `dangerouslySetInnerHTML` or `NEXT_PUBLIC_` secrets
- [ ] Dependency audit clean (no high or critical findings)
- [ ] Alerting tested, and the Firewall and rotation runbooks written
- [ ] `/security-review` findings resolved or accepted in writing

## Gates

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass
- [ ] The route table is unchanged apart from the not-found and `/dev/error` routes (C2)
- [ ] `pnpm test:e2e` passes locally (ready and unavailable) and in CI; `preview-e2e` and `lighthouse` pass on the Vercel preview
- [ ] `pnpm test:db` passes (no schema change)
- [ ] No secret appears in any log, report or artifact (C6)
- [ ] Owner check on the preview: the 404 page, and a walk-through on a phone
