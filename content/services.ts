// The six services as typed config (tech-stack.md → Architectural rules 3; Phase 2 spec, D6–D8).
// Public code reads them only through visibleServices() / visiblePillars() in
// lib/content/services.ts, which apply muting.

import type { BlockKey } from "../lib/content/block";

// Mirrors `enum ServiceCategory` in README §5 until Prisma generates it in Phase 7 (D8).
export const serviceCategories = [
  "WEB_APP",
  "PHOTOGRAPHY",
  "VIDEOGRAPHY",
  "DIGITAL_MARKETING",
  "SOCIAL_MEDIA",
  "ONLINE_PRESENCE",
] as const;

export type ServiceCategory = (typeof serviceCategories)[number];

export type PillarId = "production" | "growth" | "build";

export type Pillar = {
  id: PillarId;
  nameKey: BlockKey;
  summaryKey: BlockKey;
  // The homepage process strip, in order (Phase 3 spec, D4).
  stepKeys: readonly [BlockKey, BlockKey, BlockKey];
};

export type Service = {
  category: ServiceCategory;
  // camelCase form of the category, used in block keys (the CMS key pattern bans `_`).
  id: string;
  // Public URL segment for /services/[slug] (Phase 5). Changing one needs a spec update and a redirect.
  slug: string;
  pillar: PillarId;
  // Config default; Phase 31's ServiceSetting rows override it per category.
  muted: boolean;
  nameKey: BlockKey;
  summaryKey: BlockKey;
  // The service page's lists, in order (Phase 5 spec, D2).
  includedKeys: readonly [BlockKey, ...BlockKey[]];
  deliverableKeys: readonly [BlockKey, ...BlockKey[]];
};

export const pillars = [
  {
    id: "production",
    nameKey: "services.pillars.production.name",
    summaryKey: "services.pillars.production.summary",
    stepKeys: [
      "services.pillars.production.step1",
      "services.pillars.production.step2",
      "services.pillars.production.step3",
    ],
  },
  {
    id: "growth",
    nameKey: "services.pillars.growth.name",
    summaryKey: "services.pillars.growth.summary",
    stepKeys: [
      "services.pillars.growth.step1",
      "services.pillars.growth.step2",
      "services.pillars.growth.step3",
    ],
  },
  {
    id: "build",
    nameKey: "services.pillars.build.name",
    summaryKey: "services.pillars.build.summary",
    stepKeys: [
      "services.pillars.build.step1",
      "services.pillars.build.step2",
      "services.pillars.build.step3",
    ],
  },
] as const satisfies readonly Pillar[];

// Display order.
export const services = [
  {
    category: "PHOTOGRAPHY",
    id: "photography",
    slug: "photography",
    pillar: "production",
    muted: false,
    nameKey: "services.photography.name",
    summaryKey: "services.photography.summary",
    includedKeys: [
      "services.photography.included1",
      "services.photography.included2",
      "services.photography.included3",
      "services.photography.included4",
    ],
    deliverableKeys: [
      "services.photography.deliverable1",
      "services.photography.deliverable2",
      "services.photography.deliverable3",
    ],
  },
  {
    category: "VIDEOGRAPHY",
    id: "videography",
    slug: "videography",
    pillar: "production",
    muted: false,
    nameKey: "services.videography.name",
    summaryKey: "services.videography.summary",
    includedKeys: [
      "services.videography.included1",
      "services.videography.included2",
      "services.videography.included3",
      "services.videography.included4",
    ],
    deliverableKeys: [
      "services.videography.deliverable1",
      "services.videography.deliverable2",
      "services.videography.deliverable3",
    ],
  },
  {
    category: "DIGITAL_MARKETING",
    id: "digitalMarketing",
    slug: "digital-marketing",
    pillar: "growth",
    muted: false,
    nameKey: "services.digitalMarketing.name",
    summaryKey: "services.digitalMarketing.summary",
    includedKeys: [
      "services.digitalMarketing.included1",
      "services.digitalMarketing.included2",
      "services.digitalMarketing.included3",
      "services.digitalMarketing.included4",
    ],
    deliverableKeys: [
      "services.digitalMarketing.deliverable1",
      "services.digitalMarketing.deliverable2",
      "services.digitalMarketing.deliverable3",
    ],
  },
  {
    category: "SOCIAL_MEDIA",
    id: "socialMedia",
    slug: "social-media-marketing",
    pillar: "growth",
    muted: false,
    nameKey: "services.socialMedia.name",
    summaryKey: "services.socialMedia.summary",
    includedKeys: [
      "services.socialMedia.included1",
      "services.socialMedia.included2",
      "services.socialMedia.included3",
      "services.socialMedia.included4",
    ],
    deliverableKeys: [
      "services.socialMedia.deliverable1",
      "services.socialMedia.deliverable2",
      "services.socialMedia.deliverable3",
    ],
  },
  {
    category: "ONLINE_PRESENCE",
    id: "onlinePresence",
    slug: "online-presence-management",
    pillar: "growth",
    muted: false,
    nameKey: "services.onlinePresence.name",
    summaryKey: "services.onlinePresence.summary",
    includedKeys: [
      "services.onlinePresence.included1",
      "services.onlinePresence.included2",
      "services.onlinePresence.included3",
      "services.onlinePresence.included4",
    ],
    deliverableKeys: [
      "services.onlinePresence.deliverable1",
      "services.onlinePresence.deliverable2",
      "services.onlinePresence.deliverable3",
    ],
  },
  {
    category: "WEB_APP",
    id: "webApp",
    slug: "web-app-development",
    pillar: "build",
    muted: false,
    nameKey: "services.webApp.name",
    summaryKey: "services.webApp.summary",
    includedKeys: [
      "services.webApp.included1",
      "services.webApp.included2",
      "services.webApp.included3",
      "services.webApp.included4",
    ],
    deliverableKeys: [
      "services.webApp.deliverable1",
      "services.webApp.deliverable2",
      "services.webApp.deliverable3",
    ],
  },
] as const satisfies readonly Service[];
