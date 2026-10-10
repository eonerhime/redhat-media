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
} as const satisfies Record<BlockKeyShape, string>;
