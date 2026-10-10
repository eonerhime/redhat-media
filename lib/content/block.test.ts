import { describe, expect, it } from "vitest";
import { defaults } from "../../content/defaults";
import { services } from "../../content/services";
import { block, type BlockKey } from "./block";
import { BLOCK_KEY_PATTERN } from "./keys";

const entries = Object.entries(defaults) as [BlockKey, string][];

describe("block()", () => {
  it.each(entries)("returns the default for %s", async (key, value) => {
    await expect(block(key)).resolves.toBe(value);
  });

  it("rejects an unknown key at compile time and at runtime", async () => {
    // pnpm typecheck fails if this key ever becomes valid (Phase 2 spec, D3).
    // @ts-expect-error -- not a block key
    await expect(block("home.hero.unknown")).rejects.toThrow(/Unknown content block key/);
    await expect(block("toString" as never)).rejects.toThrow(/Unknown content block key/);
  });
});

describe("content/defaults.ts", () => {
  it.each(entries)("%s matches the CMS key pattern", (key) => {
    expect(key).toMatch(BLOCK_KEY_PATTERN);
  });

  // Values are plain text (C3) and fit the CMS limit.
  it.each(entries)("%s is non-empty, trimmed, short and free of markup", (_key, value) => {
    expect(value.length).toBeGreaterThan(0);
    expect(value).toBe(value.trim());
    expect(value.length).toBeLessThanOrEqual(5000);
    expect(value).not.toMatch(/<\/?[a-z!]/i);
    expect(value).not.toMatch(/&(#\d+|#x[0-9a-f]+|[a-z]+);/i);
  });
});

// Each string as it appears in the legacy index.html source (`git show main:index.html`),
// entities included, so this table stays checkable after Phase 16 deletes the file (D5).
const legacy: [BlockKey, string][] = [
  [
    "home.meta.description",
    "RedHat Media — photography, videography, digital marketing, social media management, and web development. If it's media, it's ours to handle.",
  ],
  ["home.hero.tagline", "If it's media, it's ours to handle."],
  [
    "home.hero.subtext",
    "Photography. Videography. Digital &amp; social media marketing. Online presence management. Websites &amp; web apps. One team, every medium.",
  ],
  ["home.services.heading", "What We Do"],
  [
    "about.intro",
    "RedHat Media (RHM) is a registered Nigerian media company built on one simple idea: if it's media-related, we handle it. From the first shot to the final line of code, we cover the full spectrum of modern media production and digital presence — so our clients can focus on running their business, not juggling five different vendors.",
  ],
  ["services.photography.name", "Photography"],
  [
    "services.photography.summary",
    "Product, event, and portrait photography that tells your story in a single frame.",
  ],
  ["services.videography.name", "Videography"],
  [
    "services.videography.summary",
    "From concept to final cut — promotional videos, event coverage, and everything between.",
  ],
  ["services.digitalMarketing.name", "Digital Marketing"],
  ["services.digitalMarketing.summary", "Campaigns built to convert, not just impress."],
  ["services.socialMedia.name", "Social Media Marketing"],
  [
    "services.socialMedia.summary",
    "Consistent, on-brand presence across every platform that matters.",
  ],
  ["services.onlinePresence.name", "Online Presence Management"],
  [
    "services.onlinePresence.summary",
    "We manage the accounts and the reputation, so you can manage the business.",
  ],
  ["services.webApp.name", "Web &amp; App Development"],
  ["services.webApp.summary", "Websites and web apps built to work as hard as you do."],
];

const decodeEntities = (html: string) =>
  html.replaceAll("&amp;", "&").replaceAll("&middot;", "·").replaceAll("&copy;", "©");

describe("verbatim port of the legacy page", () => {
  it.each(legacy)("%s equals the legacy string", (key, html) => {
    expect(defaults[key]).toBe(decodeEntities(html));
  });

  // Every default is either ported or listed here as copy that never existed on the legacy page.
  it("ports every default except the listed new copy", () => {
    const pillarKeys = ["production", "growth", "build"].flatMap((id) =>
      ["name", "summary", "step1", "step2", "step3"].map(
        (field) => `services.pillars.${id}.${field}`,
      ),
    );
    const phase3Keys = [
      "home.cta.button",
      "home.cta.heading",
      "home.cta.body",
      "home.work.heading",
      "home.work.body",
      "home.work.link",
      "home.process.heading",
    ];
    const phase4Keys = [
      "services.index.heading",
      "services.index.intro",
      "services.meta.description",
    ];
    const phase5Keys = [
      "services.detail.included",
      "services.detail.deliverables",
      ...services.flatMap((s) => [...s.includedKeys, ...s.deliverableKeys]),
    ];
    const ported = new Set(legacy.map(([key]) => key));
    const unported = entries.map(([key]) => key).filter((key) => !ported.has(key));
    expect(unported.sort()).toEqual(
      [...pillarKeys, ...phase3Keys, ...phase4Keys, ...phase5Keys].sort(),
    );
  });
});
