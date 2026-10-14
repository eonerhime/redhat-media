// Portfolio reads (Phase 10 spec, D1). The client is a parameter, so
// read-core.db.test.ts runs these against the CI Postgres; read.ts wraps them in
// the cached, server-only read that pages use.

import type { ServiceCategory } from "@/content/services";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { isRhmPublicId } from "@/lib/media/cloudinary";

export type PortfolioCover = { publicId: string; alt: string };

/** What a card needs: strings and arrays only, so the result can be cached. */
export type PortfolioCard = {
  id: string;
  slug: string;
  title: string;
  category: ServiceCategory;
  summary: string;
  techStack: string[];
  liveUrl: string | null;
  featured: boolean;
  cover: PortfolioCover | null;
};

export type CardRow = Omit<PortfolioCard, "cover">;

export type CoverRow = {
  ownerId: string;
  cloudinaryId: string | null;
  alt: string | null;
  sortOrder: number;
};

type PortfolioDb = Pick<PrismaClient, "portfolioItem" | "mediaItem">;

/** Every published item in display order (D7), each with its cover. */
export async function fetchPublishedPortfolio(db: PortfolioDb): Promise<PortfolioCard[]> {
  const items = await db.portfolioItem.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      summary: true,
      techStack: true,
      liveUrl: true,
      featured: true,
    },
  });
  if (items.length === 0) return [];

  const media = await db.mediaItem.findMany({
    where: {
      ownerType: "PORTFOLIO_ITEM",
      ownerId: { in: items.map((item) => item.id) },
      kind: "IMAGE",
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { ownerId: true, cloudinaryId: true, alt: true, sortOrder: true },
  });
  return toCards(items, media);
}

/**
 * Pairs each item with its cover, keeping the item order. The cover is the
 * lowest-sortOrder image with an rhm/ public ID and alt text; <MediaImage>
 * throws on any other ID, and every image needs alt text (rule 10).
 */
export function toCards(
  items: readonly CardRow[],
  media: readonly CoverRow[],
  warn: (message: string) => void = console.warn,
): PortfolioCard[] {
  return items.map((item) => {
    const images = media
      .filter((row) => row.ownerId === item.id)
      .toSorted((a, b) => a.sortOrder - b.sortOrder);
    let cover: PortfolioCover | null = null;
    for (const image of images) {
      const publicId = image.cloudinaryId ?? "";
      const alt = image.alt?.trim() ?? "";
      if (isRhmPublicId(publicId) && alt) {
        cover = { publicId, alt };
        break;
      }
      warn(`[portfolio] skipped an image of ${item.id}: needs an rhm/ public ID and alt text`);
    }
    return { ...item, cover };
  });
}

/** A service page's related work (D8): this category only, featured first, at most `limit`. */
export function relatedTo(
  cards: readonly PortfolioCard[],
  category: ServiceCategory,
  limit = 3,
): PortfolioCard[] {
  return cards
    .filter((card) => card.category === category)
    .toSorted((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, limit);
}
