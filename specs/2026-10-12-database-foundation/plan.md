# Plan — Phase 7 Database foundation

Scope, decisions (D1–D11) and constraints (C1–C5) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 0. Constitution first

- [x] 0.1 `specs/tech-stack.md`: the Database, ORM, Supporting tools, Database security and Environment variables edits listed in the spec.
- [x] 0.2 `specs/roadmap.md`: answer open question 9; add "bootstrap `production` roles" to Phase 16.
- [x] 0.3 `CLAUDE.md`: new commands (`test:db`, `db:migrate`, `db:studio`).

## 1. Dependencies and config

- [x] 1.1 Install the exact pins (D5) and the test devDependencies (D9). Approve any needed build scripts in `pnpm-workspace.yaml` → `allowBuilds`.
- [x] 1.2 `package.json` scripts: `postinstall` (`prisma generate`), `test:db`, `db:migrate`, `db:deploy`, `db:studio`, `db:seed`.
- [x] 1.3 `vitest.config.mts`: exclude `**/*.db.test.ts` from `pnpm test`; add a standalone `vitest.db.config.mts` for `test:db`. No `server-only` alias was needed, because the limiter core is a separate module (see implementation.md).
- [x] 1.4 `vercel.json`: `"regions": ["lhr1"]` (D1).
- [x] 1.5 `.gitignore`: confirm that `.env*` covers `.env.neon-*.local`, and that `/lib/generated/` is ignored.

## 2. Schema and migrations

- [x] 2.1 `prisma/schema.prisma`: the generator, the datasource, four enums and three models (D5).
- [x] 2.2 `prisma.config.ts`: `loadEnvFile`, the non-throwing URL, the migrations path and the seed (D5).
- [x] 2.3 Migration `…_roles`: default privileges, SQL only (D4).
- [x] 2.4 Migration `…_init`: generated from the schema against the Docker Postgres, then reviewed.
- [x] 2.5 `prisma/seed.mts`: an empty seed that exits 0.

## 3. Bootstrap script

- [x] 3.1 `scripts/db-bootstrap.mts`: owner URL from env, one transaction, create or re-key the roles, schema grants, `--dev` CREATEDB, write `.env.neon-<branch>.local` (pooled app host, direct migrator and readonly hosts, `sslmode=require`, new salt), no secret on stdout (D3).
- [x] 3.2 Refuse to write the output file when `--branch` is missing or the target file is tracked by git.

## 4. Runtime code

- [x] 4.1 `lib/env.ts` and `lib/env.test.ts`: `DATABASE_URL`, `RATE_LIMIT_SALT` and the Vercel migrator guard (D7).
- [x] 4.2 `lib/db.ts`: `server-only`, the lazy `getDb()`, the global `WebSocket` and the dev cache (D6).
- [x] 4.3 `lib/security/rate-limit.ts`: `createRateLimiter` plus `rateLimit()`; the window maths, the hash and Zod input checks (D8).
- [x] 4.4 `lib/security/rate-limit.test.ts`: unit tests for the window boundaries, the hash and the input rejection.
- [x] 4.5 `eslint.config.mjs`: the driver and generated-client import ban for `app/**` and `components/**` (D6).

## 5. Database tests

- [x] 5.1 `lib/db/test-client.ts`: a `PrismaPg` client from `TEST_APP_DATABASE_URL` and a `pg` client per role (D9).
- [x] 5.2 `lib/security/rate-limit.db.test.ts`: N+1 blocked, the window resets, independence, 25 parallel calls, the stored hash (D9).
- [x] 5.3 `lib/db/roles.db.test.ts`: the `rhm_app` DDL refusals, DML allowed, `_prisma_migrations` hidden, role attributes, readonly limits, table ownership (D9).

## 6. CI

- [x] 6.1 `ci.yml` → job `db`: a `postgres:17` service, bootstrap, `migrate deploy`, the drift check, `test:db` (D9).
- [x] 6.2 `ci.yml` → job `migrate-preview`: on push to `develop`, `needs: [ci, db]`, environment `neon-preview` (D11).
- [x] 6.3 `ci.yml` concurrency: cancel in progress on pull requests only (D11).

## 7. Neon (after the owner setup)

- [x] 7.1 `pnpm db:deploy` and `pnpm test:db` against the Neon `dev` branch (D9).
- [x] 7.2 A one-off check of the runtime path against `dev` (Neon driver, pooled, `rhm_app`) connects and reads `RateLimitHit`. TLS is proven by Neon refusing plaintext on both the pooled and direct hosts. `pg_stat_ssl` was not usable (see implementation.md).
- [x] 7.3 `vercel env ls preview` lists `DATABASE_URL` and `RATE_LIMIT_SALT` and no migrator variable (names only).

## 8. Verify and open the PR

- [ ] 8.1 Work through every item in [`validation.md`](validation.md).
- [ ] 8.2 Push the branch and open the PR `feature/phase-07-database-foundation` → `develop`.
