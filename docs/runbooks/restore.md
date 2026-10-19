# Runbook — Restoring the production database

Built in Phase 16 (spec D10, `specs/2026-10-16-release/spec.md`). Neon **Free** keeps a **6-hour** point-in-time history, capped at 1 GB of changes, plus one manual snapshot ([release.md](release.md)). Past 6 hours, only the snapshot is left. The CLI commands use `--project-id soft-star-93705508 --profile e1rhyme`, shortened to `…` below. In Git Bash, prefix `MSYS_NO_PATHCONV=1`.

## Decide

1. **When did it go wrong?** Pick a timestamp (UTC, ISO 8601) just *before* the bad change: a migration's start time in the `migrate-production` log, or the time of the bad write.
2. **Is it inside the window?** Older than 6 hours: restore the snapshot instead (console → Backup & Restore).
3. **What is lost?** Every write after the timestamp. Before Milestone 2 the only writes are rate-limit rows and the seed, so nothing of value. From Phase 18, inquiries after the timestamp are lost: export them first from the preserved branch (step 3 below).
4. If the new code needs the new schema, **roll the site back first** ([release.md](release.md)).

## Check first, on a scratch branch (no effect on the live site)

```bash
neon branches create … --name restore-check --parent 2026-10-16T21:00:00Z
neon connection-string restore-check … --role-name rhm_readonly > .env.restore-check.local
```

- A bare timestamp as `--parent` branches from the **default branch** (`production`). The CLI rejects `--parent production@<timestamp>` ("Branch … not found").
- To branch another branch at a timestamp, use the API: `neon api /projects/soft-star-93705508/branches --profile e1rhyme -X POST -d '{"branch":{"name":"…","parent_id":"br-…","parent_timestamp":"2026-10-16T21:00:00Z"},"endpoints":[{"type":"read_write"}]}'`.
- A timestamp older than 6 hours is refused: `timestamp is before retention window … 6h0m0s`.

Query it as `rhm_readonly` from that git-ignored file (never print the URL), and confirm it holds what you expect: the tables, migration 3's `creditUrl` column on `PortfolioItem` (`rhm_readonly` cannot read `_prisma_migrations`), and the item and media counts. Then `neon branches delete restore-check …` and remove the file.

## Restore in place

```bash
neon branches restore production ^self@2026-10-16T21:00:00Z … --preserve-under-name production-before-restore
```

- The branch keeps its endpoint (`ep-muddy-star-za4k6uom`), so **no connection string changes** on Vercel or GitHub, and the roles and passwords stay as they were at the timestamp.
- Connections drop for a moment while the compute restarts.
- `production-before-restore` holds the state just before the restore. Keep it until you are sure, then delete it (Free allows 10 branches).

## Verify

1. Actions → monitor → Run workflow (`main`): green, with `portfolio listing` ready.
2. Actions → preview-headers → Run workflow (`main`): `production-checks` green.
3. Record the incident, the timestamp, and how long each step took, in an issue or the phase log.

## Rehearsals

| Date | What | Result | Time |
| --- | --- | --- | --- |
| 2026-10-19 | `restore-rehearsal`: `production` at 05:36:00Z, which resolved to LSN `0/1D89440` (the last write, 05:09:09Z) | As `rhm_readonly`: 4 tables, `creditUrl` present, 9 items, 9 media | Create 2 s, connection string 2 s, verify 6 s; **~29 s** from decision to verified |
| 2026-10-19 | Point-in-time proof (the first migration was outside the 6-hour window): scratch child `restore-scratch`, `CREATE TABLE rehearsal_marker` at 07:20:42.756Z, then `restore-before-marker` from the scratch branch at 07:20:00Z via the API (LSN `0/1D9F9D0`) | Scratch head: 5 tables, marker present. Before-marker branch: 4 tables, **marker absent**, 9 items, 9 media | Create 4 s, verify 6 s |
| 2026-10-19 | A branch at 2026-10-18T23:00Z (outside the window) | Refused: `timestamp is before retention window … 6h0m0s` | — |

All rehearsal branches were deleted the same morning; only `production`, `dev` and `preview` remain, and no `.env.restore*` file is left.

Quarterly drill from Phase 35.
