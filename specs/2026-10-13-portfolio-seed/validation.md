# Validation — Phase 9 Portfolio seed: engineering case studies

## Roadmap success check ("Done when", verbatim)

> `pnpm db:seed` loads the approved items (open question 5) with their media. `https:`-only link validation is tested.

- [ ] **Approved items load:** `pnpm db:seed` on the Neon `dev` branch writes the five items in Appendix A, each with its cover `MediaItem`. Prisma Studio shows them (D1, D5, D7)
- [ ] **Media exists:** each cover public ID returns HTTP 200 from `res.cloudinary.com/{cloud}/image/upload/…`, and each renders through `<MediaImage>` (plan 4.3) (D6)
- [ ] **Content approved:** the owner approved Appendix A, the credit line, the featured flags and the screenshots (owner check)
- [ ] **https-only links tested:** `https-url.test.ts` covers every rejection class in D9, each with its message, and `schema.test.ts` shows that a non-`https:` `liveUrl` or `repoUrl` is refused (D2, D3)
- [ ] **Rendered safely:** `external-link.test.tsx` shows `target="_blank"` with `rel="noopener noreferrer"`, and plain text for a non-`https:` link (D4)

## Seed behaviour

- [ ] **Idempotent:** `seed.db.test.ts` shows a second run creates nothing and leaves a row created outside the seed untouched. A second `pnpm db:seed` on `dev` reports 0 created (D7, D9)
- [ ] **Validated before writing:** a unit test shows that invalid content throws before any database call (D3)
- [ ] **Preview seeded:** after the merge, the `develop` push run of `migrate-preview` passes its `pnpm db:seed` step (D8)

## Security

- [ ] **Production refused:** `seed-guard.test.ts` shows the production endpoint and `VERCEL_ENV=production` are refused (D7)
- [ ] **Secrets local only:** `vercel env ls` shows no Cloudinary key or secret, `ci.yml` references neither, and gitleaks is green (C3)
- [ ] **No images committed:** `git diff develop --stat` shows no image files (D6)
- [ ] **Lint guards:** a throwaway `target="_blank"` outside the two allowed files, and a throwaway `cloudinary` import in `lib/`, each fail `pnpm lint` (made as uncommitted edits, then reverted) (D4, D6)
- [x] **Covers cleared:** the owner confirmed the five screenshots may be published as they are, including the owner's own number on the Abara cover (owner check) (D6) — confirmed by the owner, 2026-10-13

## Quality gates

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass locally
- [ ] `pnpm test:e2e --workers=1` passes locally, with the existing specs unchanged (C5)
- [ ] CI is green on the PR (`ci`, `db`, `gitleaks`, `preview-headers`, Vercel)
- [ ] The build route table matches `develop` (C2)

## Spec hygiene

- [ ] The `tech-stack.md`, `roadmap.md` and `CLAUDE.md` amendments are in the same PR
- [ ] Every `plan.md` box is ticked, and `implementation.md` records any deviations
