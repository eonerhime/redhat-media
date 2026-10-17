import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testPrisma } from "@/lib/db/test-client";
import { runSeed } from "@/lib/db/seed";
import { seedCoverPublicId } from "@/lib/portfolio/schema";
import { portfolioSeed } from "@/prisma/seed-data/portfolio";
import { fetchPortfolioItem, fetchPublishedPortfolio } from "./read-core";

// The portfolio reads against a real Postgres (Phase 10 spec, D1, D10; Phase 12 spec, D2). The
// seed runs as rhm_migrator; the read runs as rhm_app, the runtime role.

const migrator = testPrisma("migrator");
const app = testPrisma("app");
const DRAFT_ID = "test_read_draft";
const VIDEO_ID = "test_read_video";
const firstSeedId = "seed_sportspred";

beforeAll(async () => {
  await runSeed(migrator, portfolioSeed);
  await migrator.portfolioItem.upsert({
    where: { id: DRAFT_ID },
    create: {
      id: DRAFT_ID,
      slug: "test-read-draft",
      title: "Draft",
      category: "WEB_APP",
      summary: "Not published.",
      description: "Not published.",
      sortOrder: -1,
    },
    update: {},
  });
  // A video sorted before the cover must not become the cover.
  await migrator.mediaItem.upsert({
    where: { id: VIDEO_ID },
    create: {
      id: VIDEO_ID,
      ownerType: "PORTFOLIO_ITEM",
      ownerId: firstSeedId,
      kind: "VIDEO",
      videoProvider: "YOUTUBE",
      videoId: "aqz-KE-bpKQ",
      videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      sortOrder: -1,
    },
    update: {},
  });
});

afterAll(async () => {
  await migrator.mediaItem.delete({ where: { id: VIDEO_ID } });
  await migrator.portfolioItem.delete({ where: { id: DRAFT_ID } });
  await Promise.all([migrator.$disconnect(), app.$disconnect()]);
});

describe("fetchPublishedPortfolio", () => {
  it("returns the seeded items in order, each with its image cover, and no draft", async () => {
    const cards = await fetchPublishedPortfolio(app);
    const seeded = cards.filter((card) => card.id.startsWith("seed_"));

    expect(cards.map((card) => card.id)).not.toContain(DRAFT_ID);
    expect(seeded.map((card) => card.slug)).toEqual(portfolioSeed.map((item) => item.slug));
    for (const [index, card] of seeded.entries()) {
      const item = portfolioSeed[index]!;
      expect(card.cover).toEqual({ publicId: seedCoverPublicId(item.slug), alt: item.cover.alt });
      expect(card.techStack).toEqual(item.techStack);
      expect(card.featured).toBe(item.featured);
    }
  });
});

describe("fetchPortfolioItem", () => {
  it("returns a published item with its detail fields, hero and gallery", async () => {
    const item = await fetchPortfolioItem(app, "sportspred");
    const seed = portfolioSeed[0]!;

    expect(item).toMatchObject({
      id: firstSeedId,
      title: seed.title,
      description: seed.description,
      highlights: seed.highlights,
      credit: seed.credit,
      creditUrl: "https://emo-onerhime.vercel.app/",
      repoUrl: null,
      client: null,
      publishedAt: "2026-10-13",
    });
    // The video sorts first but is not an image, so the cover stays the hero.
    expect(item?.hero).toMatchObject({ publicId: seedCoverPublicId("sportspred") });
    expect(item?.gallery.map((media) => media.id)).toEqual([VIDEO_ID]);
  });

  it("keeps each item's media to itself", async () => {
    const item = await fetchPortfolioItem(app, "hireflow-track");
    expect(item?.repoUrl).toBe("https://github.com/eonerhime/hireflow-track");
    expect(item?.hero).toMatchObject({ publicId: seedCoverPublicId("hireflow-track") });
    expect(item?.gallery).toEqual([]);
  });

  it("returns null for a draft or an unknown slug", async () => {
    expect(await fetchPortfolioItem(app, "test-read-draft")).toBeNull();
    expect(await fetchPortfolioItem(app, "no-such-item")).toBeNull();
  });
});
