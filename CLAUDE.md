# RedHat Media Platform

Next.js 16 rebuild of `redhat-media.vercel.app`, built with Spec-Driven Development.

## Specs are the contract

- `README.md` and `specs/` define what gets built. Read `specs/mission.md`, `specs/tech-stack.md` and `specs/roadmap.md` before changing anything.
- Code that departs from a spec needs the spec updated first, in the same PR.
- Each roadmap phase has a folder `specs/YYYY-MM-DD-name/` containing `spec.md`, `plan.md` (tick tasks as they land), `validation.md` (all boxes checked before merge) and `implementation.md` (the build log).
- Only libraries listed in `specs/tech-stack.md` may be added.

## Branches

- Work happens on `feature/phase-NN-name`, branched from `develop`. PRs go into `develop` and need a green CI.
- Releases go `develop` → `main` (production). `main` only accepts PRs from `develop`.
- Never push or commit to `main` directly.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Local dev server (Turbopack) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm format` / `pnpm format:check` | Prettier |
| `pnpm test` | Vitest |
| `pnpm test:db` | Database tests (`*.db.test.ts`) against a real Postgres. Needs the `TEST_*_DATABASE_URL` vars (see `lib/db/test-client.ts`). |
| `pnpm db:migrate` | `prisma migrate dev`. **Neon `dev` branch only.** Every other branch is migrated by CI. |
| `pnpm db:seed` | Upserts the portfolio seed (`prisma/seed-data/`) into the branch in `MIGRATOR_DATABASE_URL`. Run locally on `dev` only; CI seeds `preview`. It refuses production. |
| `pnpm media:upload-seed` | Uploads the seed cover screenshots to Cloudinary (default source `../emo-onerhime/public/projects`). Needs `NEXT_PUBLIC_CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in `.env.local`, which live nowhere else. |
| `pnpm db:studio` | Prisma Studio on the branch in `MIGRATOR_DATABASE_URL` |
| `pnpm test:e2e` | Playwright (layout, contrast, reduced motion). It runs against `pnpm start`, so build first. Use `PW_CHANNEL=msedge` if the bundled Chromium is blocked. `PW_BASE_URL=<url>` targets a deployed site instead (no local server; sends the Vercel bypass header from `VERCEL_AUTOMATION_BYPASS_SECRET`). |
| `pnpm build` | Production build. It also validates env vars (`lib/env.ts`). |

## Setup

1. Node 24 and pnpm (version pinned in `packageManager`; enable it with `corepack enable`).
2. Install **gitleaks**, which the pre-commit hook needs (it fails closed without it). On Windows: `winget install Gitleaks.Gitleaks`. On macOS: `brew install gitleaks`.
3. `pnpm install`. This also installs the lefthook git hooks.
4. Copy `.env.example` to `.env.local` if needed.

## Rules that are easy to break

- Never put a secret in a `NEXT_PUBLIC_*` variable.
- `dangerouslySetInnerHTML`, `$queryRawUnsafe` and `$executeRawUnsafe` are banned by lint.
- Security headers and the CSP live in `lib/security/headers.ts`. Change them only together with their test and `specs/tech-stack.md`.
- Images go through `<MediaImage>` (Cloudinary public IDs under `rhm/…`; the one exception is the header logo, `public/brand/logo.png`) and videos through `<VideoEmbed>` (`components/media/`). Lint blocks direct `next-cloudinary` imports and `<iframe>` elsewhere.
- No custom `webpack` config, because Turbopack is the default bundler.
- TypeScript stays on 6.0.x until `typescript-eslint` supports 7.
