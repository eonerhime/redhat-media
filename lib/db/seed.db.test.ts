import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { isRhmPublicId } from "@/lib/media/cloudinary";
import { seedItemId } from "@/lib/portfolio/schema";
import { portfolioSeed } from "@/prisma/seed-data/portfolio";
import { runSeed } from "./seed";
import { testPrisma } from "./test-client";

// Portfolio seed (Phase 9 spec, D7, D9). Roadmap "Done when": `pnpm db:seed`
// loads the approved items with their media. It runs as rhm_migrator, like
// prisma/seed.mts.

const db = testPrisma("migrator");
const seedIds = portfolioSeed.map((item) => seedItemId(item.slug));
const OTHER_ID = "test_not_seeded";

beforeAll(async () => {
  await db.portfolioItem.upsert({
    where: { id: OTHER_ID },
    create: {
      id: OTHER_ID,
      slug: "test-not-seeded",
      title: "Not seeded",
      category: "PHOTOGRAPHY",
      summary: "Created outside the seed.",
      description: "Created outside the seed.",
      sortOrder: 99,
    },
    update: {},
  });
});

afterAll(async () => {
  await db.portfolioItem.delete({ where: { id: OTHER_ID } });
  await db.$disconnect();
});

describe("runSeed", () => {
  it("is idempotent: a second run creates nothing", async () => {
    await runSeed(db, portfolioSeed);
    const second = await runSeed(db, portfolioSeed);
    expect(second).toEqual({ created: 0, updated: 5, covers: 5 });
  });

  it("loads five published items in the approved order, with https links", async () => {
    const items = await db.portfolioItem.findMany({
      where: { id: { in: seedIds } },
      orderBy: { sortOrder: "asc" },
    });
    expect(items.map((item) => item.slug)).toEqual(portfolioSeed.map((item) => item.slug));
    for (const item of items) {
      expect(item.published).toBe(true);
      expect(item.publishedAt).toEqual(new Date("2026-10-13T00:00:00Z"));
      expect(item.liveUrl).toMatch(/^https:\/\//);
      if (item.repoUrl) expect(item.repoUrl).toMatch(/^https:\/\/github\.com\//);
    }
  });

  it("gives each item exactly one cover with an rhm/ public ID and alt text", async () => {
    const covers = await db.mediaItem.findMany({
      where: { ownerType: "PORTFOLIO_ITEM", ownerId: { in: seedIds } },
    });
    expect(covers).toHaveLength(5);
    expect(new Set(covers.map((cover) => cover.ownerId))).toEqual(new Set(seedIds));
    for (const cover of covers) {
      expect(cover.kind).toBe("IMAGE");
      expect(isRhmPublicId(cover.cloudinaryId ?? "")).toBe(true);
      expect(cover.cloudinaryId).toBe(`rhm/portfolio_item/${cover.ownerId}/cover`);
      expect(cover.alt?.length).toBeGreaterThanOrEqual(10);
    }
  });

  it("leaves rows it did not create untouched", async () => {
    const other = await db.portfolioItem.findUniqueOrThrow({ where: { id: OTHER_ID } });
    expect(other).toMatchObject({ title: "Not seeded", published: false, sortOrder: 99 });
  });

  it("writes nothing when the content is invalid", async () => {
    const before = await db.portfolioItem.count();
    const bad = [
      ...portfolioSeed,
      { ...portfolioSeed[0], slug: "bad-item", liveUrl: "http://x.com" },
    ];
    await expect(runSeed(db, bad)).rejects.toThrow('"bad-item" is invalid');
    expect(await db.portfolioItem.count()).toBe(before);
  });
});
