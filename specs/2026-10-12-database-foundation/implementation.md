# Implementation log — Phase 7 Database foundation

## Progress

- **2026-10-12** — Kickoff.
  - Branch `feature/phase-07-database-foundation` created from `develop` at `61b78c5` (Phase 6 merged).
  - Owner answers: Phase 7 is "Database foundation"; Neon is on the **Free plan**; **no Neon project exists** (the old site was static).
  - Research:
    - `@prisma/adapter-neon@7.10.0` types read `new PrismaNeon(config: PoolConfig, options?)`;
    - Neon Free has a fixed 6-hour history window (1 GB cap), 10 branches and 1 manual snapshot, and no protected branches;
    - roles created with SQL do not join `neon_superuser`.
  - Spec folder written; awaiting owner approval. No code yet.
- **2026-10-12** — Spec approved.
  - The owner created the Neon project `soft-star-93705508` in the Neon console, not through Vercel. The spec was clarified to say so, because Vercel-managed Neon organizations cannot transfer projects out.
  - The default branch is named `production`, and the spec was renamed to match. The owner approved this.
  - From Neon's suggested setup, the owner approved only the CLI install and `neon link`. Skills, MCP and `neon.ts` / `neon deploy` are skipped (spec → *Owner setup* 2).
  - The global `npm i -g neon` was blocked by the agent's auto-mode safety check, so the owner runs it.
- **2026-10-12** — Neon CLI linked.
  - The project is in the **e1rhyme** account, not the default CLI login. The CLI uses the named profile `e1rhyme` (`--profile e1rhyme`).
  - Verified: `redhat-media`, org `e1rhyme` (Free, Neon-owned), `aws-eu-west-2`, Postgres 17, history 21600 s (6 h). Branches `production` (default), `preview` and `dev` exist. The owner created them in the console before any roles existed, as D2 requires.
  - `preview` and `dev` were created with a 30-day expiry (2026-11-11). The expiry was removed with `neon branches set-expiration`, because expiring branches would delete the roles and credentials.
  - `neon link --project-id soft-star-93705508 --branch production -y` wrote `.neon` (IDs only, now git-ignored as `/.neon`).
  - It also **pulled the `production` owner credentials (`neondb_owner`) into a new `.env.local`**, as `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. The file is git-ignored and never committed, and no value was displayed. It conflicts with D3/D7, so the owner deleted the file. Future links use `--no-env-pull`.
- **2026-10-12** — Neon agent tooling (owner request, following `https://neon.com/.well-known/agent-skills/neon/SKILL.md`).
  - Before: no Neon skill (project or user level), no `.mcp.json`, and no Neon MCP server in `~/.claude.json` (global or project).
  - `neon skills -s neon --agent claude-code -y` installed `.claude/skills/neon/` (`SKILL.md` and 6 references) plus `skills-lock.json`. Reviewed: documentation only, no hooks or scripts.
  - `neon mcp --oauth --project --agent claude-code --project-id soft-star-93705508 -y` wrote `.mcp.json`. It holds only the server URL `https://mcp.neon.tech/mcp?projectId=soft-star-93705508`: no key, OAuth on first use. `~/.claude.json` and `.claude/settings.local.json` were not changed.
  - `.mcp.json` was run through Prettier (trailing newline), so `pnpm format:check` passes. The Markdown is already ignored by `.prettierignore`.
- **2026-10-12** — Build (plan groups 0–6), verified against Docker `postgres:17` (17.11).
  - Constitution first: `tech-stack.md` (Database, ORM, Database tests row, roles, Free-plan protection, 6-hour window, env and secrets), `roadmap.md` (open question 9 answered; Phase 16 bootstraps `production` roles) and `CLAUDE.md` (commands).
  - Pins:
    - runtime: `@prisma/client`, `@prisma/adapter-neon` 7.10.0, `@neondatabase/serverless` 1.2.0, `server-only` 0.0.1;
    - devDependencies: `prisma`, `@prisma/adapter-pg` 7.10.0, `pg` 8.23.0, `@types/pg` 8.23.1.
  - `allowBuilds`: `@prisma/engines` true (it downloads the schema engine that `migrate` needs); `prisma` false (only a Node-version preinstall check).
  - `postinstall: prisma generate`; scripts `test:db`, `db:migrate`, `db:deploy`, `db:studio`, `db:seed`. `vercel.json` has `regions: ["lhr1"]`.
  - Schema, migrations `20261012000000_roles` (hand-written) and `20261012000100_init` (from `migrate diff --from-empty`), and an empty `prisma/seed.mts`.
  - `scripts/db-bootstrap.mts`, with its pure SQL and URL logic in `lib/db/bootstrap.mts` (unit-tested). Verified on the container:
    - it creates the roles, and a re-run re-keys all three;
    - the output file is refused unless git-ignored;
    - no secret appears on stdout.
  - `lib/env.ts` (D7), `lib/db.ts` (D6), `lib/security/rate-limit-core.ts` + `rate-limit.ts` (D8), and the ESLint import ban (D6).
  - CI:
    - a `db` job (`postgres:17` service, bootstrap, `db:deploy`, the drift check, `test:db`; role passwords masked);
    - a `migrate-preview` job (push to `develop`, `needs: [ci, db]`, environment `neon-preview`);
    - concurrency cancels runs on pull requests only.
  - Results:
    - unit 448/448;
    - `test:db` 18/18 (rate limit 5, roles 13);
    - drift check "No difference detected";
    - typecheck, lint and format clean;
    - the build route table matches `develop`;
    - e2e 189/189 (`--workers=1`);
    - audit clean; frozen install OK; gitleaks on the staged tree finds no leaks.
  - Negative tests, each reverted by a reverse edit:
    - granting `CREATE` on `public` to `rhm_app` fails 3 role tests;
    - `count < max` fails 3 rate-limit tests;
    - a `@/lib/generated/prisma/client` value import or a `pg` import in `app/(public)/page.tsx` fails lint (a type-only model import is allowed);
    - an unmigrated schema field makes the drift check exit 2;
    - importing `@/lib/db` in the client component `components/nav-links.tsx` fails the build with the `server-only` error;
    - the wrong runtime role (`rhm_migrator`, `neondb_owner`) is covered by `lib/env.test.ts`.
- **2026-10-12** — Owner setup and Neon checks (plan group 7).
  - **Bootstrap mix-up:** the owner's saved "preview" URL was the `production` branch's (endpoint `ep-muddy-star-za4k6uom`). Two runs created, then re-keyed, the three roles on **`production`**, which contradicts D2. `production` is otherwise empty. The output file was overwritten by the correct preview run, then deleted. **Resolved (owner, 2026-10-12):** the three roles were removed from `production` with `neon roles delete … --branch production`, leaving only `neondb_owner` there; Phase 16 creates them fresh.
  - **Preview:** bootstrapped on `ep-broad-haze-za0j8qbh`, then re-run (re-keyed) after two leaks:
    - the preview `rhm_migrator` URL reached the agent through an IDE selection;
    - the preview `neondb_owner` URL was pasted into `specs/2026-10-10-service-pages/validation.md`. That change was unstaged and never committed; the owner removed it and has reset that password.
    - **Lesson:** copy values with PowerShell (`Copy-EnvValue` / `Set-Clipboard`), never by selecting them in VS Code.
  - **Dev:** bootstrapped with `--dev` on `ep-purple-mountain-zavlw8ji`, and `.env.local` was written from it (`rhm_app` pooled, `rhm_migrator` direct, salt).
  - **Placed:**
    - GitHub environment `neon-preview` → `MIGRATOR_DATABASE_URL`, branch policy `develop`;
    - Vercel **Preview** → `DATABASE_URL`, `RATE_LIMIT_SALT`;
    - `vercel env ls` shows no migrator or bootstrap variable in any environment.
  - **Wrongly placed:** dev values in Vercel *Development* (removed by the owner; confirmed with `vercel env ls`) and a GitHub environment `neon-dev` holding the dev migrator URL (deleted by the owner; confirmed with `gh api …/environments`). Neither is used: dev values live only in `.env.local`.
  - **7.1:** `pnpm db:deploy` applied both migrations to Neon `dev`, and the drift check exits 0. `pnpm test:db` against Neon `dev` (app pooled, migrator and readonly direct): **18/18**. This includes "belongs to no role", which proves `rhm_app` is not in `neon_superuser`.
  - **7.2:** the runtime path against `dev` (Neon driver over the global `WebSocket`, pooled, `PrismaNeon({ connectionString })`) returns `current_user = rhm_app` on Postgres 17.11 and reads `RateLimitHit`. **TLS:**
    - `pg_stat_ssl` reported `ssl = false`, because on Neon it describes the proxy/pooler's internal connection to Postgres, not the client's;
    - proven instead: `pg` with SSL off is **refused** on both the pooled and direct hosts ("connection is insecure (try using `sslmode=require`)"); `pg` with TLS and `rejectUnauthorized: true` connects; the Neon driver has `useSecureWebSocket: true`.

- **2026-10-12** — CI green and close-out.
  - `76a3d82` fixed the cached-install build (see Issues). `7f778e1` (empty) retriggered the preview after the Vercel permission update.
  - `db` was added to the `develop` ruleset's required checks (`ci`, `gitleaks`, `db`), with `gh api`.
  - PR #10: `ci`, `db`, `gitleaks`, `preview-headers` and Vercel all pass. Merged into `develop` with a merge commit. `migrate-preview` on the `develop` push is the post-merge check.

## Deviations

- **The TLS validation check changed** from "`pg_stat_ssl` reports `ssl = true`" to "Neon refuses plaintext; verified TLS succeeds". The original check cannot pass on Neon (see 7.2 above). This is a stronger proof: no plaintext path exists.

- **Limiter split into two modules.** The logic is in `rate-limit-core.ts` (no `server-only`; tests pass in a client and a clock), and `rate-limit.ts` is the server entry point. As a result, plan 1.3's Vitest alias for `server-only` was not needed. D8's contract (`createRateLimiter(db, salt, now)` plus `rateLimit()`) is unchanged.
- **`CREATE SCHEMA IF NOT EXISTS "public"` removed from the generated init migration.** Postgres checks `CREATE` on the database before checking whether the schema exists, so `rhm_migrator` (which by design lacks that right) got `42501 permission denied for database`. The schema always exists, and the bootstrap grants the migrator `USAGE, CREATE` on it. A comment in the migration records this.
- **`pg` pinned to 8.23.0, not 8.23.1:** 8.23.1 was only 12 days old.
- **The ESLint ban allows type-only imports of generated models** in `app/**` and `components/**`, so later phases can type props with `PortfolioItem` without importing the client.
- **`vitest.db.config.mts` is standalone.** `mergeConfig` concatenated the unit config's `include`/`exclude` arrays, so the merged config still excluded `*.db.test.ts`.

## Issues and fixes

- **The `CREATE SCHEMA` permission error** (above). It was found on the first `migrate deploy` against the container, and `_prisma_migrations` recorded the failed `init`. The container was recreated, and the clean run passed.
- **Node module-type warning.** Node reparsed `lib/db/bootstrap.ts` as ESM with a warning. Renamed to `.mts`, rather than setting `"type": "module"` for the whole package.
- **The env test regex** expected the variable name before the message. Zod's `prettifyError` prints the message first, so the regex order was swapped.
- **The Vercel build failed on cached installs** (PR #10, commit `1df4995`).
  - Cause: Vercel restored the previous build cache, pnpm reported "Already up to date" and skipped `postinstall`, so the git-ignored `lib/generated/prisma` was missing and type-checking failed (`TS2307 Cannot find module '@/lib/generated/prisma/client'`). The first preview (`6557259`) had passed only because its cache was cold.
  - Fix: `"build": "prisma generate && next build"`, the setup Prisma recommends for Vercel. `postinstall` stays, for `typecheck` and `dev`.
- **Vercel stopped reporting to GitHub after 2026-10-11.** No commit statuses, GitHub deployments or PR comments appear on PR #10, so `preview-headers` (triggered by `deployment_status`) never ran. Builds are still triggered from Git.
  - Checked: the repository connection in Vercel (connected); the GitHub App's repository access (All repositories, not suspended).
  - The app had a pending permission update (Actions read, Workflows read and write). **The owner approved it on 2026-10-12, and reporting resumed at once:** on `7f778e1` the Vercel status, the PR comment (Ready) and `preview-headers` all pass. The `develop` and `main` rulesets still require a PR and green checks for every actor, Vercel included.
- **Probe objects left in the container.** The "grant too wide" negative test let `rhm_app` actually create `rhm_probe`. It was dropped afterwards, and a check confirmed that `rhm_app` owns 0 objects.
