# Validation — Phase 7 Database foundation

## Roadmap success check ("Done when", verbatim)

> Prisma Studio shows the tables. Rate-limit tests show that request N+1 inside the window is blocked and that the window resets. A test proves `rhm_app` **cannot** run DDL, and the migrator credential is absent from Vercel env.

- [x] **Studio:** `pnpm db:studio` against the `dev` branch shows `PortfolioItem`, `MediaItem` and `RateLimitHit` (owner check) (owner, 2026-10-12: all three present and empty)
- [x] **Rate limit:** `rate-limit.db.test.ts` passes in the CI `db` job and against Neon `dev`: N+1 is blocked, the next window resets, and 25 parallel calls allow exactly 10 (D8, D9)
- [x] **No DDL:** `roles.db.test.ts` passes in CI and against Neon `dev`: `rhm_app` is refused `CREATE`, `ALTER`, `DROP` and `TRUNCATE` (D4, D9)
- [x] **Migrator absent from Vercel:** `vercel env ls` shows no `MIGRATOR_DATABASE_URL` or `BOOTSTRAP_DATABASE_URL` in any environment, and the env unit test proves the build fails if one is added (D7)

## Security baseline (roadmap "DB security" items)

- [x] **Roles:** the three roles exist on `preview` and `dev`, with separate passwords per branch; `production` has none yet (D2, D3)
- [x] **Default privileges:** `rhm_app` can use tables that were never granted to it explicitly (D4)
- [x] **TLS:** every URL has `sslmode=require`, the env check rejects one without it, Neon **refuses a plaintext connection** on both the pooled and direct hosts, a TLS connection with certificate verification succeeds, and the Neon driver uses `wss://` (D7). `pg_stat_ssl` is not a valid check on Neon, because it reports the proxy's internal hop to Postgres.
- [x] **`server-only`:** importing `lib/db.ts` from a client component fails the build (negative test)
- [ ] **Migrations from CI only:** after the merge, `migrate-preview` applies both migrations to `preview` (D11)
- [x] **Console 2FA:** Neon and Vercel sign-ins use 2FA (owner check) (owner, 2026-10-12)
- [x] **Restore window confirmed:** 6 hours on Free, recorded in `tech-stack.md` (D10)

## Local commands

- [x] `pnpm install --frozen-lockfile` succeeds and generates the client
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` pass
- [x] `pnpm test:db` passes against Docker `postgres:17` after bootstrap and `migrate deploy`
- [x] `prisma migrate diff` against `schema.prisma` reports no drift
- [x] `pnpm build` passes, and the route table matches `develop` (C2)
- [x] `pnpm test:e2e` passes (C4)
- [x] `pnpm audit --prod --audit-level high` reports no known vulnerabilities

## Negative tests (each guard must bite)

Run each as an uncommitted change, then revert it with a reverse edit (not `git checkout`).

- [x] **Grant too wide:** adding `GRANT CREATE ON SCHEMA public TO rhm_app` to the bootstrap fails `roles.db.test.ts`
- [x] **Off-by-one:** changing `count ≤ max` to `count < max` fails `rate-limit.db.test.ts`
- [x] **Wrong runtime role:** a `DATABASE_URL` with user `rhm_migrator` fails `parseEnv`
- [x] **Driver in a page:** importing `@/lib/generated/prisma/client` in `app/page.tsx` fails `pnpm lint`
- [x] **Drift:** adding a field to `schema.prisma` without a migration fails the drift check

## Owner checks

- [x] Neon project, region and branches as in D1 and D2 (verified with the CLI: `aws-eu-west-2`, Postgres 17, `production` / `preview` / `dev`, no expiry; app roles on `preview` and `dev` only)
- [x] Secrets placed as in *Owner setup* (GitHub `neon-preview`, Vercel Preview, `.env.local`). Two values reached the chat through IDE selections or pastes; both were rotated (preview re-bootstrapped, preview `neondb_owner` reset) before use. See implementation.md.
- [ ] `db` is a required check on `develop`
- [x] The Free-plan trade-offs (D10) are accepted, and a date is noted for the Launch decision (owner, 2026-10-12: accepted; decide on Neon Launch before Phase 18)

## CI

- [ ] CI is green on the PR (`ci`, `db`, `gitleaks`, `preview-headers`, Vercel)

## Spec hygiene

- [ ] Every `plan.md` box is ticked, and `implementation.md` records any deviations
