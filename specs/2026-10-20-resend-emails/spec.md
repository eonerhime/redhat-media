# Phase 20 — Resend emails

- **Roadmap:** [`../roadmap.md`](../roadmap.md), Milestone 2, Phase 20
- **Branch:** `feature/phase-20-resend-emails` (from `develop` at `a360ce3`)
- **Started:** 2026-10-20
- **Status:** owner-approved 2026-10-20 (Appendices A–C as drafted)

## What and why

Phases 18 and 19 save a scoped inquiry, but nobody is told when one arrives, so the form is off in production (Phase 18 spec, D10). This phase sends two emails through Resend, built with React Email:
- a **team notification** with the whole inquiry;
- a **client acknowledgment** confirming the inquiry was received.

The team notification is what lets the form go live in production. The mission needs that: *zero lost inquiries* means every saved inquiry reaches a person.

**There is no custom domain yet** (open question 2; owner, 2026-10-20). Resend cannot verify `vercel.app`. An account without a verified domain sends only from `onboarding@resend.dev`, and only to the address the Resend account was registered with. So this phase **stages** the emails (owner answer A):
- **Now:** the team notification goes from the shared sender to `redhatmediang@gmail.com`, the account's own address.
- **Later:** the client acknowledgment is built and tested, but stays behind its own switch, off in production. A **domain amendment** turns it on once a domain is verified with SPF, DKIM and DMARC.

## Constitution sections this phase relies on

- `mission.md` → *Supporting metrics* (zero lost inquiries); *Guiding principles* 4 (honest claims), 9 (secure from the first commit).
- `tech-stack.md`:
  - the Email row (Resend + React Email; a verified domain);
  - *Architectural rules* 4 (save first, then email) and 10 (accessibility);
  - *Security baseline*: application (email templates escape user input and never put it in headers or the subject line), least-privilege roles, monitoring, the secret rotation runbook and personal data (NDPA 2023);
  - *Environment variables* (`RESEND_API_KEY`, `INQUIRY_NOTIFICATION_EMAIL`, `EMAIL_FROM`).
- `roadmap.md` → Phase 20; Phase 23 (Milestone 2 release); Phase 32 (inbox); open questions 2 (custom domain), 3 (notification inbox), 9 (Neon stays on Free because every inquiry is emailed) and 10 (data protection).
- Phase 17 spec (D4: `rhm_readonly` cannot read `Inquiry`). Phase 18 spec (D3 core and deps, D9 success panel, D10 switch, D11 privacy notice). Phase 19 spec (scope fields; a project type shown outside its group carries its service name).

## Scope

1. **Constitution first** (below).
2. **Email layer** (D7, D8): the Resend client, two React Email templates, and plain-text versions.
3. **Sending** (D3, D6): after the response, with `emailSentAt` / `ackSentAt` recorded and failures logged.
4. **Environment** (D2, D9): new variables and their rules in `lib/env.ts`.
5. **Monitor** (D10): an hourly check for inquiries whose team notification never went out, plus a column-level grant.
6. **Copy** (D13, Appendices A–C): the success panel, the privacy notice's processors, and the email copy.
7. **Tests** (D14) and the **production go-live** at release (D11).

## Constitution changes (in this PR, before the code)

- **`roadmap.md`:**
  - **Phase 20 row:** the staged sending (D1). "Done when" becomes: *"The team notification arrives in the team inbox and passes DMARC, and the client acknowledgment is accepted for Resend's test inbox. With Resend unreachable, the inquiry is still saved and the failure is logged. The acknowledgment reaching clients and DMARC on RHM's own domain move to the domain amendment (open question 2)."*
  - **Open question 2:** the domain amendment now carries verifying the domain (SPF, DKIM, DMARC), changing `EMAIL_FROM` and turning the acknowledgment on.
  - **Open question 3:** answered (owner answer B).
- **`tech-stack.md`:**
  - **Email row:** Resend pinned at 6.32.1 and `@react-email/components` 1.0.12 (owner answer H). Sending is staged until a domain is verified (D1).
  - ***Security baseline*:**
    - least-privilege row: `rhm_readonly` may read only `Inquiry."createdAt"` and `"emailSentAt"` (D10);
    - monitoring row: the unsent-notification check (D10);
    - abuse row: the per-recipient acknowledgment limit (D6);
    - rotation row: Resend is filled in.
  - ***Environment variables*:** `INQUIRY_ACK_ENABLED` and `EMAIL_REDIRECT_TO`, plus the rules in D9.
- **`README.md`:** no change. The `Inquiry` model already has `emailSentAt` and `ackSentAt`.
- **`mission.md`:** no change.

## Out of scope

- Buying or verifying a domain, DNS, and DMARC on RHM's own domain. All of these belong to the **domain amendment**.
- Sending the acknowledgment in production (same amendment).
- Resending a failed email from a tool or the CMS. The idempotency keys (D3) keep a later resend safe. The inbox and its "unsent" view arrive in Phase 32.
- Resend webhooks (bounces, complaints, delivery events).
- Editing email copy from the CMS. The copy lives in the templates. Only the labels the emails share with the site (services, project types, budget, timeline) come from `block()`.
- Creating the production Turnstile widget and its keys (owner action, needed before release).

## Decisions

| # | Decision | Why | Source |
| --- | --- | --- | --- |
| D1 | **Staged sending** (owner answer A).<br>• **Team notification:** live in production from this phase. It goes from `RedHat Media <onboarding@resend.dev>` to the team inbox, which must be the Resend account's own address.<br>• **Client acknowledgment:** fully built, behind `INQUIRY_ACK_ENABLED`. On in Vercel Preview, **unset in production** until the domain amendment. | The team notification is the one that prevents lost leads, and it can work today. The acknowledgment cannot reach a client's address without a verified domain, so turning it on in production would only produce failures. | Open question 2; owner answer A |
| D2 | **Team inbox: `redhatmediang@gmail.com`** (owner answer B). `INQUIRY_NOTIFICATION_EMAIL` accepts a comma-separated list of up to 5 addresses, so more can be added after the domain amendment. Until then, only the Resend account's address receives anything. | One inbox the team already reads. A list costs nothing and avoids a code change later. | Open question 3; owner answer B |
| D3 | **Send after the response** (owner answer D).<br>• **What the core changes:** `submitInquiryCore` keeps its Phase 18 order and results. `save` now returns the new row's `id`.<br>• **When sending happens:** on `success`, the action schedules `notifyInquiry(id, data)` with `after()` from `next/server`, so the visitor never waits on Resend.<br>• **The core:** `lib/inquiry/notify-core.ts` is pure, with deps `send`, `markSent`, `now`, `logError`, `ackEnabled`. It sends the team notification, then the acknowledgment, and **each runs whether the other succeeded or not**.<br>• **Recording a send:** a successful send sets `emailSentAt` / `ackSentAt` with an `updateMany` guarded by `IS NULL`, as `rhm_app`.<br>• **Idempotency:** each send carries a key, `inquiry-team/<id>` and `inquiry-ack/<id>` (Resend keeps them for 24 h).<br>• **Failures:** one attempt, no retry. A failure is logged as `[email] team notification failed` or `[email] acknowledgment failed`, with the inquiry id and the error's name only. No personal data goes in logs. | Save first, then email (rule 4). The visitor's success never depends on Resend. Keys make any later resend safe. Logs on Hobby are public to the team and short-lived, so they carry no personal data. | Rule 4; owner answer D; mission (zero lost inquiries) |
| D4 | **Team notification** (Appendix A).<br>• **Subject:** fixed text plus the received time in Lagos, e.g. "New inquiry · Tue 20 Oct 2026, 14:05 WAT". The time stops Gmail threading every notification into one conversation, and it is not user input.<br>• **Body:** every field. Services are shown with their project types as "Service: Type" (`projectTypeLabel`). Budget and timeline use the stepper's labels. Notes keep their line breaks.<br>• **Links:** a `mailto:` link for the client's validated email and a `tel:` link for the E.164 phone, both URL-encoded.<br>• **No `Reply-To`:** it would put user input in a header. | Everything sales needs, without opening a database. User input stays in the body, where React escapes it. | *Security baseline* (application); Phase 19 (project type labels) |
| D5 | **Client acknowledgment** (Appendix B; owner answer C).<br>• **Content:** thanks, the reply time already promised on the site, and only the **fixed choices** the visitor made (services as "Service: Type", budget, timeline). It carries **no free text**: not their name, company or notes.<br>• **Subject:** fixed.<br>• **`Reply-To`:** the site email from `lib/site.ts`, which is fixed and not user input. | Anyone can type someone else's address into the form. With no free text, an attacker can't put their own words into an email that RHM sends. | Owner answer C; *Security baseline* (application) |
| D6 | **Acknowledgment limit per recipient.**<br>• **The limit:** at most **3 per 24 hours** to one address. It uses `rateLimit("inquiry.ack", email, …)`, with the key hashed like every rate-limit key, and is checked inside the request before the response.<br>• **Over the limit:** the acknowledgment is skipped silently. The inquiry is still saved and the team is still notified.<br>• **What the visitor is told:** the `success` result gains `acknowledgment: boolean`, true only when the switch is on and the address is under the limit. The success panel mentions a confirmation email only when it is true (D13). | The per-IP limits (Phase 18 D6) and Turnstile already slow abuse. A per-recipient cap stops the form being used to fill one stranger's inbox from many IPs. Telling the visitor only what will be attempted keeps the panel honest. | *Security baseline* (abuse); mission principle 4 |
| D7 | **Templates:** `@react-email/components` 1.0.12, which bundles `@react-email/render`.<br>• **Files:** `lib/email/templates/team-notification.tsx` and `client-ack.tsx`, as pure components that take already-resolved labels.<br>• **Rendering:** `lib/email/render.ts` renders each to HTML and to **plain text**, and both are sent.<br>• **Layout:** dark text on white, system fonts, one column, no images or remote assets, and links in the brand's darker red.<br>• **Escaping:** text is escaped by React and only `mailto:` / `tel:` / fixed site URLs are links. `dangerouslySetInnerHTML` is still banned. | Plain text helps deliverability and accessibility. No remote assets means nothing for a mail client to block and no tracking. | Email row; rule 10; *Security baseline* (application) |
| D8 | **Resend client:** `lib/email/send.ts` (`server-only`), resend **6.32.1**. `sendEmail({ to, subject, html, text, replyTo?, idempotencyKey })` resolves `{ status: "sent", id }`, `{ status: "failed", error }` (the error's name only) or `{ status: "skipped" }`, and never throws.<br>• **No key:** with no `RESEND_API_KEY` (CI, local), it resolves `skipped`, and the notify core logs `[email] skipped …`. Nothing is marked sent.<br>• **Redirect:** `EMAIL_REDIRECT_TO`, when set, replaces every recipient. Vercel Preview sets it to `delivered@resend.dev` (owner answer E). | One place that talks to Resend. Previews exercise the real API and appear in the Resend dashboard without e2e runs mailing the team. | Owner answers E, H |
| D9 | **Environment** (`lib/env.ts`), all server-only:<br>• `RESEND_API_KEY`: a **sending-only** key per environment (Production, Preview).<br>• `EMAIL_FROM`: `Name <address>`.<br>• `INQUIRY_NOTIFICATION_EMAIL`: 1–5 comma-separated addresses.<br>• `INQUIRY_ACK_ENABLED`: `0` / `1`.<br>• `EMAIL_REDIRECT_TO`: one address.<br>**Rules:**<br>• On Vercel (`VERCEL_ENV` set) with `INQUIRY_FORM_ENABLED=1`, the first three are required.<br>• `EMAIL_REDIRECT_TO` is **refused in production**.<br>• `INQUIRY_ACK_ENABLED=1` is **refused in production while `EMAIL_FROM` is `@resend.dev`**, since the acknowledgment can't reach clients from it.<br>Off Vercel, all are optional, and sends are skipped (D8). | A missing key fails the build instead of silently losing notifications. The two refusals stop a preview setting reaching production and stop the acknowledgment being turned on before the domain exists. | *Environment*; Phase 18 D5 pattern |
| D10 | **Missed-notification alert** (owner answer F).<br>• **The check:** the hourly monitor gains an "inquiry notifications" check. It fails when any inquiry created **between 24 hours and 15 minutes ago** still has `emailSentAt` NULL. The detail is the count only, because Actions logs are public. A failing run emails the owner as today.<br>• **Access:** a grant-only migration gives `rhm_readonly` **column-level** `SELECT ("createdAt", "emailSentAt") ON "Inquiry"`, no personal columns. The Prisma schema is unchanged, so `preview-e2e` is not affected.<br>• **Runbook:** `docs/runbooks/monitoring.md` gains the response: find the row in the Neon console, contact the client, then set `emailSentAt` to clear the alert. | Vercel Hobby keeps runtime logs for 1 hour, so a logged failure alone can lose a lead unseen. The 24-hour window keeps an unhandled failure alerting for a day without nagging forever. A column grant keeps Phase 17 D4's intent: the monitor still sees no personal data. | Monitoring row; Phase 17 D4; owner answer F |
| D11 | **Production go-live at this phase's release** (owner answer G). Merging into `develop` needs no production keys. Before the `develop` → `main` release, the owner adds to Vercel Production:<br>• the Turnstile keys (Phase 18 D5);<br>• `RESEND_API_KEY`, `EMAIL_FROM`, `INQUIRY_NOTIFICATION_EMAIL`;<br>• `INQUIRY_FORM_ENABLED=1`.<br>`INQUIRY_ACK_ENABLED` stays unset. The release check is one real test inquiry on production. It must:<br>• arrive in Gmail with **SPF, DKIM and DMARC all `PASS`** in *Show original*;<br>• get `emailSentAt` set.<br>The test row is then deleted in the Neon console. `docs/runbooks/release.md` gains these steps. | The switch's purpose (Phase 18 D10) ends here. A real inquiry is the only proof that the production key, sender and inbox line up. | Phase 18 D10; owner answer G |
| D12 | **Privacy notice:** `privacy.processors.body` adds Resend as the email provider, with its hosting region confirmed from the account at build time (Appendix C). It ships in this PR, before the form is turned on in production. | The notice promised to list Resend when it ships (Phase 18 D11). Data sent to a processor abroad must be disclosed (NDPA 2023). | Phase 18 D11; *Security baseline* (personal data) |
| D13 | **Success panel copy** (Appendix C): unchanged when `acknowledgment` is false. When true, one sentence is added saying a confirmation is on its way. | Honest claims: the panel promises an email only when one will be attempted. | Mission principle 4; D6 |
| D14 | **Tests.**<br>• **Unit `lib/inquiry/notify-core.test.ts`:**<br>  ◦ both sent → both marked;<br>  ◦ team fails → ack still sent, failure logged, `emailSentAt` untouched;<br>  ◦ ack fails → team still marked;<br>  ◦ switch off → no ack;<br>  ◦ over the per-recipient limit → no ack;<br>  ◦ `skipped` → nothing marked;<br>  ◦ idempotency keys;<br>  ◦ logs carry no email, name or phone.<br>• **Unit templates:**<br>  ◦ hostile input (`<script>`, `<img onerror>`, a `javascript:` URL, a newline with `Bcc:`) appears escaped and inert in HTML and text;<br>  ◦ the subject and every header contain no input;<br>  ◦ the team email shows every field and "Service: Type";<br>  ◦ the acknowledgment contains no name, company or notes.<br>• **Unit `send.test.ts`** (mocked SDK): `ok`, an error result, a thrown error, a missing key, the redirect.<br>• **Unit `env.test.ts`:** the D9 rules.<br>• **Unit `monitor-core.test.ts`:** the new check.<br>• **Unit `submit-core.test.ts`:** `save` returns the id; `acknowledgment` true or false.<br>• **DB:**<br>  ◦ `submit.db.test.ts`: with a sender that throws, the row is saved, `success` is returned and `emailSentAt` stays NULL;<br>  ◦ `markSent` sets each column once;<br>  ◦ `rhm_readonly` can count by the two granted columns and is still refused `email` and `clientName`.<br>• **E2E:** the preview's saved submission still shows the success panel, now with the confirmation sentence (Preview has the ack switch on). `/contact` is still prerendered. | Proves the roadmap row as amended (D1): Resend unreachable still saves and logs. Also proves the escaping and header rules and the alert. | Roadmap Phase 20 "Done when" |

## Constraints

- **C1 — Save first.** Nothing in this phase may move the save after any email call or make `success` depend on one.
- **C2 — No user input in headers.** This covers the subject, `Reply-To`, `From`, `tags` and any custom header. User input appears only in the body, escaped.
- **C3 — No personal data in logs or Actions output.** Only inquiry ids, error names and counts.
- **C4 — Static `/contact`.** It stays prerendered (`○`). The ack switch and the result flag reach the client through the action's result, not through a dynamic render.
- **C5 — Only listed libraries.** These are `resend` and `@react-email/components`. The SDK's `@react-email/render` peer is optional and not needed, since templates are rendered before the call (D7). Each is at an exact version at least two weeks old.
- **C6 — Grant-only migration.** It touches no table or column definition.

## Owner answers (2026-10-20)

- **A. No domain:** the team notification now, through the shared sender; the client acknowledgment behind a switch until a domain amendment; the DMARC check moves to that amendment.
- **B. Team inbox:** `redhatmediang@gmail.com`.
- **C. Acknowledgment content:** fixed choices only, no free text.
- **D. Timing:** after the response (`after()`).
- **E. Previews and CI:** the real API on Preview with a sending-only key, with every recipient redirected to `delivered@resend.dev`. CI and local have no key and skip sending.
- **F. Missed notifications:** the hourly monitor alerts on inquiries older than 15 minutes with no `emailSentAt`.
- **G. Go-live:** at this phase's release, checked with a real test inquiry on production.
- **H. Resend version:** the latest 6.x patch at least two weeks old. That is **6.32.1** (2026-10-06): 6.34.0 and 6.34.1 were published on 2026-10-16, four days before this phase, so the draft's "6.34.x" was wrong. The tech-stack row keeps 6.32 and gains the patch.
- **I. Manual check:** the owner looks at the team email in Gmail on the web and on a phone during the production test.

**Owner actions** (before the release, not before the PR):
- **Resend:** confirm or create the account **registered as `redhatmediang@gmail.com`**. Create two **sending-only** API keys: Production and Preview. Add the Preview key to Vercel Preview (`! vercel env add RESEND_API_KEY preview`).
- **Turnstile:** create the production widget (hostname `redhat-media.vercel.app`, *Managed*).
- **At release:** add the D11 variables to Vercel Production.

The agent sets the non-secret Preview variables:
- `EMAIL_FROM`;
- `INQUIRY_NOTIFICATION_EMAIL`;
- `INQUIRY_ACK_ENABLED=1`;
- `EMAIL_REDIRECT_TO=delivered@resend.dev`.

## Appendix A — Team notification (draft for approval)

**Subject:** `New inquiry · {Tue 20 Oct 2026, 14:05} WAT`

> **New inquiry from the website**
>
> **Name:** {clientName}
> **Company:** {companyName, or "—"}
> **Email:** {email} (mailto link)
> **Phone:** {phone, E.164} (tel link)
>
> **Services**
> - {Service}: {Type}
> - {Service}: {Type}
>
> **Budget:** {budget label}
> **Timeline:** {timeline label}
>
> **Project details**
> {projectNotes, line breaks kept}
>
> Received {Tue 20 Oct 2026, 14:05 WAT} · Reference {id}
>
> *Reply to the client directly at {email}. This message was sent by redhat-media.vercel.app when the inquiry form was submitted.*

## Appendix B — Client acknowledgment (draft for approval)

**Subject:** `We've received your inquiry — RedHat Media`
**Reply-To:** the site email (`lib/site.ts`)

> **Thanks — we've received your inquiry**
>
> We reply within one working day.
>
> **What you asked about**
> - {Service}: {Type}
> - {Service}: {Type}
>
> **Budget:** {budget label}
> **Timeline:** {timeline label}
>
> If anything has changed, just reply to this email or call us on {site phone}.
>
> *RedHat Media · RC 1379619 · Lagos, Nigeria*
> *You're receiving this because this address was entered on the inquiry form at redhat-media.vercel.app. If that wasn't you, you can ignore this email. We'll only use your address to reply to this inquiry. [Privacy notice](https://redhat-media.vercel.app/privacy)*

## Appendix C — Site copy changes (draft for approval)

| Key | Current | New |
| --- | --- | --- |
| `contact.form.success.ack` (new) | — | We've also sent a confirmation to your email address. |
| `privacy.processors.body` | …Neon (our database, hosted in London), Vercel (website hosting) and Cloudflare Turnstile (checks that a form is sent by a person, not a bot). | …Neon (our database, hosted in London), Vercel (website hosting), Cloudflare Turnstile (checks that a form is sent by a person, not a bot) and Resend (sends our emails about your inquiry, hosted in {region}). |
