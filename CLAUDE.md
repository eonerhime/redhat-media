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
| `pnpm test:e2e` | Playwright (layout, contrast, reduced motion). It runs against `pnpm start`, so build first. Use `PW_CHANNEL=msedge` if the bundled Chromium is blocked. |
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
- No custom `webpack` config, because Turbopack is the default bundler.
- TypeScript stays on 6.0.x until `typescript-eslint` supports 7.
