# Implementation log — Phase 9 Portfolio seed: engineering case studies

## Log

- **2026-10-13** — Branch `feature/phase-09-portfolio-seed` from `develop` at `0ab945d`.
  - The owner confirmed the phase, approved all five products, chose the `emo-onerhime` screenshots, deferred media case studies, and asked for the real logo instead of the wordmark (separate PR).
  - Sources read: `emo-onerhime/src/data/projects.ts` and the five READMEs. A Haiku subagent extracted the README facts, and sampled lines were checked against the files. Two discrepancies were found: AfroJamz is React and Vite (not Next.js as the portfolio says), and its "100+ tests" claim conflicts with its own table (76), so it is left out.
  - `gh repo view`: only `hireflow-track` is public. The `toutMessage` repository is now `toutMessages`. All five live URLs return HTTP 200.
  - Screenshots are 1200×750. The Abara cover shows a phone number and an account owner name; this is raised as owner question C.
  - `npm view cloudinary`: 2.11.0 is `latest` (2026-08-27). Docs read through ctx7: Cloudinary upload parameters and *Folder modes in integrations*.
  - Spec drafted, waiting for owner approval.

- **2026-10-13** — Owner approved the spec and Appendix A. Featured: SportsPred, toutMessages, AfroJamz. Screenshots used as they are; the Abara cover shows the owner's own number, which the owner allows. The credit line wording is still open (question A). The owner stored the Cloudinary API key and secret in `.env.local`; a script confirmed both are set and well-formed without printing them.
  - Constitution amendments (plan 0.1–0.3) committed with the build: `tech-stack.md` (the `cloudinary` pin, local-only key and secret, seeded preview, the external-links row), `roadmap.md` open questions 1, 4 and 5, and `CLAUDE.md` commands.
  - `lib/validation/https-url.ts`: the first test run showed that `new URL()` accepts `https://exa_mple..com/`, so a DNS-label check on every host label was added (spec D2 amended). `lib/portfolio/schema.ts`, `prisma/seed-data/portfolio.ts` (Appendix A verbatim), `lib/db/seed-guard.ts`, `lib/db/seed.ts`, `prisma/seed.mts`. Unit suite: 679 passed (599 + 80).
  - **Deviations from the draft:** `<ExternalLink>` lives in `components/shared/` (there is no `components/ui/`), and its test is `external-link.test.ts`, calling the component as a function, because the unit suite collects `*.test.ts` only. `testPrisma()` takes an optional role so the seed test runs as `rhm_migrator`. The CI `db` job also runs `pnpm db:seed` twice before `pnpm test:db`. The spec was updated to match.
  - **Plan 2.3:** Node 24 runs the generated client directly (its imports already carry `.ts` extensions). Node warns that `package.json` has no `"type"`, so both commands pass `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON`. Every module on the seed's import chain uses relative `.ts` imports, as `scripts/check-preview-headers.mts` does.
  - Lint guards: throwaway `lib/zz-probe/sdk.ts` (imports `cloudinary`) and `components/zz-probe.tsx` (`target="_blank"`) each failed with the custom message. An import of `@/lib/media/cloudinary` was not flagged, and `external-link.tsx`, `video-facade.tsx` and the upload script were clean. The probe files were deleted.
  - `cloudinary@2.11.0` exact devDependency: `pnpm audit --prod` reports no known vulnerabilities. The pnpm peer warning is the existing ESLint 10 one, unrelated.
  - Local `db` job replica (Docker `postgres:17` on port 55432): bootstrap, `db:deploy`, `db:seed` twice (5 created, then 0 created and 5 updated), `test:db` 23 passed. The CLI refused a production-endpoint URL and `VERCEL_ENV=production`. The container was removed.
  - **Plan 3.5:** `pnpm media:upload-seed` uploaded all five covers (1200×750 webp). A second run reported all five as `exists`. Each `f_auto,q_auto` URL returns HTTP 200.
  - **Plan 4.1:** `pnpm db:seed` on the Neon `dev` branch (target host checked first: `ep-purple-mountain-zavlw8ji`) gave 5 created, then 0 created and 5 updated. A query shows the five rows in order, with featured SportsPred, AfroJamz and toutMessages, a repo link on HireFlow only, and the five cover IDs.
  - **Plan 4.3:** temporarily added the five covers to `/dev/media` and ran `next dev`. Each `<img>` has `f_auto`, a `srcset`, a base64 blur placeholder and `loading="lazy"`. The page was restored.
  - `vercel env ls` shows only `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (Preview and Production). `ci.yml` has no Cloudinary key or secret, and the diff contains no images.
  - Build route table: the same routes as `develop` (`/dev/media` is now static, 1w/30d, because the sample photo exists).
  - `pnpm test:e2e --workers=1`: 198 passed, with the existing specs unchanged.
  - PR #12: CI green (run 38473954183; the `db` job seeded 5 created, then 0 created, and `test:db` passed 23/23). `preview-headers` passed, and Vercel is Ready.
  - Owner chose the credit line `Design & Engineering: Emo Onerhime` (question A). Updated the content file and the spec, and re-seeded `dev` (0 created, 5 updated).
  - The owner placed the logo files in `public/` (`RedHat.Media 2 Lines.jpg`, `RedHat.Media 2L Gmail Profile - png.png`). They are not committed in this phase; they belong to the logo amendment PR (D11).
