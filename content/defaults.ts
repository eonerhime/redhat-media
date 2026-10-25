// Default copy for every block key (Phase 2 spec, D3–D5). Staff edits from Phase 27 override it
// per key; read it only through block() in lib/content/block.ts.
// Ported verbatim from the legacy index.html, with HTML entities decoded. Plain text only (C3).

import type { BlockKeyShape } from "../lib/content/keys";

export const defaults = {
  "home.meta.description":
    "RedHat Media — photography, videography, digital marketing, social media management, and web development. If it's media, it's ours to handle.",
  "home.hero.tagline": "If it's media, it's ours to handle.",
  "home.hero.subtext":
    "Photography. Videography. Digital & social media marketing. Online presence management. Websites & web apps. One team, every medium.",
  "home.services.heading": "What We Do",

  // Phase 3 sample copy, adopted by the owner for review on the preview (Phase 3 spec, D2).
  "home.cta.button": "Start a project",
  "home.work.heading": "Featured work",
  "home.work.body":
    "Selected projects from across photography, video, marketing and software will appear here.",
  // Shown instead of home.work.body when featured cards are on the page (Phase 23 spec, D1, owner 2026-10-24).
  "home.work.bodyLive": "Selected projects from across photography, video, marketing and software.",
  "home.work.link": "See the portfolio",
  "home.process.heading": "How we work",
  "home.cta.heading": "Have a project in mind?",
  "home.cta.body": "Tell us what you want built, shot or grown, and we'll take it from there.",

  "about.intro":
    "RedHat Media (RHM) is a registered Nigerian media company built on one simple idea: if it's media-related, we handle it. From the first shot to the final line of code, we cover the full spectrum of modern media production and digital presence — so our clients can focus on running their business, not juggling five different vendors.",

  // Pillar names come from tech-stack.md → Architectural rules 3, not the legacy page.
  "services.pillars.production.name": "Production",
  "services.pillars.growth.name": "Growth",
  "services.pillars.build.name": "Build",

  // Pillar summaries are Phase 3 sample copy (D2). Production and Build steps come from the
  // roadmap; Growth's are a Phase 3 sample (D4).
  "services.pillars.production.summary":
    "Photos and video that show your work at its best, from the first shot to the final cut.",
  "services.pillars.growth.summary":
    "Marketing, social and reputation management that keep you visible and trusted.",
  "services.pillars.build.summary":
    "Websites and web apps, planned first, then built to work as hard as you do.",

  // Phase 4 sample copy for the /services page, for review on the preview (Phase 4 spec, D2).
  "services.index.heading": "Services",
  "services.index.intro":
    "Production, growth and build: one team for every medium your business needs.",
  "services.meta.description":
    "Photography, videography, digital and social media marketing, online presence management, and web and app development from RedHat Media in Lagos.",

  "services.pillars.production.step1": "Brief",
  "services.pillars.production.step2": "Shoot",
  "services.pillars.production.step3": "Deliver",
  "services.pillars.growth.step1": "Audit",
  "services.pillars.growth.step2": "Plan",
  "services.pillars.growth.step3": "Grow",
  "services.pillars.build.step1": "Spec",
  "services.pillars.build.step2": "Build",
  "services.pillars.build.step3": "Ship",

  "services.photography.name": "Photography",
  "services.photography.summary":
    "Product, event, and portrait photography that tells your story in a single frame.",
  "services.videography.name": "Videography",
  "services.videography.summary":
    "From concept to final cut — promotional videos, event coverage, and everything between.",
  "services.digitalMarketing.name": "Digital Marketing",
  "services.digitalMarketing.summary": "Campaigns built to convert, not just impress.",
  "services.socialMedia.name": "Social Media Marketing",
  "services.socialMedia.summary":
    "Consistent, on-brand presence across every platform that matters.",
  "services.onlinePresence.name": "Online Presence Management",
  "services.onlinePresence.summary":
    "We manage the accounts and the reputation, so you can manage the business.",
  "services.webApp.name": "Web & App Development",
  "services.webApp.summary": "Websites and web apps built to work as hard as you do.",

  // Phase 5 sample copy for the service pages, for review on the preview (Phase 5 spec, D3).
  "services.detail.back": "All services",
  "services.detail.included": "What's included",
  "services.detail.deliverables": "What you get",
  // Phase 10: the related-work section (owner-approved, Phase 10 spec, Appendix A).
  "services.detail.work.heading": "Related work",
  "services.detail.work.link": "See all work",

  "services.photography.included1":
    "A pre-shoot brief to agree the shot list, style and where the images will be used",
  "services.photography.included2": "Product, event and portrait sessions",
  "services.photography.included3": "Selection of the strongest frames",
  "services.photography.included4": "Colour correction and retouching",
  "services.photography.deliverable1": "Edited, high-resolution images",
  "services.photography.deliverable2": "Web-ready versions sized for your site and social channels",
  "services.photography.deliverable3": "Files delivered by download link",

  "services.videography.included1": "Concept and script development",
  "services.videography.included2": "Filming of promotional content, events and interviews",
  "services.videography.included3": "Editing, colour grading and sound",
  "services.videography.included4": "Titles and captions",
  "services.videography.deliverable1": "A final cut in the formats your channels need",
  "services.videography.deliverable2": "Short cut-downs for social media",
  "services.videography.deliverable3": "Files delivered by download link",

  "services.digitalMarketing.included1": "An audit of your current channels and results",
  "services.digitalMarketing.included2": "A campaign plan with goals, audience and budget",
  "services.digitalMarketing.included3": "Ad creative and copy",
  "services.digitalMarketing.included4": "Campaign setup, monitoring and optimisation",
  "services.digitalMarketing.deliverable1": "A written campaign plan",
  "services.digitalMarketing.deliverable2": "Live campaigns on the agreed channels",
  "services.digitalMarketing.deliverable3": "Regular performance reports",

  "services.socialMedia.included1": "A content calendar for each platform",
  "services.socialMedia.included2": "Post design and caption writing",
  "services.socialMedia.included3": "Scheduling and publishing",
  "services.socialMedia.included4": "Replies to comments and messages",
  "services.socialMedia.deliverable1": "A monthly content calendar",
  "services.socialMedia.deliverable2": "Published posts on your channels",
  "services.socialMedia.deliverable3": "Monthly performance reports",

  "services.onlinePresence.included1": "Setting up and tidying your business profiles and listings",
  "services.onlinePresence.included2": "Keeping details, hours and photos up to date",
  "services.onlinePresence.included3": "Monitoring and responding to reviews",
  "services.onlinePresence.included4": "Account access and security checks",
  "services.onlinePresence.deliverable1": "Complete, consistent business profiles",
  "services.onlinePresence.deliverable2": "Review responses on your behalf",
  "services.onlinePresence.deliverable3": "A monthly presence report",

  "services.webApp.included1": "A written spec agreed before any code is written",
  "services.webApp.included2": "Design and development of websites and web apps",
  "services.webApp.included3": "Hosting, domain and security setup",
  "services.webApp.included4": "Testing on phones, tablets and desktops",
  "services.webApp.deliverable1": "A live, tested website or web app",
  "services.webApp.deliverable2": "Documentation for running and updating it",
  "services.webApp.deliverable3": "A handover session with your team",
  // Phase 6 sample copy for /about, for the company to accept or replace (Phase 6 spec, D3).
  // The founder and the founding year are owner facts (D2).
  "about.meta.description":
    "Who RedHat Media is: a Lagos media company where one team handles photography, video, marketing and software.",
  "about.heading": "About us",
  "about.story.heading": "Our story",
  "about.story.body":
    "Emo Onerhime founded RedHat Media in Lagos as a photography and video studio. As clients asked for more, first campaigns to share their content and then websites to hold it, the studio grew into a full media company. One idea has stayed the same throughout: a business should have one dependable partner for all of its media, not a different supplier for every job. It still shapes how we work: one brief, one team and one standard across everything we make.",
  "about.facts.founded": "Founded",
  "about.founded.year": "2019",
  "about.facts.leadership": "Leadership",
  "about.founder.name": "Emo Onerhime",
  "about.founder.title": "Founder, Managing Director and CEO",
  "about.facts.registered": "Registered",
  "about.facts.based": "Based in",
  "about.oneTeam.heading": "One team, every medium",
  "about.oneTeam.body":
    "Most businesses need more than one kind of media work. Hiring a photographer, a video crew, a marketing agency and a developer separately means four briefs, four timelines and nobody who sees the whole picture. At RHM one team holds the brief from start to finish, so your photos, videos, campaigns and website look and sound like the same business.",
  "about.pillars.heading": "How the pillars work together",
  "about.pillars.intro":
    "Our services fall into pillars. Each stands on its own, and they work best together.",
  "about.pillars.production.role":
    "Production creates the photos and video that show what your business does.",
  "about.pillars.growth.role":
    "Growth puts that content in front of the right people and keeps your presence active.",
  "about.pillars.build.role":
    "Build gives it all a home: a fast, secure website or app that turns visitors into inquiries.",
  "about.sdd.heading": "How we build: Spec-Driven Development",
  "about.sdd.body":
    "Every website and app we build starts with a written spec: what it must do, who it is for and how we will know it works. You agree the spec before any code is written. We then build in small steps, check each one against the spec, and ship only when it passes. This website was built the same way.",
  "about.sdd.link": "See Web & App Development",

  // Phase 10 copy for /portfolio (owner-approved, Phase 10 spec, Appendix A). The description and
  // intro speak of web work only, because only web items are published; widen them when media
  // case studies are seeded (Phase 9 spec, D10).
  "portfolio.meta.description":
    "Websites and web apps designed, built and shipped by RedHat Media.",
  "portfolio.heading": "Our work",
  "portfolio.intro":
    "Products we have designed, built and shipped, with the tools behind each one.",
  "portfolio.tech": "Tech stack",
  "portfolio.live": "Visit live site",
  "portfolio.loading": "Loading the portfolio",
  "portfolio.empty": "No projects are published yet. Tell us about yours.",
  "portfolio.unavailable":
    "The portfolio could not be loaded just now. Please try again in a few minutes.",

  // Phase 11 filter bar (owner-approved, Phase 11 spec, Appendix A).
  "portfolio.filter.label": "Filter by category",
  "portfolio.filter.all": "All",
  "portfolio.filter.webApps": "Web & Apps",
  "portfolio.filter.photography": "Photography",
  "portfolio.filter.videography": "Videography",
  "portfolio.filter.marketing": "Marketing",

  // Phase 12 detail page (owner-approved, Phase 12 spec, Appendix A). {alt}, {n} and {total} are
  // filled in by the component.
  "portfolio.detail.back": "All work",
  "portfolio.detail.highlights": "Highlights",
  "portfolio.detail.links": "Links",
  "portfolio.detail.repo": "View the code on GitHub",
  "portfolio.detail.credit": "Credit",
  "portfolio.detail.client": "Client",
  "portfolio.detail.gallery": "Gallery",
  "portfolio.detail.loading": "Loading the project",
  "portfolio.detail.view": "View larger: {alt}",
  "portfolio.detail.lightbox.label": "Image viewer",
  "portfolio.detail.lightbox.close": "Close",
  "portfolio.detail.lightbox.previous": "Previous image",
  "portfolio.detail.lightbox.next": "Next image",
  "portfolio.detail.lightbox.position": "Image {n} of {total}",
  "portfolio.modal.close": "Close",

  // Phase 13 contact page (owner-approved, Phase 13 spec, Appendix A). The contact details
  // themselves are site data in lib/site.ts (Phase 2 spec, D9).
  "contact.meta.description":
    "Contact RedHat Media in Lagos by email or phone to start a photography, video, marketing or web project.",
  "contact.heading": "Let's talk about your project",
  "contact.intro":
    "Tell us what you want built, shot or grown. Email or call us, and the team will take it from there.",
  "contact.email.button": "Email us",
  "contact.email.subject": "Project inquiry",
  "contact.channels.heading": "Ways to reach us",
  "contact.email.label": "Email",
  "contact.email.note": "Best for briefs, files and links.",
  "contact.email.copy": "Copy email address",
  "contact.email.copied": "Copied",
  "contact.phone.label": "Phone",
  "contact.phone.note": "Tap the number to call from your phone.",
  "contact.phone.international": "From outside Nigeria",
  "contact.whatsapp.label": "WhatsApp",
  "contact.whatsapp.link": "Chat on WhatsApp",
  "contact.whatsapp.note": "Send us a message any time.",
  "contact.location.label": "Location",
  "contact.location.note": "We work with clients in Lagos, across Nigeria and abroad.",
  "contact.hours.label": "Hours",
  "contact.next.heading": "What happens next",
  "contact.next.send": "You send us a message or call with what you need.",
  "contact.next.reply": "We reply within one working day.",
  "contact.next.scope": "We agree the scope, timeline and price with you before any work starts.",
  "contact.brief.heading": "What to include",
  "contact.brief.intro": "The more we know, the faster we can give you a quote.",
  "contact.brief.service": "The service you need",
  "contact.brief.goal": "What you want to achieve, and who it is for",
  "contact.brief.timeline": "Your timeline and any fixed dates",
  "contact.brief.budget": "Your budget range",
  "contact.brief.examples": "Links or examples you like",
  "contact.brief.services": "See our services",

  // Phase 18 inquiry form (owner-approved, Phase 18 spec, Appendix A). {email} is the site email
  // from lib/site.ts, inserted at render time.
  "contact.form.heading": "Tell us about your project",
  "contact.form.intro":
    "A few details help us reply with something useful. Fields marked * are required.",
  "contact.form.name.label": "Your name *",
  "contact.form.email.label": "Email *",
  "contact.form.phone.label": "Phone or WhatsApp *",
  "contact.form.phone.hint":
    "Nigerian numbers like 0803 123 4567; international numbers with a country code, like +44.",
  "contact.form.company.label": "Company or organisation",
  "contact.form.services.legend": "What do you need? *",
  "contact.form.services.hint": "Choose all that apply.",
  "contact.form.notes.label": "Tell us about the project *",
  "contact.form.notes.hint": "What you need, who it's for, and anything else we should know.",
  "contact.form.consent.label":
    "I agree that RedHat Media may store these details to reply to my inquiry, as described in the",
  "contact.form.consent.link": "privacy notice",
  "contact.form.submit": "Send inquiry",
  "contact.form.submitting": "Sending…",
  "contact.form.errors.summary": "Please fix the following:",
  "contact.form.errors.generic":
    "We couldn't send your inquiry. Please try again, or email us at {email}.",
  "contact.form.errors.rateLimited":
    "You've sent several inquiries in a short time. Please try again later, or email us at {email}.",
  "contact.form.success.heading": "Thanks, we've received your inquiry",
  "contact.form.success.body":
    "We reply within one working day. If it's urgent, call or WhatsApp us on the numbers on this page.",
  // Phase 20 spec, D13, Appendix C: shown only when the confirmation email will be attempted.
  "contact.form.success.ack": "We've also sent a confirmation to your email address.",

  // Phase 19 scope stepper (owner-approved, Phase 19 spec, Appendix A). {n}, {total}, {step} and
  // {email} are filled in at render time. The USD hints use ₦1,465.49/$ (CBN NFEM rate of
  // 16 October 2026 plus 10%), rounded and marked "about".
  "contact.form.progress": "Step {n} of {total}",
  "contact.form.stepHeading": "Step {n} of {total}: {step}",
  "contact.form.steps.services": "What do you need?",
  "contact.form.steps.types": "What kind of project?",
  "contact.form.steps.budget": "What's your budget?",
  "contact.form.steps.timeline": "When do you need it?",
  "contact.form.steps.details": "Your details",
  "contact.form.steps.review": "Check and send",
  "contact.form.types.hint": 'Choose all that apply for each service, or "Not sure yet".',
  "contact.form.budget.legend": "Budget range *",
  "contact.form.budget.hint":
    "A rough range helps us suggest the right approach. Amounts are in naira; dollar amounts are approximate.",
  "contact.form.budget.under500k": "Under ₦500,000 (about $340)",
  "contact.form.budget.from500kTo1500k": "₦500,000 – ₦1.5 million (about $340 – $1,000)",
  "contact.form.budget.from1500kTo5m": "₦1.5 million – ₦5 million (about $1,000 – $3,400)",
  "contact.form.budget.from5mTo15m": "₦5 million – ₦15 million (about $3,400 – $10,200)",
  "contact.form.budget.over15m": "Over ₦15 million (over about $10,200)",
  "contact.form.budget.notSure": "Not sure yet",
  "contact.form.timeline.legend": "Timeline *",
  "contact.form.timeline.asap": "As soon as possible (within 2 weeks)",
  "contact.form.timeline.within1Month": "Within a month",
  "contact.form.timeline.oneToThreeMonths": "In 1–3 months",
  "contact.form.timeline.overThreeMonths": "In more than 3 months",
  "contact.form.timeline.flexible": "Flexible / not sure",
  "contact.form.review.intro": "Check your answers before you send them.",
  "contact.form.review.services": "Services",
  "contact.form.review.types": "Project type",
  "contact.form.review.budget": "Budget",
  "contact.form.review.timeline": "Timeline",
  "contact.form.review.details": "Your details",
  "contact.form.review.change": "Change",
  "contact.form.review.changeLabel": "Change {step}",
  "contact.form.next": "Continue",
  "contact.form.back": "Back",
  "contact.form.toReview": "Back to review",
  "contact.form.noscript":
    "This form needs JavaScript. You can still reach us by email at {email} or call one of the numbers on this page.",

  // Phase 19 project types per service (owner-approved, Phase 19 spec, Appendix B). The ids are
  // in content/project-types.ts; a key is contact.form.types.<service id>.<type>.
  "contact.form.types.photography.event": "Event coverage",
  "contact.form.types.photography.product": "Product photography",
  "contact.form.types.photography.portrait": "Portraits and headshots",
  "contact.form.types.photography.brand": "Brand and corporate shoot",
  "contact.form.types.photography.notSure": "Not sure yet",
  "contact.form.types.videography.promo": "Promotional video or advert",
  "contact.form.types.videography.event": "Event coverage",
  "contact.form.types.videography.interview": "Interviews and testimonials",
  "contact.form.types.videography.social": "Short clips for social media",
  "contact.form.types.videography.notSure": "Not sure yet",
  "contact.form.types.digitalMarketing.launch": "A campaign for a launch or event",
  "contact.form.types.digitalMarketing.ads": "Ongoing paid ads (Google, Meta)",
  "contact.form.types.digitalMarketing.audit": "An audit and marketing plan",
  "contact.form.types.digitalMarketing.notSure": "Not sure yet",
  "contact.form.types.socialMedia.management": "Ongoing account management",
  "contact.form.types.socialMedia.content": "Content creation only",
  "contact.form.types.socialMedia.campaign": "A campaign for a launch or event",
  "contact.form.types.socialMedia.notSure": "Not sure yet",
  "contact.form.types.onlinePresence.setup": "Setting up profiles and listings",
  "contact.form.types.onlinePresence.upkeep": "Ongoing upkeep and review replies",
  "contact.form.types.onlinePresence.recovery": "Recovering or securing an account",
  "contact.form.types.onlinePresence.notSure": "Not sure yet",
  "contact.form.types.webApp.website": "A website",
  "contact.form.types.webApp.webApp": "A web app",
  "contact.form.types.webApp.shop": "An online shop",
  "contact.form.types.webApp.improve": "Improving an existing site or app",
  "contact.form.types.webApp.notSure": "Not sure yet",

  // Phase 18 privacy notice (owner-approved, Phase 18 spec, Appendix B). Each heading is the
  // appendix's section name.
  "privacy.meta.description":
    "How RedHat Media handles the details you send through the inquiry form, and your rights under the Nigeria Data Protection Act 2023.",
  "privacy.heading": "Privacy notice",
  "privacy.updated": "Last updated 20 October 2026.",
  "privacy.who.heading": "Who we are",
  "privacy.who.body":
    "RedHat Media (RC 1379619) is a media company based in Lagos, Nigeria. This notice explains what we do with the details you send through our inquiry form.",
  "privacy.collect.heading": "What we collect",
  "privacy.collect.body":
    "Your name, email address, phone number, company (if you give one), the services you're interested in, your project details, and the time you agreed to this notice. To protect the form from abuse we also keep a scrambled (hashed) version of your IP address, which cannot be turned back into the address.",
  "privacy.why.heading": "Why",
  "privacy.why.body":
    "To reply to your inquiry, understand what you need and prepare a proposal. We don't use your details for marketing, and we don't sell them.",
  "privacy.basis.heading": "Legal basis",
  "privacy.basis.body":
    "Your consent, which you give by ticking the box on the form. You can withdraw it at any time.",
  "privacy.processors.heading": "Who processes it",
  "privacy.processors.body":
    "RedHat Media staff who handle inquiries, and the services that run this website: Neon (our database, hosted in London), Vercel (website hosting), Cloudflare Turnstile (checks that a form is sent by a person, not a bot) and Resend (sends our emails about your inquiry, hosted in the United States).",
  "privacy.retention.heading": "How long we keep it",
  "privacy.retention.body":
    "We keep an inquiry while we're discussing your project. Once it's closed, we anonymise it after 24 months. The hashed IP records used to stop abuse are deleted after 30 days.",
  "privacy.rights.heading": "Your rights",
  "privacy.rights.body":
    "Under the Nigeria Data Protection Act 2023 you can ask to see the details we hold about you, correct them, delete them, or withdraw your consent. You can also complain to the Nigeria Data Protection Commission.",
  "privacy.contact.heading": "Contact",
  "privacy.contact.body": "To use these rights or ask a question, email redhatmediang@gmail.com.",

  // Phase 18: the footer's link to the notice (Phase 18 spec, D11).
  "footer.privacy": "Privacy notice",
} as const satisfies Record<BlockKeyShape, string>;
