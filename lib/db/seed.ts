// Portfolio seed runner (Phase 9 spec, D7). It takes the client as a parameter
// so seed.db.test.ts can call it directly; prisma/seed.mts is the CLI.
// Relative imports only: it runs under plain Node.

import type { PrismaClient } from "../generated/prisma/client.ts";
import {
  parsePortfolioSeed,
  seedCoverId,
  seedCoverPublicId,
  seedItemId,
  type PortfolioSeedItem,
} from "../portfolio/schema.ts";

export type SeedResult = { created: number; updated: number; covers: number };

/**
 * Upserts each item and its cover by fixed ID, in one transaction. Content is
 * validated first, so invalid content writes nothing. Rows the seed did not
 * create are never touched.
 */
export async function runSeed(
  db: PrismaClient,
  items: readonly PortfolioSeedItem[],
): Promise<SeedResult> {
  const parsed = parsePortfolioSeed(items);

  return db.$transaction(async (tx) => {
    const result: SeedResult = { created: 0, updated: 0, covers: 0 };

    for (const [index, item] of parsed.entries()) {
      const id = seedItemId(item.slug);
      const data = {
        slug: item.slug,
        title: item.title,
        category: item.category,
        summary: item.summary,
        description: item.description,
        credit: item.credit ?? null,
        highlights: item.highlights,
        techStack: item.techStack,
        liveUrl: item.liveUrl,
        repoUrl: item.repoUrl ?? null,
        featured: item.featured,
        published: true,
        publishedAt: new Date(`${item.publishedAt}T00:00:00Z`),
        sortOrder: index,
      };

      const existing = await tx.portfolioItem.findUnique({ where: { id }, select: { id: true } });
      await tx.portfolioItem.upsert({ where: { id }, create: { id, ...data }, update: data });
      result[existing ? "updated" : "created"] += 1;

      const coverId = seedCoverId(item.slug);
      const cover = {
        ownerType: "PORTFOLIO_ITEM" as const,
        ownerId: id,
        kind: "IMAGE" as const,
        cloudinaryId: seedCoverPublicId(item.slug),
        alt: item.cover.alt,
        sortOrder: 0,
      };
      await tx.mediaItem.upsert({
        where: { id: coverId },
        create: { id: coverId, ...cover },
        update: cover,
      });
      result.covers += 1;
    }

    return result;
  });
}
