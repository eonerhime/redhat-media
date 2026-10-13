# Plan — Phase 9 Portfolio seed: engineering case studies

Scope, decisions (D1–D11) and constraints (C1–C5) are in [`spec.md`](spec.md). Tick each box as it lands, and log progress in [`implementation.md`](implementation.md).

## 0. Constitution first

- [x] 0.1 `specs/tech-stack.md`: the `cloudinary@2.11.0` devDependency pin, the local-only key and secret, the seeded `preview` branch, and the external-links security row.
- [x] 0.2 `specs/roadmap.md`: open questions 1 (logo), 4 (media assets) and 5 (case studies) updated with the owner's answers.
- [x] 0.3 `CLAUDE.md`: the `pnpm db:seed` and `pnpm media:upload-seed` commands.

## 1. Link rule and content schema

- [x] 1.1 `lib/validation/https-url.ts` and its table test (D2, D9).
- [x] 1.2 `lib/portfolio/schema.ts` and its tests (D3, D9).
- [x] 1.3 `components/shared/external-link.tsx` and `external-link.test.ts` (D4, D9).
- [x] 1.4 `eslint.config.mjs`: `target="_blank"` allowed only in `external-link.tsx` and `video-facade.tsx`, and `cloudinary` imports allowed only in `scripts/` (D4, D6). Prove both with throwaway files, then delete them.

## 2. Seed

- [x] 2.1 `prisma/seed-data/portfolio.ts`: the five items from Appendix A, as approved (D1, D5).
- [x] 2.2 `lib/db/seed-guard.ts` and its test (D7, D9).
- [x] 2.3 `lib/db/seed.ts` (`runSeed`) and `prisma/seed.mts` (CLI over `@prisma/adapter-pg`). Confirm that Node 24's type stripping can import the generated `prisma-client` output, which is TypeScript. If it cannot, check the generator's `importFileExtension` and `moduleFormat` options (through ctx7) before choosing anything else, because no new runner such as `tsx` may be added (C1) (D7).
- [x] 2.4 `lib/db/seed.db.test.ts` (D9).

## 3. Cover upload

- [x] 3.1 Install `cloudinary@2.11.0` as an exact devDependency. Check `pnpm audit --prod` and any build scripts it asks for (D6).
- [x] 3.2 `scripts/upload-seed-media.mts` and the `media:upload-seed` script in `package.json` (D6).
- [x] 3.3 `.env.example`: the key and secret, with a comment saying they are local-only until Phase 28.
- [x] 3.4 Owner: API key in `.env.local`; screenshots settled (question C) (*Owner setup* 2–3).
- [x] 3.5 Run `pnpm media:upload-seed`. All five covers are `uploaded`, then a second run reports all five as `exists`. Record the dimensions in implementation.md.

## 4. Load and CI

- [x] 4.1 `pnpm db:seed` on the Neon `dev` branch, twice. The second run reports 0 created. Check the rows in Prisma Studio.
- [x] 4.2 `ci.yml`: `pnpm db:seed` after `pnpm db:deploy` in `migrate-preview` (D8).
- [x] 4.3 Confirm each cover renders through `<MediaImage>`: add the five covers to `/dev/media` as a temporary check, view it locally, then remove them. Record the result.

## 5. Close

- [x] 5.1 `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, `pnpm test:e2e --workers=1`. — all pass; unit 679/679, e2e 198/198.
- [x] 5.2 `pnpm test:db` locally against the dev branch URLs, if available, otherwise in CI. — run against a local `postgres:17` container that replicates the CI `db` job: 23 passed.
- [ ] 5.3 PR into `develop`, CI green, every `validation.md` box ticked.
- [ ] 5.4 After the merge, the `develop` push runs `migrate-preview`, which seeds `preview`. Tick "Preview seeded" on the next phase's first commit if it lands after the merge (as with Phase 7).
