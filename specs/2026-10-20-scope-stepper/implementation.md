# Implementation log — Phase 19 Scope stepper

Newest entries at the bottom. Each entry gives the date, what landed, and any departure from [`spec.md`](spec.md).

## Progress

- **2026-10-20** — Branch `feature/phase-19-scope-stepper` created from `develop` at `dd4a340`. Owner answers A–I given; spec, plan and validation drafted for approval.
- **2026-10-20** — Owner answer J: the USD hints use the official rate plus 10%. CBN NFEM closing rate ₦1,332.26/$ on 16 October 2026 (the last business day before the change; it agrees with monierate.com and the withinnigeria.com report of 20 October), so ₦1,465.49/$. Appendix A's budget labels recalculated.
- **2026-10-20** — Owner approved the spec, Appendices A and B, with two review notes applied: the `noscript` copy now reads "…or call one of the numbers on this page", and a project type shown outside its service group (emails, inbox, exports) carries its service name.
- **2026-10-20** — Plan 0.1–0.3: roadmap Phase 19 row (project types, review step) and open question 7 answered; tech-stack *Schema decisions* (`projectTypes` row; budget and timeline required by the schema from Phase 19); README §5 `Inquiry` gains `projectTypes String[]`.
- **2026-10-20** — Plan 1.1, **baseline** (D14): with `INQUIRY_FORM_ENABLED=1` and the Turnstile test keys, `next build` on `66b6d51` (Phase 18 code). `.next/server/app/contact.html` loads **12 JS files, 194,278 B gzipped** (189.7 kB; each file gzipped at level 9 and summed).
- **2026-10-20** — Plan 2.2: `projectTypes String[] @default([])`; migration `20261020120000_inquiry_project_types` adds `TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`. Prisma generates the column without `NOT NULL`, but `prisma migrate diff --from-config-datasource --to-schema --exit-code` reports no difference with it, so D2 stands as written. Applied to the local test Postgres (`rhm-pg`) and to Neon `dev` (`migrate deploy`, the dev-only local flow). `lib/db/inquiry-project-types.db.test.ts`: a row saved without the column reads back `[]`, NULL is refused, `rhm_readonly` is still denied.

## Deviations from plan

- **The migration ships first, in its own PR** (as Phase 12 did with PR #16, `creditUrl`). `preview-e2e` on the feature PR saves an inquiry to Neon `preview`, which `migrate-preview` migrates only from a `develop` push, so the feature PR cannot pass until the column is there. The expand-first PR holds this spec folder, the constitution edits (plan 0.1–0.3), the schema, the migration and its DB test. It is safe on its own: Phase 18 code never writes the column, which defaults to an empty list.
- **`projectTypeLabel(id)`** lives in `lib/content/project-types.ts`, beside the other block readers, not in `content/project-types.ts`, so the config imports nothing at runtime. Spec, Appendix B updated.

## Issues and fixes
