# Validation — Phase 0 foundation

## Roadmap success check ("Done when", verbatim)

> `pnpm build` passes and an empty page is deployed to a Vercel preview. CI is green on the PR. An automated test checks every required header and the report-only CSP directives.

- [x] `pnpm build` passes
- [x] An empty page is deployed to a Vercel preview (`redhat-media-rlhixds61-e1rhyme.vercel.app`, commit `21209bb`)
- [x] CI is green on the PR (#1: `ci`, `gitleaks`, `preview-headers`, Vercel)
- [x] Automated header + CSP test passes (Vitest 17/17, and `preview-headers` showed all 7 headers on the preview)

## Local commands on a clean clone

- [x] `pnpm install --frozen-lockfile` succeeds and installs the lefthook hooks
- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
- [x] `pnpm format:check` passes
- [x] `pnpm test` passes
- [x] `pnpm build` passes
- [x] `pnpm audit --prod --audit-level high` reports no high or critical findings

## Negative tests (each guard must bite)

Run each on a throwaway branch or as an uncommitted change, then revert.

- [x] **Env:** `VERCEL_ENV=production pnpm build` without `NEXT_PUBLIC_SITE_URL` fails with a clear Zod error
- [x] **Env:** `NEXT_PUBLIC_SITE_URL=not-a-url pnpm build` fails
- [x] **Pre-commit:** staging a file containing a fake secret (e.g. a dummy AWS-format key) is blocked by gitleaks
- [x] **CI:** the same fake secret, pushed with `--no-verify` to a throwaway branch, fails the CI gitleaks step, or is blocked by push protection (record which). **Result: blocked by push protection (GH013); the branch never reached the remote.**
- [x] **Lint:** a component using `dangerouslySetInnerHTML` fails `pnpm lint`
- [x] **Lint:** code calling `prisma.$queryRawUnsafe(...)` and `$executeRawUnsafe(...)` fails `pnpm lint`
- [x] **Branch check:** a PR from any branch other than `develop` into `main` fails `branch-check`, and the `main` ruleset blocks merging it (draft PR #2: `branch-check` failed, merge state `BLOCKED`, closed unmerged)
- [x] **Header test:** removing one header from `lib/security/headers.ts` fails the Vitest suite

## Preview manual check

- [ ] The Vercel preview URL renders the placeholder page
- [ ] DevTools → Network shows every header from spec scope 4 on the document response, including both CSP headers
- [ ] The DevTools console has no errors. Report-only CSP reports are allowed (C5), and each one is noted in `implementation.md`.
- [x] ~~The securityheaders.com grade is recorded~~ **N/A for Phase 0.** Previews sit behind Vercel SSO protection, so securityheaders.com only sees Vercel's login response. The grade is first recorded at Phase 14 (enforced CSP), on an unprotected URL.

## Repository settings

- [x] Secret scanning and push protection are enabled (gh api, 2026-10-09)
- [x] The `main` ruleset requires a PR, the `ci`, `gitleaks` and `branch-check` checks, and blocks force-push and deletion
- [x] The `develop` ruleset requires a PR and the `ci` and `gitleaks` checks, and blocks force-push and deletion
- [x] The Vercel production branch is `main`, and previews build for other branches (owner confirmed 2026-10-09)

## Spec hygiene

- [x] `tech-stack.md` amendments (plan group 1) are in the same PR (#1)
- [x] README §5 matches `tech-stack.md` → *Schema decisions* (D2)
- [ ] Every `plan.md` box is ticked, and `implementation.md` records any deviations
