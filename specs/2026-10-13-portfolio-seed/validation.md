# Validation — Phase 9 Portfolio seed: engineering case studies

## Roadmap success check ("Done when", verbatim)

> `pnpm db:seed` loads the approved items (open question 5) with their media. `https:`-only link validation is tested.

- [x] **Approved items load:** `pnpm db:seed` on the Neon `dev` branch writes the five items in Appendix A, each with its cover `MediaItem`. Prisma Studio shows them (D1, D5, D7) — dev branch: 5 created, then 0 created on re-run; rows checked by query (2026-10-13)
- [x] **Media exists:** each cover public ID returns HTTP 200 from `res.cloudinary.com/{cloud}/image/upload/…`, and each renders through `<MediaImage>` (plan 4.3) (D6) — all five return HTTP 200; rendered with blur on `/dev/media` (plan 4.3)
- [x] **Content approved:** the owner approved Appendix A, the credit line, the featured flags and the screenshots (owner check) — owner, 2026-10-13: Appendix A approved; credit `Design & Engineering: Emo Onerhime`; featured SportsPred, toutMessages, AfroJamz; screenshots as they are
- [x] **https-only links tested:** `https-url.test.ts` covers every rejection class in D9, each with its message, and `schema.test.ts` shows that a non-`https:` `liveUrl` or `repoUrl` is refused (D2, D3)
- [x] **Rendered safely:** `external-link.test.ts` shows `target="_blank"` with `rel="noopener noreferrer"`, and plain text for a non-`https:` link (D4)

## Seed behaviour

- [x] **Idempotent:** `seed.db.test.ts` shows a second run creates nothing and leaves a row created outside the seed untouched. A second `pnpm db:seed` on `dev` reports 0 created (D7, D9)
- [x] **Validated before writing:** a unit test shows that invalid content throws before any database call (D3) — `schema.test.ts` (parse throws) and `seed.db.test.ts` (row count unchanged)
- [x] **Preview seeded:** after the merge, the `develop` push run of `migrate-preview` passes its `pnpm db:seed` step (D8) — run 38474994416 (`develop` push of `5bb3cee`), step "Seed the Neon preview branch" passed

## Security

- [x] **Production refused:** `seed-guard.test.ts` shows the production endpoint and `VERCEL_ENV=production` are refused (D7) — also refused from the CLI with both inputs
- [x] **Secrets local only:** `vercel env ls` shows no Cloudinary key or secret, `ci.yml` references neither, and gitleaks is green (C3) — `vercel env ls` shows the cloud name only; gitleaks green on PR #12
- [x] **No images committed:** `git diff develop --stat` shows no image files (D6)
- [x] **Lint guards:** a throwaway `target="_blank"` outside the two allowed files, and a throwaway `cloudinary` import in `lib/`, each fail `pnpm lint` (made as uncommitted edits, then reverted) (D4, D6)
- [x] **Covers cleared:** the owner confirmed the five screenshots may be published as they are, including the owner's own number on the Abara cover (owner check) (D6) — confirmed by the owner, 2026-10-13

## Quality gates

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and `pnpm build` pass locally — unit 679/679
- [x] `pnpm test:e2e --workers=1` passes locally, with the existing specs unchanged (C5) — 198/198
- [x] CI is green on the PR (`ci`, `db`, `gitleaks`, `preview-headers`, Vercel) — PR #12, run 38473954183 (`ci`, `db` with both seed runs, `gitleaks`), `preview-headers`, Vercel Ready
- [x] The build route table matches `develop` (C2) — same routes; `/dev/media` is now static (1w/30d)

## Spec hygiene

- [x] The `tech-stack.md`, `roadmap.md` and `CLAUDE.md` amendments are in the same PR
- [x] Every `plan.md` box is ticked, and `implementation.md` records any deviations
