// Portfolio reads (Phase 10 spec, D1). The client is a parameter, so
// read-core.db.test.ts runs these against the CI Postgres; read.ts wraps them in
// the cached, server-only read that pages use.

import type { ServiceCategory } from "@/content/services";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { VideoProvider } from "@/lib/generated/prisma/enums";
import { isRhmPublicId } from "@/lib/media/cloudinary";
import { parseVideoUrl, type ParsedVideo } from "@/lib/media/video-url";

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

/**
 * The homepage's featured work (Phase 23 spec, D1): featured items only, in portfolio order (the
 * order `cards` already has), at most `limit`. Empty when nothing is featured, and the section
 * then falls back to its text and link (D2).
 */
export function featuredCards(cards: readonly PortfolioCard[], limit = 3): PortfolioCard[] {
  return cards.filter((card) => card.featured).slice(0, limit);
}

// Detail reads (Phase 12 spec, D1, D2).

export type PortfolioImage = {
  kind: "image";
  id: string;
  publicId: string;
  alt: string;
  caption: string | null;
};

export type PortfolioVideo = {
  kind: "video";
  id: string;
  video: ParsedVideo;
  title: string | null;
  caption: string | null;
};

export type PortfolioMedia = PortfolioImage | PortfolioVideo;

/** What /portfolio/[slug] needs: plain values only, so the result can be cached. */
export type PortfolioDetail = CardRow & {
  description: string;
  client: string | null;
  credit: string | null;
  creditUrl: string | null;
  highlights: string[];
  repoUrl: string | null;
  /** YYYY-MM-DD, or null for an item published without a date. */
  publishedAt: string | null;
  /** The first valid image, which is also the card's cover. */
  hero: PortfolioImage | null;
  /** Every other valid image and video, in sortOrder. */
  gallery: PortfolioMedia[];
};

export type MediaRow = {
  id: string;
  kind: "IMAGE" | "VIDEO";
  cloudinaryId: string | null;
  alt: string | null;
  caption: string | null;
  title: string | null;
  videoProvider: VideoProvider | null;
  videoId: string | null;
  sortOrder: number;
};

const canonicalVideoUrl: Record<VideoProvider, (id: string) => string> = {
  YOUTUBE: (id) => `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
  VIMEO: (id) => `https://vimeo.com/${encodeURIComponent(id)}`,
};

const blankToNull = (value: string | null) => value?.trim() || null;

/** One media row as an image or video, or null when it is not safe to render (D2). */
function toMedia(row: MediaRow): PortfolioMedia | null {
  const caption = blankToNull(row.caption);
  if (row.kind === "IMAGE") {
    const publicId = row.cloudinaryId ?? "";
    const alt = row.alt?.trim() ?? "";
    if (!isRhmPublicId(publicId) || !alt) return null;
    return { kind: "image", id: row.id, publicId, alt, caption };
  }
  if (!row.videoProvider || !row.videoId) return null;
  // The Phase 8 parser decides which IDs are valid, so a stored ID is re-checked through it.
  const parsed = parseVideoUrl(canonicalVideoUrl[row.videoProvider](row.videoId));
  if (!parsed.ok || parsed.video.id !== row.videoId) return null;
  return { kind: "video", id: row.id, video: parsed.video, title: blankToNull(row.title), caption };
}

/** Splits an item's media into the hero and the gallery, skipping unsafe rows with a warning. */
export function toHeroAndGallery(
  itemId: string,
  rows: readonly MediaRow[],
  warn: (message: string) => void = console.warn,
): Pick<PortfolioDetail, "hero" | "gallery"> {
  let hero: PortfolioImage | null = null;
  const gallery: PortfolioMedia[] = [];
  for (const row of rows.toSorted((a, b) => a.sortOrder - b.sortOrder)) {
    const media = toMedia(row);
    if (!media) {
      warn(`[portfolio] skipped media ${row.id} of ${itemId}: not a safe image or video`);
    } else if (!hero && media.kind === "image") {
      hero = media;
    } else {
      gallery.push(media);
    }
  }
  return { hero, gallery };
}

/** The published item with `slug` and all its media, or null when there is none (D2). */
export async function fetchPortfolioItem(
  db: PortfolioDb,
  slug: string,
): Promise<PortfolioDetail | null> {
  const item = await db.portfolioItem.findFirst({
    where: { slug, published: true },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      summary: true,
      techStack: true,
      liveUrl: true,
      featured: true,
      description: true,
      client: true,
      credit: true,
      creditUrl: true,
      highlights: true,
      repoUrl: true,
      publishedAt: true,
    },
  });
  if (!item) return null;

  const media = await db.mediaItem.findMany({
    where: { ownerType: "PORTFOLIO_ITEM", ownerId: item.id },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      kind: true,
      cloudinaryId: true,
      alt: true,
      caption: true,
      title: true,
      videoProvider: true,
      videoId: true,
      sortOrder: true,
    },
  });
  const { publishedAt, ...rest } = item;
  return {
    ...rest,
    publishedAt: publishedAt ? publishedAt.toISOString().slice(0, 10) : null,
    ...toHeroAndGallery(item.id, media),
  };
}

/** Placeholder for a build with no published items; the slug pattern rejects underscores. */
export const NO_SLUG = "__none__";

/**
 * generateStaticParams for /portfolio/[slug] (D1): every published slug, or one placeholder that
 * 404s when there are none or the read failed, because Cache Components rejects an empty list.
 */
export function detailParams(
  result: { ok: true; cards: readonly Pick<PortfolioCard, "slug">[] } | { ok: false },
): { slug: string }[] {
  const slugs = result.ok ? result.cards.map((card) => ({ slug: card.slug })) : [];
  return slugs.length > 0 ? slugs : [{ slug: NO_SLUG }];
}
