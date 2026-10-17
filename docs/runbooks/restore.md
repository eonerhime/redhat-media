# Runbook — Restoring the production database

Built in Phase 16 (spec D10, `specs/2026-10-16-release/spec.md`). Neon **Free** keeps a **6-hour** point-in-time history, capped at 1 GB of changes, plus one manual snapshot ([release.md](release.md)). Past 6 hours, only the snapshot is left. The CLI commands use `--project-id soft-star-93705508 --profile e1rhyme`, shortened to `…` below. In Git Bash, prefix `MSYS_NO_PATHCONV=1`.

## Decide

1. **When did it go wrong?** Pick a timestamp (UTC, ISO 8601) just *before* the bad change: a migration's start time in the `migrate-production` log, or the time of the bad write.
2. **Is it inside the window?** Older than 6 hours: restore the snapshot instead (console → Backup & Restore).
3. **What is lost?** Every write after the timestamp. Before Milestone 2 the only writes are rate-limit rows and the seed, so nothing of value. From Phase 18, inquiries after the timestamp are lost: export them first from the preserved branch (step 3 below).
4. If the new code needs the new schema, **roll the site back first** ([release.md](release.md)).

## Check first, on a scratch branch (no effect on the live site)

```bash
neon branches create … --name restore-check --parent production@2026-10-16T21:00:00Z
neon connection-string restore-check … --role-name rhm_readonly > .env.restore-check.local
```

Query it as `rhm_readonly` from that git-ignored file (never print the URL), and confirm it holds what you expect. Then `neon branches delete restore-check …` and remove the file.

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
| _Phase 16_ | _Branches of `production` at a point after the seed, and before the first migration_ | _filled in after the rehearsal_ | |

Quarterly drill from Phase 35.
