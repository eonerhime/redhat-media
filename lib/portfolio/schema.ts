// Field rules for portfolio content (Phase 9 spec, D3). The seed validates
// every item with these before writing; Phase 31's updateRecordField reuses them.
// Relative imports only: prisma/seed.mts runs this file under plain Node.

import { z } from "zod";
import { httpsUrlSchema } from "../validation/https-url.ts";

const text = (min: number, max: number) => z.string().trim().min(min).max(max);

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const repoUrlSchema = httpsUrlSchema.refine(
  (url) => new URL(url).hostname === "github.com",
  "Repository links must point to github.com.",
);

export const coverSchema = z.object({
  /** File name inside the upload script's source folder (D6). */
  source: z.string().regex(/^[A-Za-z0-9._-]+\.(webp|png|jpe?g|avif)$/i, "Unsupported image file."),
  alt: text(10, 200),
});

export const portfolioSeedItemSchema = z.object({
  slug: z.string().max(60).regex(SLUG, "Use lower-case words joined by hyphens."),
  title: text(1, 80),
  category: z.literal("WEB_APP"),
  summary: text(1, 200),
  description: text(1, 1200),
  credit: text(1, 120).optional(),
  /** Links the credit, e.g. to the technical lead's portfolio (Phase 12 spec, D8). */
  creditUrl: httpsUrlSchema.optional(),
  highlights: z.array(text(1, 160)).min(3).max(6),
  techStack: z.array(text(1, 40)).min(1).max(10),
  liveUrl: httpsUrlSchema,
  repoUrl: repoUrlSchema.optional(),
  featured: z.boolean(),
  publishedAt: z.iso.date(),
  cover: coverSchema,
});

export type PortfolioSeedItem = z.input<typeof portfolioSeedItemSchema>;
export type ParsedPortfolioSeedItem = z.output<typeof portfolioSeedItemSchema>;

/** Parses every item and checks slugs are unique; throws before anything is written. */
export function parsePortfolioSeed(items: readonly PortfolioSeedItem[]): ParsedPortfolioSeedItem[] {
  const parsed = items.map((item, index) => {
    const result = portfolioSeedItemSchema.safeParse(item);
    if (!result.success) {
      const where = item.slug ? `"${item.slug}"` : `#${index + 1}`;
      throw new Error(`Portfolio seed item ${where} is invalid:\n${z.prettifyError(result.error)}`);
    }
    return result.data;
  });
  const slugs = new Set(parsed.map((item) => item.slug));
  if (slugs.size !== parsed.length) throw new Error("Portfolio seed slugs must be unique.");
  return parsed;
}

/** Fixed IDs make the seed an upsert (D5). */
export function seedItemId(slug: string): string {
  return `seed_${slug.replaceAll("-", "_")}`;
}

export function seedCoverId(slug: string): string {
  return `${seedItemId(slug)}_cover`;
}

/** rhm/{ownerType}/{ownerId}/cover, the folder Phase 28 checks (D5). */
export function seedCoverPublicId(slug: string): string {
  return `rhm/portfolio_item/${seedItemId(slug)}/cover`;
}
