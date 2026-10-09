# Mission — RedHat Media Platform

## Why this exists

RedHat Media (RHM, RC 1379619) is a registered Nigerian media company based in Lagos. It covers photography, videography, digital marketing, social media marketing, online presence management, and web & app development. Its promise is one line: **"If it's media, it's ours to handle."**

Today `redhat-media.vercel.app` is a single static page. It has six service cards, a `mailto:` link and a phone number. It shows **no work, no process and no way to scope a project**. That is a problem for a company that sells reliable web solutions: the site itself is the first proof a prospect sees.

We are rebuilding it as a fast, secure, multi-page Next.js platform. The site should show what RHM produces (photography, video and campaigns) and what it engineers (production web applications). It should also turn that credibility into scoped project inquiries.

## Mission statement

> **Turn qualified prospects into scoped project inquiries.**
> Every page should help a business owner, marketing lead or founder quickly see that RHM has done this kind of work before, to a professional standard, and that one team can handle every medium they need. It should then make it effortless to tell us what they want built, shot or grown.

## Primary success metric

**Qualified project inquiries received.** An inquiry counts once it is saved to the database, delivered to the team and acknowledged to the client.

Supporting metrics:

| Metric | Why it matters |
| --- | --- |
| Inquiry → first team response time | Leads go cold fast. Notifications must arrive instantly. |
| Portfolio / service page → inquiry conversion | Shows whether the showcase does its job. |
| Share of inquiries with a complete scope (service, budget range, timeline) | Scoped inquiries can be quoted without a discovery call. |
| Organic search rank for regional terms ("photography studio Lagos", "web development company Lagos", "social media management Nigeria") | This is the main source of new clients. |
| Core Web Vitals (all "Good") on mobile | Most visitors browse on phones, often over mobile data. Heavy media must not slow the site down. |
| Zero lost inquiries | Inquiries are saved to the database before any email is attempted, so an email failure never loses one. |

## Who we serve

1. **Brands and SMEs needing visual production.** They need commercial, event and portrait photography and videography. They judge on the portfolio: image quality, range and turnaround.
2. **Businesses needing growth.** They need digital marketing, social media management and online presence. They want evidence of results: campaign outcomes, before/after presence, platforms covered.
3. **Founders and organisations needing software.** They need websites and web apps. They want proof of engineering depth: live products, tech stack, architecture and a disciplined delivery method (Spec-Driven Development).
4. **RHM staff (internal).** Editors update copy, images, videos and portfolio items directly on the live pages through an **Editing: On/Off** toggle. Sales staff work incoming inquiries in `/cms`. None of this needs a developer.

## How the portfolio is framed

The engineering products from `emo-onerhime.vercel.app` (SportsPred, HireFlow, toutMessage, Abara, AfroJamz) are presented as **RedHat Media Web & App Development case studies**. Each is credited to Emo Onerhime as technical lead and links to the personal portfolio. RHM speaks with one brand voice. Engineering and media work sit in one portfolio, separated only by category filters.

## Guiding principles

1. **Inquiry first.** When features compete, the one closer to a scoped inquiry wins.
2. **The site is the proof.** A company selling reliable web solutions must run a fast, accessible and secure site. Performance, accessibility and security budgets are product features, not chores.
3. **Credibility is a conversion feature.** Portfolio pieces, process and tech-stack evidence exist to remove objections before the inquiry, not as decoration.
4. **Honest claims only.** No invented metrics, testimonials, clients or awards. Placeholder content is clearly marked and never deployed to production as if it were real.
5. **Ship early, replace the static page fast.** The multi-page public site goes live before the inquiry flow and the CMS. Seeded content is acceptable at launch.
6. **Small, verifiable steps.** Each roadmap phase is independently shippable and testable.
7. **Spec-driven.** `README.md` and `specs/` are the contract. Code that departs from them requires updating the spec first.
8. **Creative, but restrained.** High-contrast dark theme in the RHM brand colours (red `#ed1c24`, grey `#808285`, near-black `#1a1a1a`), bold typography, crisp card grids, and short, purposeful motion. Media is the hero and the interface stays out of its way.
9. **Secure from the first commit, never bolted on.** Security headers, CI scanning, rate limiting, bot protection, brute-force lockout, 2FA, least-privilege database roles, backups and audit logging arrive *with* the feature they protect (see `tech-stack.md` → *Security baseline*). Validate every input (Zod), keep secrets on the server, and authorise every action on the server.
10. **Staff self-service, in place.** What staff see is what they edit. Turning editing off shows the page exactly as a visitor sees it.

## Out of scope (for now)

- Online payments, deposits or binding price quotes. The site produces *inquiries*, and humans produce proposals.
- Booking calendars or real-time shoot availability.
- Customer accounts or a client portal (proof galleries, invoice tracking).
- Multi-language support.
- A blog or "Insights" section. It may be revisited after launch for SEO.
- Live syncing from `emo-onerhime.vercel.app`. Engineering case studies are seeded once, then maintained in RHM's CMS.
- Hosting video files ourselves. Videos are added **by URL** (YouTube / Vimeo) and embedded.
- Content versioning, scheduled publishing and full rich-text editing (bold only for now).
