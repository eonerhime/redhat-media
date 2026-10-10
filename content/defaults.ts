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

  "about.intro":
    "RedHat Media (RHM) is a registered Nigerian media company built on one simple idea: if it's media-related, we handle it. From the first shot to the final line of code, we cover the full spectrum of modern media production and digital presence — so our clients can focus on running their business, not juggling five different vendors.",

  // Pillar names come from tech-stack.md → Architectural rules 3, not the legacy page.
  "services.pillars.production.name": "Production",
  "services.pillars.growth.name": "Growth",
  "services.pillars.build.name": "Build",

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
