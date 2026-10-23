import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPortfolioItem, getPublishedPortfolio } from "@/lib/portfolio/read";
import { detailParams } from "@/lib/portfolio/read-core";
import { SLUG } from "@/lib/portfolio/schema";
import { noindexMetadata, pageMetadata } from "@/lib/seo/metadata";
import { siteName } from "@/lib/site";

// What /portfolio/[slug] and its intercepted modal route share (Phase 22 spec, D9): the static
// params, the slug check, the cached read and the metadata. Neither route adds a query.

type ItemParams = Promise<{ slug: string }>;

// Every published slug is prerendered. With no database (the CI build) or no published item there
// is one placeholder that 404s, because Cache Components rejects an empty list. A slug published
// later renders on its first request and is then cached (Phase 12 spec, D1).
export async function itemStaticParams() {
  return detailParams(await getPublishedPortfolio());
}

// A slug the seed and CMS could never write is a 404 without a database read, so junk URLs cannot
// fill the cache. `null` means the read failed (the unavailable state, Phase 12 spec, D3).
export async function readItem(params: ItemParams) {
  const { slug } = await params;
  if (slug.length > 60 || !SLUG.test(slug)) notFound();
  const result = await getPortfolioItem(slug);
  if (result.ok && !result.item) notFound();
  return result.ok ? result.item : null;
}

export async function itemMetadata(params: ItemParams): Promise<Metadata> {
  const item = await readItem(params);
  if (!item) {
    // Unavailable (D3): keep the page out of the index until the read heals.
    return noindexMetadata(`Portfolio | ${siteName}`);
  }
  return pageMetadata({
    title: `${item.title} | ${siteName}`,
    description: item.summary,
    path: `/portfolio/${item.slug}`,
  });
}
