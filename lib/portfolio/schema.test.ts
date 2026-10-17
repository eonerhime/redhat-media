import { describe, expect, it } from "vitest";
import { isRhmPublicId } from "@/lib/media/cloudinary";
import { portfolioSeed } from "@/prisma/seed-data/portfolio";
import {
  parsePortfolioSeed,
  portfolioSeedItemSchema,
  seedCoverId,
  seedCoverPublicId,
  seedItemId,
  type PortfolioSeedItem,
} from "./schema";

const valid: PortfolioSeedItem = {
  slug: "example-app",
  title: "Example",
  category: "WEB_APP",
  summary: "A summary.",
  description: "A description.",
  credit: "Engineering: Someone",
  creditUrl: "https://someone.example.com",
  highlights: ["One.", "Two.", "Three."],
  techStack: ["Next.js"],
  liveUrl: "https://example.com",
  repoUrl: "https://github.com/someone/example",
  featured: false,
  publishedAt: "2026-10-13",
  cover: { source: "example.webp", alt: "Example home page." },
};

const issues = (item: unknown) => {
  const result = portfolioSeedItemSchema.safeParse(item);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
};

describe("the approved seed content (Phase 9 spec, Appendices A and B)", () => {
  it("parses: nine unique items with https links", () => {
    const parsed = parsePortfolioSeed(portfolioSeed);
    expect(parsed.map((item) => item.slug)).toEqual([
      "sportspred",
      "hireflow-track",
      "afro-jamz",
      "toutmessages",
      "abara",
      "memories-r-us",
      "glowreeyah",
      "epenal",
      "alphadeck",
    ]);
    for (const item of parsed) {
      expect(item.liveUrl).toMatch(/^https:\/\//);
      if (item.repoUrl) expect(item.repoUrl).toMatch(/^https:\/\/github\.com\//);
    }
  });

  it("features SportsPred, AfroJamz and toutMessages, and links only the public repos", () => {
    const parsed = parsePortfolioSeed(portfolioSeed);
    expect(parsed.filter((item) => item.featured).map((item) => item.slug)).toEqual([
      "sportspred",
      "afro-jamz",
      "toutmessages",
    ]);
    expect(parsed.filter((item) => item.repoUrl).map((item) => item.slug)).toEqual([
      "hireflow-track",
      "glowreeyah",
    ]);
  });

  it("names a client only for the two client projects (amendment 2026-10-17)", () => {
    const parsed = parsePortfolioSeed(portfolioSeed);
    expect(parsed.filter((item) => item.client).map((item) => [item.slug, item.client])).toEqual([
      ["glowreeyah", "Glowreeyah Braimah"],
      ["epenal", "Epenal Group"],
    ]);
  });

  it("links every credit to the personal portfolio (Phase 12 spec, D8)", () => {
    for (const item of parsePortfolioSeed(portfolioSeed))
      expect(item.creditUrl).toBe("https://emo-onerhime.vercel.app/");
  });

  it("gives every cover a public ID that <MediaImage> accepts", () => {
    for (const item of portfolioSeed)
      expect(isRhmPublicId(seedCoverPublicId(item.slug))).toBe(true);
  });
});

describe("portfolioSeedItemSchema (D3)", () => {
  it("accepts a valid item", () => {
    expect(issues(valid)).toEqual([]);
  });

  it.each([
    ["an http liveUrl", { liveUrl: "http://example.com" }, "liveUrl"],
    ["a javascript liveUrl", { liveUrl: "javascript:alert(1)" }, "liveUrl"],
    ["an http repoUrl", { repoUrl: "http://github.com/a/b" }, "repoUrl"],
    ["a non-GitHub repoUrl", { repoUrl: "https://gitlab.com/a/b" }, "repoUrl"],
    ["an upper-case slug", { slug: "Example" }, "slug"],
    ["a slug with spaces", { slug: "example app" }, "slug"],
    ["a slug over 60 characters", { slug: "a".repeat(61) }, "slug"],
    ["an empty title", { title: "  " }, "title"],
    ["a title over 80 characters", { title: "a".repeat(81) }, "title"],
    ["a summary over 200 characters", { summary: "a".repeat(201) }, "summary"],
    ["a description over 1,200 characters", { description: "a".repeat(1201) }, "description"],
    ["a credit over 120 characters", { credit: "a".repeat(121) }, "credit"],
    ["a client over 120 characters", { client: "a".repeat(121) }, "client"],
    ["an empty client", { client: "  " }, "client"],
    ["an http creditUrl", { creditUrl: "http://someone.example.com" }, "creditUrl"],
    ["two highlights", { highlights: ["a", "b"] }, "highlights"],
    ["seven highlights", { highlights: Array(7).fill("a") }, "highlights"],
    [
      "a highlight over 160 characters",
      { highlights: ["a", "b", "c".repeat(161)] },
      "highlights.2",
    ],
    ["no tech stack", { techStack: [] }, "techStack"],
    ["eleven tech stack entries", { techStack: Array(11).fill("a") }, "techStack"],
    ["another category", { category: "PHOTOGRAPHY" }, "category"],
    ["a bad date", { publishedAt: "13/10/2026" }, "publishedAt"],
    [
      "a cover with a path",
      { cover: { source: "../x.webp", alt: "Example home page." } },
      "cover.source",
    ],
    [
      "a cover that is not an image",
      { cover: { source: "x.svg", alt: "Example home page." } },
      "cover.source",
    ],
    ["a short alt text", { cover: { source: "x.webp", alt: "Shot" } }, "cover.alt"],
  ])("rejects %s", (_, change, path) => {
    expect(issues({ ...valid, ...change })).toContain(path);
  });
});

describe("parsePortfolioSeed", () => {
  it("throws on the first invalid item, naming it", () => {
    expect(() =>
      parsePortfolioSeed([valid, { ...valid, slug: "bad", liveUrl: "http://x.com" }]),
    ).toThrow(/"bad" is invalid[\s\S]*Links must start with https:\/\//);
  });

  it("throws on duplicate slugs", () => {
    expect(() => parsePortfolioSeed([valid, valid])).toThrow("slugs must be unique");
  });
});

describe("seed IDs (D5)", () => {
  it("are fixed and derived from the slug", () => {
    expect(seedItemId("hireflow-track")).toBe("seed_hireflow_track");
    expect(seedCoverId("hireflow-track")).toBe("seed_hireflow_track_cover");
    expect(seedCoverPublicId("hireflow-track")).toBe(
      "rhm/portfolio_item/seed_hireflow_track/cover",
    );
  });
});
