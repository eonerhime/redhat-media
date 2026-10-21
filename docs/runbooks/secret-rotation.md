# Runbook — Secret rotation

Built in Phase 15 (spec D9, `specs/2026-10-16-launch-readiness/spec.md`).

- **When:** **immediately** on any exposure (a leak in a commit, a chat, a screenshot, a screen share or an IDE selection). Otherwise, review at the quarterly access review (Phase 35).
- **Who:** the owner. Every console account involved has 2FA.

## Handle values safely

- Never select a secret in VS Code or any editor. Selected text can reach tools and assistants. Move values with PowerShell instead:

  ```powershell
  # Put a value from a git-ignored env file on the clipboard, without showing it:
  (Get-Content .env.local | Select-String '^RATE_LIMIT_SALT=').Line.Split('=', 2)[1] | Set-Clipboard
  ```

- Set GitHub secrets from stdin, so the value never appears on screen: `gh secret set NAME --env ENV < file`.
- New random values: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))" | Set-Clipboard`.
- After a rotation, clear the clipboard: `Set-Clipboard -Value ' '`.

## Where each secret lives

| Secret | Copies | Rotate with | Breaks in between | Verify |
| --- | --- | --- | --- | --- |
| `rhm_app` password (per branch) | Vercel `DATABASE_URL` (Preview; Production from Phase 16); dev: `.env.local` `DATABASE_URL` | *Database roles* below | Pages that read the portfolio show the unavailable state until Vercel redeploys | `preview-e2e` green; the monitor's `portfolio listing` is `ready` |
| `rhm_migrator` password (per branch) | GitHub Environment `neon-preview` → `MIGRATOR_DATABASE_URL`; production: GitHub Environment `neon-production` → `MIGRATOR_DATABASE_URL` (Phase 16); dev: `.env.local` `MIGRATOR_DATABASE_URL` | *Database roles* below | Only CI migrations, until the secret is updated | The next `migrate-preview` (or `migrate-production`) run is green |
| `rhm_readonly` password (per branch) | Production: GitHub Environment `monitor` → `MONITOR_DATABASE_URL` (Phase 16). Preview and dev: nowhere | *Database roles* below | The monitor's `database reachable` check fails | Actions → monitor → Run workflow is green |
| `neondb_owner` password (per branch) | Nowhere. It is used only in a terminal while `db-bootstrap.mts` runs: for production it is written by `neon connection-string production --role-name neondb_owner` to a git-ignored file, loaded from there, and the file is deleted (Phase 16 spec, D2) | Neon console → project → Branches → *branch* → Roles → `neondb_owner` → Reset password | Nothing | — |
| `RATE_LIMIT_SALT` | Vercel (Preview; Production from Phase 16); `.env.local` | *Vercel variable* below | Rate-limit windows start again from zero (old hashes no longer match) | `preview-e2e` green |
| `VERCEL_DEPLOY_HOOK_URL` (Phase 16) | Vercel → Settings → Git → Deploy Hooks (hook for `main`); GitHub Environment `neon-production` | Create a new hook for `main`, `gh secret set VERCEL_DEPLOY_HOOK_URL --env neon-production`, then delete the old hook | `migrate-production` cannot start the production build | The next `migrate-production` run logs `Deploy hook: PENDING` and a production deployment starts |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Vercel → Settings → Deployment Protection → Protection Bypass for Automation; GitHub repository secret | Regenerate in Vercel, then `gh secret set VERCEL_AUTOMATION_BYPASS_SECRET` | `preview-headers`, `preview-e2e`, `lighthouse` and the monitor fail on previews | Re-run `preview-headers` on an open PR |
| Cloudinary API key and secret | `.env.local` only (`NEXT_PUBLIC_CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), until Phase 28 | Cloudinary console → Settings → API Keys → Generate new key; update `.env.local`; delete the old key | `pnpm media:upload-seed` only | Run it with no changes; it reports nothing to upload |
| Neon API key (CLI profile `e1rhyme`) | The Neon CLI's local config | Neon console → Account settings → API keys → create a new key, then revoke the old one; `neon auth --profile e1rhyme` | Neon CLI commands | `neon projects list --profile e1rhyme` |
| `BETTER_AUTH_SECRET` | *Phase 24 fills this in* | | | |
| `RESEND_API_KEY` (Phase 20) | Vercel **Production** and **Preview**, one **sending-only** key each (Resend → API Keys, named `redhat-media-production` / `redhat-media-preview`). CI and dev: none, so sends are skipped | Resend → API Keys → Create API key (*Sending access*) → paste into that Vercel environment with *Vercel variable* below and redeploy → **then** delete the old key in Resend | Nothing if the redeploy comes before the delete. A deleted key with no redeploy fails every send: the inquiry is still saved, the failure is logged, and the monitor's `inquiry notifications` check reports it after 15 minutes | Production: submit a test inquiry; it arrives and its row gets `emailSentAt`. Preview: a preview submission's row gets `emailSentAt` and `ackSentAt` |
| `TURNSTILE_SECRET_KEY` (Phase 18) | Vercel **Production** only: the real widget's secret, beside its public `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (owner, before Phase 20). Vercel Preview, CI (`ci.yml`) and `.env.example` hold Cloudflare's public test secret, which is not a secret and never rotates (Phase 18 spec, D5) | Cloudflare dashboard → Turnstile → the `redhat-media.vercel.app` widget → Settings → Rotate Secret Key (old and new secrets both verify for two hours; Cloudflare docs, *Rotate secret key*); paste the new value into Vercel Production with *Vercel variable* below, then redeploy production | Until the redeploy, nothing: the old secret still verifies for those two hours. After that with no redeploy, every inquiry is refused (`rejected`, the generic message with the email address) | Submit an inquiry on production and see it in the `Inquiry` table, or, while the form is off there (until Phase 20), check that the production build passed `lib/env.ts` (it refuses test keys) |

## Database roles

**A whole branch** (all three roles, e.g. after a broad leak):

1. Neon console → project → Branches → *branch* → Roles → `neondb_owner` → Reset password. Copy the new **direct** connection string (pooling off).
2. In PowerShell:

   ```powershell
   $env:BOOTSTRAP_DATABASE_URL = Get-Clipboard
   node scripts/db-bootstrap.mts --branch <branch>
   Remove-Item Env:BOOTSTRAP_DATABASE_URL
   Set-Clipboard -Value ' '
   ```

   This re-keys `rhm_app`, `rhm_migrator` and `rhm_readonly`. It writes their URLs and a new `RATE_LIMIT_SALT` to the git-ignored `.env.neon-<branch>.local`, and prints no secret.
3. Update every copy from that file, in this order, so the site is down for the shortest time:
   1. Vercel `DATABASE_URL` and `RATE_LIMIT_SALT` for that environment, then redeploy;
   2. the GitHub `MIGRATOR_DATABASE_URL` for that environment;
   3. `MONITOR_DATABASE_URL` in the `monitor` environment.
4. Verify each one with the table above. Then delete `.env.neon-<branch>.local`, or keep it only if this machine needs it.

**One role** (e.g. only the monitor's credential leaked): Neon console → SQL Editor → choose the branch, then run, pasting a fresh random value from the clipboard:

```sql
ALTER ROLE rhm_readonly WITH PASSWORD '<paste>';
```

Then build the URL in the same shape as before (only the password changes), and update that role's copies.

## Vercel variable (e.g. `RATE_LIMIT_SALT`)

1. Generate a value onto the clipboard (see *Handle values safely*).
2. Vercel → project → Settings → Environment Variables → the variable → Edit → choose the environment → paste → Save.
3. Deployments → the latest deployment for that environment → ⋯ → **Redeploy**. A variable only takes effect on a new deployment.
4. Only if the dev copy should match: replace that line of `.env.local` from the clipboard, never by selecting text:

   ```powershell
   $v = Get-Clipboard
   (Get-Content .env.local) -replace '^RATE_LIMIT_SALT=.*', "RATE_LIMIT_SALT=$v" | Set-Content .env.local
   Remove-Variable v
   ```
5. Clear the clipboard, then verify with the table above.

## Rehearsals

| Date | What | Time taken | Result |
| --- | --- | --- | --- |
| 2026-10-16 | `RATE_LIMIT_SALT` on Vercel Preview (Phase 15, plan 6.2): a new value from a git-ignored file through the clipboard, pasted into Vercel by the owner; the next push redeployed | A few minutes (not timed) | Passed: `preview-e2e` and `lighthouse` green on `1cba4d3`, reading Neon through the rate-limit-free paths with the new salt. The local salt file was deleted. |
