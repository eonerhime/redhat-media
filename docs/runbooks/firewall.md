# Runbook — Vercel Firewall and Attack Challenge Mode

Built in Phase 15 (spec D8, `specs/2026-10-16-launch-readiness/spec.md`). The project is on Vercel **Hobby**:

- up to **3 custom rules**, of which **1** may rate-limit (keyed by IP or JA4, a fixed window from 10 seconds to 10 minutes);
- the **Bot Protection** managed ruleset is available on every plan.

The dashboard holds the live rules. This file records them exactly, so they can be checked or rebuilt.

## Rules in force

All are set in Vercel → project `redhat-media` → **Firewall**.

| # | Rule | Setting | Why |
| --- | --- | --- | --- |
| 1 | **Bot Protection** (managed ruleset) | **Log** | Records automated traffic without blocking it. Challenge mode might block link-preview fetchers (WhatsApp, LinkedIn) that are not verified bots, so Phase 16 decides on Challenge after the share-card checks pass with it on. |
| 2 | Custom rule **"Deny scanner paths"** | If *Request Path* matches the regex `^/(\.env\|\.git\|wp-\|xmlrpc\.php)\|\.php$`, then **Deny** | The site serves none of these paths. Bots probe them on every site. |
| 3 | Custom rule **"Rate limit per IP"** | If *Request Path* starts with `/` **and** *Domain Environment* equals **Production**, then **Rate Limit**: fixed window **60 s**, **1,200** requests, key **IP**, action **Deny** (429) | A fast scripted session (9 pages with prefetching) made 124 requests in 19 seconds; this is 10× that. It is generous because Nigerian mobile carriers share public IPs widely (carrier-grade NAT). It covers production only: on previews, which sit behind deployment protection anyway, it blocked CI's e2e runs with 403. |

The rule 2 regex as typed into the dashboard (the table escapes its `|` characters):

```text
^/(\.env|\.git|wp-|xmlrpc\.php)|\.php$
```

One custom rule stays free for a later phase.

Check after any change:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://redhat-media.vercel.app/.env   # 403
curl -s -o /dev/null -w "%{http_code}\n" https://redhat-media.vercel.app/       # 200
```

If real visitors report "429 Too Many Requests", raise the limit in rule 3 and record the new value here.

**Vercel's own DDoS mitigation acts first on fast bursts.** On 2026-10-16, a test of 1,300 requests from one IP, 25 at a time, got 200 for the first 58. Everything after that, within about 5 seconds, got 403 with `X-Vercel-Mitigated: challenge` (the "Vercel Security Checkpoint"), before rule 3 could reach its count. A browser passes that checkpoint by itself; `curl` from the same IP was still challenged 5 minutes later. Rule 3 is therefore the backstop for slower, sustained floods. When testing, look at the `X-Vercel-Mitigated` header: `deny` means a rule blocked the request, `challenge` means the checkpoint.

## Attack Challenge Mode

It makes every browser pass a challenge before it reaches the site. Verified bots (search engines) are let through.

**Turn it on when:**

- the Firewall's traffic view shows a sudden spike, mostly from a few IPs or one country, that the rules above do not stop;
- the monitor reports `query volume` or `connection saturation` failures while traffic is high ([monitoring.md](monitoring.md));
- the site slows down or the monitor fails under load.

**How:**

1. Vercel → project `redhat-media` → **Firewall** → **Rules** → **Danger Zone** → **Attack Mode** → **Enable Attack Mode**. The dashboard calls it "Attack Mode"; it is off normally (owner, 2026-10-16).
2. Or, from a terminal linked to the project: `vercel firewall attack-mode enable --duration 1h`, which turns itself off after 1 hour (`6h` and `24h` are also allowed).

**While it is on:** visitors see a short browser check before each new session. Link previews in WhatsApp and LinkedIn may fail. Uptime checks from the monitor may fail too; that is expected.

**Turn it off** in the same place once the traffic view is back to normal for at least 30 minutes, or let the duration run out.

**Afterwards,** add an entry below: the date, how long it was on, what was seen (peak requests, countries, paths), and any rule changed as a result.

## Incident log

| Date | Duration | What happened | Change made |
| --- | --- | --- | --- |
| — | — | — | — |
