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
