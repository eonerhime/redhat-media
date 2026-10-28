// Which copy staff may edit in place, and how (Phase 27 spec, D1, D3, D4). A key that is not
// listed keeps its default: updateContentBlock refuses it and no ✎ appears for it. Left out on
// purpose: metadata, the inquiry form (contact.form.*), the mailto subject, transient states
// ("Copied", loading text), screen-reader-only text (e.g. contact.channels.heading) and templates with {placeholders}.
// Read by the server action and by the ✎ button in the browser, so it holds no copy itself.

import { pillars, services } from "../../content/services";
import type { BlockKey } from "./read-core";

/** Each kind's input and limits. Only body takes line breaks and **bold** (D3). */
export const BLOCK_KINDS = {
  /** Button and link labels, short facts. */
  label: { max: 40, multiline: false },
  heading: { max: 120, multiline: false },
  /** One sentence or list item. */
  line: { max: 300, multiline: false },
  /** Paragraphs: one per line, with **bold**. */
  body: { max: 5000, multiline: true },
} as const;

export type BlockKind = keyof typeof BLOCK_KINDS;

const pageBlocks = {
  "home.hero.tagline": "heading",
  "home.hero.subtext": "line",
  "home.services.heading": "heading",
  "home.cta.button": "label",
  "home.work.heading": "heading",
  "home.work.body": "line",
  "home.work.bodyLive": "line",
  "home.work.link": "label",
  "home.process.heading": "heading",
  "home.cta.heading": "heading",
  "home.cta.body": "line",

  "services.index.heading": "heading",
  "services.index.intro": "line",
  "services.detail.back": "label",
  "services.detail.included": "heading",
  "services.detail.deliverables": "heading",
  "services.detail.work.heading": "heading",
  "services.detail.work.link": "label",

  "about.heading": "heading",
  "about.intro": "body",
  "about.story.heading": "heading",
  "about.story.body": "body",
  "about.facts.founded": "label",
  "about.founded.year": "label",
  "about.facts.leadership": "label",
  "about.founder.name": "label",
  "about.founder.title": "line",
  "about.facts.registered": "label",
  "about.facts.based": "label",
  "about.oneTeam.heading": "heading",
  "about.oneTeam.body": "body",
  "about.pillars.heading": "heading",
  "about.pillars.intro": "line",
  "about.sdd.heading": "heading",
  "about.sdd.body": "body",
  "about.sdd.link": "label",

  "portfolio.heading": "heading",
  "portfolio.intro": "line",
  "portfolio.tech": "label",
  "portfolio.live": "label",
  "portfolio.empty": "line",
  "portfolio.unavailable": "line",
  "portfolio.filter.all": "label",
  "portfolio.filter.webApps": "label",
  "portfolio.filter.photography": "label",
  "portfolio.filter.videography": "label",
  "portfolio.filter.marketing": "label",
  "portfolio.detail.back": "label",
  "portfolio.detail.highlights": "heading",
  "portfolio.detail.links": "heading",
  "portfolio.detail.repo": "label",
  "portfolio.detail.credit": "label",
  "portfolio.detail.client": "label",
  "portfolio.detail.gallery": "heading",

  "contact.heading": "heading",
  "contact.intro": "line",
  "contact.email.button": "label",
  "contact.email.label": "label",
  "contact.email.note": "line",
  "contact.email.copy": "label",
  "contact.phone.label": "label",
  "contact.phone.note": "line",
  "contact.phone.international": "line",
  "contact.whatsapp.label": "label",
  "contact.whatsapp.link": "label",
  "contact.whatsapp.note": "line",
  "contact.location.label": "label",
  "contact.location.note": "line",
  "contact.hours.label": "label",
  "contact.next.heading": "heading",
  "contact.next.send": "line",
  "contact.next.reply": "line",
  "contact.next.scope": "line",
  "contact.brief.heading": "heading",
  "contact.brief.intro": "line",
  "contact.brief.service": "line",
  "contact.brief.goal": "line",
  "contact.brief.timeline": "line",
  "contact.brief.budget": "line",
  "contact.brief.examples": "line",
  "contact.brief.services": "label",

  "privacy.heading": "heading",
  "privacy.updated": "line",

  "footer.privacy": "label",
} as const satisfies Partial<Record<BlockKey, BlockKind>>;

const PRIVACY_SECTIONS = [
  "who",
  "collect",
  "why",
  "basis",
  "processors",
  "retention",
  "rights",
  "contact",
] as const;

/** Every editable key and its kind. Service and pillar copy follows content/services.ts. */
export const editableBlocks: ReadonlyMap<string, BlockKind> = new Map<string, BlockKind>([
  ...Object.entries(pageBlocks),
  ...pillars.flatMap((pillar): [string, BlockKind][] => [
    [pillar.nameKey, "heading"],
    [pillar.summaryKey, "line"],
    [pillar.roleKey, "line"],
    ...pillar.stepKeys.map((key): [string, BlockKind] => [key, "label"]),
  ]),
  ...services.flatMap((service): [string, BlockKind][] => [
    [service.nameKey, "heading"],
    [service.summaryKey, "line"],
    ...[...service.includedKeys, ...service.deliverableKeys].map((key): [string, BlockKind] => [
      key,
      "line",
    ]),
  ]),
  ...PRIVACY_SECTIONS.flatMap((id): [string, BlockKind][] => [
    [`privacy.${id}.heading`, "heading"],
    [`privacy.${id}.body`, "body"],
  ]),
]);

/** The kind of an editable key, or undefined for one that keeps its default. */
export function editableKind(key: string): BlockKind | undefined {
  return editableBlocks.get(key);
}
