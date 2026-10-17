# Phase 7 — Database foundation

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 2 groundwork, Phase 7
- **Branch:** `feature/phase-07-database-foundation` (from `develop` at `61b78c5`)
- **Started:** 2026-10-12

## What and why

Give the platform a database it can trust, before any feature writes to it. This phase builds no page. It delivers:

- a Neon project with separate branches for previews and local development;
- Prisma 7 wired to Neon through `@prisma/adapter-neon`, with the first committed migration;
- the `PortfolioItem` and `MediaItem` tables that Phases 8–11 fill, and an empty seed script;
- the shared `rateLimit()` building block on the `RateLimitHit` table, which every public form uses from Phase 18;
- the database security baseline: least-privilege roles, TLS, a `server-only` client, migrations from CI only and console 2FA.

Security arrives with the feature it protects (mission principle 9), so the roles and their tests ship before any table holds real data.

## Constitution sections this phase relies on

- `mission.md` → *Guiding principles* 2 (the site is the proof), 6 (small, verifiable steps) and 9 (secure from the first commit)
- `tech-stack.md` → *Core* (Neon, Prisma 7 row), *Security baseline* → rate limiting and *Database security & data protection*, *Schema decisions*, *Environment variables*
- `roadmap.md` → Phase 7; open question 9 (hosting plans); Phase 16 (production branch, restore rehearsal); Phase 18 (first `rateLimit` caller); Phase 23 (rate-limit purge job)
- `README.md` §5 → `PortfolioItem`, `MediaItem`, `RateLimitHit` and the enums they use

## Owner answers (2026-10-12)

- Phase 7 is "Database foundation" (roadmap row 7).
- Neon is on the **Free plan** (open question 9).
- **No Neon project exists yet.** The old site was static. Setup steps are in *Owner setup* below.

## Scope

1. **Neon project** (D1, D2, D10): project `redhat-media` on the Free plan with the branches `production` (root, untouched until Phase 16), `preview` and `dev`.
2. **Roles** (D3, D4): `rhm_migrator`, `rhm_app` and `rhm_readonly`, created per branch by `scripts/db-bootstrap.mts`. Their grants and default privileges are the first Prisma migration.
3. **Prisma 7** (D5):
   - `prisma/schema.prisma`, with the `prisma-client` generator writing to `lib/generated/prisma` (git-ignored, generated on install);
   - `prisma.config.ts`, which reads `MIGRATOR_DATABASE_URL`;
   - migrations `…_roles` (SQL only) and `…_init` (enums plus three models);
   - an empty `prisma/seed.mts`.
4. **Runtime client** (D6): `lib/db.ts`, which imports `server-only` and builds a lazy `PrismaClient` on `new PrismaNeon({ connectionString })`.
5. **Rate limiter** (D8): `lib/security/rate-limit.ts` → `rateLimit(bucket, key, { max, windowSec })`.
6. **Env validation** (D7): `DATABASE_URL` and `RATE_LIMIT_SALT` join `lib/env.ts`, and the build refuses a migrator credential on Vercel.
7. **Tests and CI** (D9):
   - unit tests for env rules and the limiter's pure parts;
   - a new `db` CI job on a Postgres service container that runs bootstrap, migrations, a drift check and the database tests (rate limit and role privileges);
   - a `migrate-preview` job that applies migrations to the Neon `preview` branch on every push to `develop`.
8. **Lint** (D6): `app/**` and `components/**` cannot import the generated client or a database driver.
9. **Docs**: `.env.example`, the `CLAUDE.md` command table, and the constitution changes listed below.

## Constitution changes (in this PR, before the code)

- **`tech-stack.md`:**
  - *Core → Database:* London region, the three branches and "no Neon–Vercel integration" (D1, D2).
  - *Core → ORM:* replace "the exact `PrismaNeon` constructor is confirmed in the Phase 7 spec" with `new PrismaNeon({ connectionString })` (D6).
  - *Supporting tools:*
    - add a row for database tests: `@prisma/adapter-pg`, `pg` and `@types/pg`, used by tests and scripts only (D9);
    - *Unit tests* gains `pnpm test:db`.
  - *Database security:*
    - roles are created by `scripts/db-bootstrap.mts`, and their grants are the first migration (D3, D4);
    - the protected-branch row notes the Free plan and the stand-ins (D10);
    - the backups row records the 6-hour window (D10).
  - *Environment variables:* add `BOOTSTRAP_DATABASE_URL` (owner terminal only, never stored) and the `neon-preview` GitHub Environment (D3, D11).
- **`roadmap.md`:** open question 9 is answered (Free plan; decide on Launch before Phase 18), and the Phase 16 row gains "bootstrap `production` roles" (D2, D10).
- **`CLAUDE.md`:** the command table gains `pnpm test:db`, `pnpm db:migrate` (`prisma migrate dev`, `dev` branch only) and `pnpm db:studio`.

## Out of scope

- Any page or server action that reads or writes the database (Phase 8 onward).
- Seed content (Phase 9 fills the seed script).
- The `Inquiry`, `ContentBlock`, `ServiceSetting`, `AuditEvent` and Better Auth tables (Phases 17, 26, 31, 25 and 24).
- The production branch, its roles and a restore rehearsal (Phase 16).
- The rate-limit purge job (Phase 23).
- Neon connection-saturation and query-volume alerts (Phase 15).

## Decisions

| # | Decision | Reason | Source |
| --- | --- | --- | --- |
| D1 | **Neon project `redhat-media`, Free plan, Postgres 17, AWS Europe (London) `aws-eu-west-2`.** `vercel.json` gets `"regions": ["lhr1"]`, so the functions run in the same city as the database. **The Neon–Vercel integration is not installed.** Env vars are set by hand. | Most visitors are in Nigeria, and London is the closest region both Neon and Vercel offer. A database query then costs one hop inside London instead of a transatlantic one from the default `iad1`. The integration would inject owner-role connection strings into Vercel and create a branch per preview, which breaks least privilege (D3) and the Free plan's 10-branch limit. | Owner, 2026-10-12 (Free plan); `tech-stack.md` → *Core* |
| D2 | **Three branches.**<br>• `production` is the root and default branch. It stays empty until Phase 16 makes it production. Its roles are created then, so they get their own passwords.<br>• `preview` is a child of `production`. Vercel's Preview environment uses it, and CI migrates it on every push to `develop`.<br>• `dev` is a child of `production`, for local development and `prisma migrate dev`.<br>Both children are created **before** any roles exist, so no password is shared between branches (D3). That leaves 3 of the 10 Free-plan branches in use. | It matches the tech stack's split between production and preview/dev. Separate credentials per branch mean a leaked preview or dev credential cannot open production. | `tech-stack.md` → *Core*, *Database security* |
| D3 | **Roles are created by a script, not by a committed migration.** `scripts/db-bootstrap.mts` (Node 24, run with `node`) connects with the branch's owner credential (`BOOTSTRAP_DATABASE_URL`, set in the owner's own terminal and never saved). It runs one transaction that:<br>• creates or re-keys `rhm_migrator`, `rhm_app` and `rhm_readonly` with `LOGIN` and a fresh 256-bit random password each;<br>• runs `REVOKE CREATE ON SCHEMA public FROM PUBLIC`;<br>• grants `USAGE, CREATE` on `public` to `rhm_migrator`, and `USAGE` to the other two;<br>• with `--dev`, also gives `rhm_migrator` `CREATEDB`, so `prisma migrate dev` can make its shadow database on the `dev` branch only.<br>It writes the three ready-made URLs and a fresh `RATE_LIMIT_SALT` to the git-ignored `.env.neon-<branch>.local` and prints no secret. The app URL uses the pooled host, the other two the direct host, and all three have `sslmode=require`. Running it again rotates every password. CI runs the same script against its Postgres container. | A committed migration cannot hold passwords. SQL-created roles do not join `neon_superuser`, so they get only what is granted. One script serves setup, CI and rotation, so the three cannot drift apart. Secrets never pass through chat, the repo or the terminal scrollback. | Neon docs → *Manage roles with SQL*; `tech-stack.md` → *Database security* |
| D4 | **Grants live in the first migration, `…_roles`,** which `rhm_migrator` applies before any table exists:<br>• `ALTER DEFAULT PRIVILEGES FOR ROLE rhm_migrator IN SCHEMA public` grants `SELECT, INSERT, UPDATE, DELETE` on tables and `USAGE, SELECT` on sequences to `rhm_app`;<br>• the same command grants `SELECT` on tables to `rhm_readonly`.<br>Every table created later is covered automatically. `_prisma_migrations` is created before this migration runs, so neither role can touch the migration history. `rhm_app` gets no `TRUNCATE`, `REFERENCES` or `TRIGGER`, and owns nothing. | It meets the roadmap's "roles (SQL migration)" and `ALTER DEFAULT PRIVILEGES` items. The tests prove the defaults reach tables that were never granted explicitly. | Roadmap Phase 7; `tech-stack.md` → *Database security* |
| D5 | **Prisma 7 setup.**<br>• **Pins:** `prisma`, `@prisma/client` and `@prisma/adapter-neon` at `7.10.0`, `@neondatabase/serverless` `1.2.0`, `server-only` `0.0.1`.<br>• **Generator:** `prisma-client`, output `../lib/generated/prisma`. A `postinstall` script runs `prisma generate`, so CI and Vercel generate the client on install.<br>• **`prisma.config.ts`:**<br>&nbsp;&nbsp;– it loads `.env.local` with Node's built-in `process.loadEnvFile` when the file exists (no `dotenv`);<br>&nbsp;&nbsp;– its datasource `url` is `process.env.MIGRATOR_DATABASE_URL`, read without the throwing `env()` helper, so `prisma generate` works with no database configured;<br>&nbsp;&nbsp;– its seed is `node prisma/seed.mts`.<br>• **Schema:** the enums `ServiceCategory`, `MediaKind`, `VideoProvider` and `MediaOwner`, and the models `PortfolioItem`, `MediaItem` and `RateLimitHit`, exactly as in README §5. | These are the tech stack's pins, and npm's `latest` points at 8.0.0-rc. Node 24 already provides env-file loading and TypeScript stripping, so no `dotenv` or `tsx` is needed. README §5 is the agreed blueprint. | `tech-stack.md` → *Core*; Prisma 7 upgrade guide (ctx7, 2026-10-12) |
| D6 | **One server-only client, built lazily.**<br>• `lib/db.ts` starts with `import "server-only"`. It exports `getDb()`, which builds `new PrismaClient({ adapter: new PrismaNeon({ connectionString }) })` on first call. In development the client is cached on `globalThis`.<br>• Node 24's global `WebSocket` is passed to `neonConfig.webSocketConstructor`, so the `ws` package is not needed.<br>• `getDb()` throws a clear error when `DATABASE_URL` is unset, and nothing touches the database at import or build time.<br>• ESLint forbids `app/**` and `components/**` from importing `@/lib/generated/*`, `@prisma/*`, `@neondatabase/serverless` and `pg`, so pages go through server modules. | `@prisma/adapter-neon@7.10.0` types read `constructor(config: neon.PoolConfig, options?)`. It takes a config and builds its own pool; the older `new PrismaNeon(pool)` form is gone. A lazy client keeps static pages static and the build free of database access. | `@prisma/adapter-neon@7.10.0` `index.d.ts`, read 2026-10-12; `tech-stack.md` → *Database security* |
| D7 | **Env rules** (`lib/env.ts`, unit-tested):<br>• `DATABASE_URL` must be a `postgres(ql)://` URL with `sslmode=require` (or `verify-full`) and the username `rhm_app`.<br>• `RATE_LIMIT_SALT` must be at least 32 characters.<br>• Both are **required when `VERCEL_ENV` is `preview` or `production`**. Locally and in the CI build they are optional, because no page reads them yet.<br>• On Vercel (`VERCEL=1`), the build **fails if `MIGRATOR_DATABASE_URL` or `BOOTSTRAP_DATABASE_URL` is set**.<br>`.env.example` lists `DATABASE_URL`, `RATE_LIMIT_SALT` and the local-only `MIGRATOR_DATABASE_URL`. | Checking the username stops the migrator or owner credential from being used as the runtime URL. The build guard enforces "migrator credential absent from Vercel env" on every deploy, not only on the day it is first checked. | Roadmap Phase 7 "Done when"; `tech-stack.md` → *Environment variables* |
| D8 | **`rateLimit(bucket, key, { max, windowSec })` is a fixed-window counter in Postgres.**<br>• **Window:** `windowEnd = (⌊now / windowMs⌋ + 1) × windowMs`.<br>• **Key:** `keyHash = SHA-256(RATE_LIMIT_SALT + key)` as 64 hex characters. The raw key is never stored.<br>• **Count:** one Prisma `upsert` on `@@unique([bucket, keyHash, windowEnd])` with `count: { increment: 1 }`. Prisma runs this as a native `INSERT … ON CONFLICT DO UPDATE`, so parallel calls cannot lose a count.<br>• **Result:** `{ allowed: count ≤ max, remaining, resetAt }`.<br>• **Validation:** Zod checks the inputs. A bucket matches `^[a-z0-9]+(\.[a-z0-9-]+)*$`, and `max` and `windowSec` are positive integers.<br>• **Errors:** database errors are thrown, not swallowed. Each caller decides whether to fail open or closed (Phase 18 decides it for the inquiry form).<br>• The logic is `createRateLimiter(db, salt, now)`, and `rateLimit()` wires it to `getDb()` and the env salt, so tests can pass in a client and a clock. | It is the design in `tech-stack.md`, with no in-memory state. A single atomic statement handles concurrency without locks. Swallowing errors would hide an outage. | `tech-stack.md` → *Security baseline* (rate limiting); README §6 |
| D9 | **Tests run on a real Postgres, without production secrets.**<br>• `*.db.test.ts` files run under `pnpm test:db` and are excluded from `pnpm test`. They connect with `@prisma/adapter-pg` and `pg`, which are **devDependencies, used only by tests and scripts**.<br>• The new **`db` CI job** runs on a `postgres:17` service container: install → `db-bootstrap.mts` → `prisma migrate deploy` as `rhm_migrator` → `prisma migrate diff` against `schema.prisma` with `--exit-code` (the drift check) → `pnpm test:db`.<br>• The same tests run locally against the Neon `dev` branch, once, to prove the role rules on Neon itself.<br>• Tests prove:<br>&nbsp;&nbsp;– request N+1 in a window is blocked and the next window resets;<br>&nbsp;&nbsp;– buckets and keys are counted independently;<br>&nbsp;&nbsp;– 25 parallel calls with `max: 10` allow exactly 10;<br>&nbsp;&nbsp;– the stored key is a 64-hex hash, not the input;<br>&nbsp;&nbsp;– `rhm_app` **cannot** `CREATE`, `ALTER`, `DROP` or `TRUNCATE`, cannot read `_prisma_migrations`, and is not a superuser and has no `CREATEROLE` or `CREATEDB`;<br>&nbsp;&nbsp;– `rhm_app` can `SELECT`, `INSERT`, `UPDATE` and `DELETE` on all three tables;<br>&nbsp;&nbsp;– `rhm_readonly` can `SELECT` but not `INSERT`;<br>&nbsp;&nbsp;– every app table is owned by `rhm_migrator`. | The Neon driver speaks WebSocket, which a plain Postgres container does not serve. `adapter-pg` is Prisma's own TCP adapter, on the same version and with the same generated client. A container keeps PR and Dependabot runs free of database secrets. Running once on Neon covers what a container cannot, such as `neon_superuser`. | Roadmap Phase 7 "Done when" |
| D10 | **Free plan: what it costs us, and what stands in for the paid features.**<br>• **Restore window: 6 hours,** fixed on Free and capped at 1 GB of changes (confirmed in the Neon docs, 2026-10-12). Free also keeps one manual snapshot.<br>• **Protected branches are paid only.** Until an upgrade, production protection rests on:<br>&nbsp;&nbsp;– `production` being the root branch, which Neon will not delete;<br>&nbsp;&nbsp;– migrations running only from CI;<br>&nbsp;&nbsp;– the owner being the only console member, with 2FA;<br>&nbsp;&nbsp;– a manual snapshot before each production migration (from Phase 16).<br>• **Computes scale to zero after 5 minutes,** so the first query after idle is slower.<br>• **Recommendation:** decide on Neon Launch before **Phase 18**, when inquiries (personal data) first arrive. A mistake found the next morning cannot be undone with a 6-hour window. | Open question 9 is answered for Phase 7. The tech stack's "protected branch" and "PITR window confirmed" items are recorded honestly instead of being assumed. | Owner, 2026-10-12; Neon docs → *Plans*, *History window* |
| D11 | **Migrations reach Neon only from CI.**<br>• The `migrate-preview` job in `ci.yml` runs `prisma migrate deploy` on pushes to `develop`, after `ci` and `db` pass.<br>• It uses the `MIGRATOR_DATABASE_URL` secret of the GitHub Environment **`neon-preview`**.<br>• The workflow's concurrency no longer cancels runs on `develop`, so a migration is never cut off mid-run.<br>• Locally, `prisma migrate dev` runs against the `dev` branch only.<br>• Production migrations (Phase 16) get their own environment and secret. | The tech stack requires "migrations from CI only". An Environment scopes the secret to one job. A `workflow_run` trigger cannot be used, because it would read the workflow from the default branch, `main` (git). | `tech-stack.md` → *Database security* |

## Constraints

- **C1 — Only listed libraries.** The runtime additions are already named in `tech-stack.md`. `@prisma/adapter-pg`, `pg` and `@types/pg` are added to it as test and script devDependencies before they are installed.
- **C2 — Pages unchanged.** No route reads the database, and the build route table matches `develop`.
- **C3 — No secret leaves its home.** Connection strings and the salt live only in Neon, the owner's `.env*.local` files, Vercel's Preview env and the `neon-preview` GitHub Environment. They never go in chat, commits or logs. gitleaks stays green.
- **C4 — Existing suites hold.** `pnpm test` and `pnpm test:e2e` pass unchanged.
- **C5 — Raw SQL only through tagged templates.** The existing `$queryRawUnsafe` / `$executeRawUnsafe` lint ban stays. The tests' privilege probes use `pg` with fixed statements, and take no input.

## Owner setup (before the build can be verified)

Do these yourself. Do not paste any URL, password or salt into the chat.

1. **2FA.** Sign in to Neon with an account protected by 2FA (a GitHub or Google login with 2FA on, or Neon's own MFA). Do the same check for Vercel.
2. **Project.** Create the project at **console.neon.tech, under your own Neon account**. Do not use Vercel's *Storage → Neon* flow, which makes a Vercel-managed organization whose projects cannot be transferred out (Neon docs → *Transfer projects*). Name it `redhat-media`, with Postgres 17 in region **AWS Europe (London)**. Do not add either Neon–Vercel integration afterwards. **Done 2026-10-12:** project ID `soft-star-93705508`, default branch `production`. Of Neon's suggested setup, the CLI install and `neon link` are used. The owner then asked for the Neon agent skill and the MCP server too (2026-10-12):
   - the `neon` skill sits in `.claude/skills/neon/` and is recorded in `skills-lock.json`;
   - the MCP server is in `.mcp.json`. It uses OAuth (no key in any file) and is pinned to `?projectId=soft-star-93705508`.

   **Agent rule:** the agent never uses MCP or the CLI to read connection strings or passwords, or to run the role bootstrap. Secrets stay with the owner (D3). `neon.ts` / `neon deploy` stay skipped, because `@neon/config` is not in `tech-stack.md`.
3. **Branches.** Create `preview` and `dev` as children of `production`, before running anything else.
4. **Bootstrap.** For each of `preview` and `dev`, open *Connect* with role `neondb_owner`, pooling **off**, and copy the URL. Then, in your own PowerShell window inside the repo:
   ```powershell
   $env:BOOTSTRAP_DATABASE_URL = "<paste here>"
   node scripts/db-bootstrap.mts --branch preview      # for dev: --branch dev --dev
   Remove-Item Env:BOOTSTRAP_DATABASE_URL
   ```
   Each run writes `.env.neon-<branch>.local`.
5. **Place the values:**
   - **GitHub:** Settings → Environments → new environment `neon-preview` → secret `MIGRATOR_DATABASE_URL` = the `preview` file's migrator URL.
   - **Vercel → Preview env:** `DATABASE_URL` = the `preview` app URL, and `RATE_LIMIT_SALT` = the `preview` salt.
   - **`.env.local`:** copy the `dev` file's `DATABASE_URL`, `MIGRATOR_DATABASE_URL` and `RATE_LIMIT_SALT`.
6. **Required check.** Add `db` to the `develop` ruleset's required status checks.

I will build and test against Docker Postgres while you do this. Steps 4–5 are needed before the Neon checks in `validation.md` can run.
