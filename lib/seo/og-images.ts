// The share card for each route, cached so the image routes are prerendered with their pages
// (Phase 14 spec, D3). Fallbacks are the site card: a muted or unknown service, an unknown slug,
// a failed read, an item with no cover, or a failed cover fetch.

import { cacheLife, cacheTag } from "next/cache";
import { block } from "@/lib/content/block";
import { pillarOf, serviceByCategory, visibleServiceBySlug } from "@/lib/content/services";
import { env } from "@/lib/env";
import { ogCoverUrl } from "@/lib/media/cloudinary";
import { getPortfolioItem, PORTFOLIO_TAG } from "@/lib/portfolio/read";
import { SLUG } from "@/lib/portfolio/schema";
import { OG_CONTENT_TYPE, portfolioCard, serviceCard, siteCard } from "@/lib/seo/og-card";
import { contact } from "@/lib/site";

export function pngResponse(bytes: Uint8Array): Response {
  return new Response(new Blob([bytes as Uint8Array<ArrayBuffer>]), {
    headers: { "Content-Type": OG_CONTENT_TYPE },
  });
}

async function siteImage(): Promise<Uint8Array> {
  return siteCard({ tagline: await block("home.hero.tagline"), location: contact.location });
}

export async function siteCardImage(): Promise<Uint8Array> {
  "use cache";
  cacheLife("hours");
  return siteImage();
}

export async function serviceCardImage(slug: string): Promise<Uint8Array> {
  "use cache";
  cacheLife("hours");
  const service = await visibleServiceBySlug(slug);
  if (!service) return siteImage();
  const [pillar, name, summary] = await Promise.all([
    block(pillarOf(service).nameKey),
    block(service.nameKey),
    block(service.summaryKey),
  ]);
  return serviceCard({ pillar, name, summary });
}

export async function portfolioCardImage(slug: string): Promise<Uint8Array> {
  "use cache";
  cacheTag(PORTFOLIO_TAG);
  // A slug the seed and CMS could never write gets the site card without a database read.
  const result = slug.length <= 60 && SLUG.test(slug) ? await getPortfolioItem(slug) : null;
  const item = result?.ok ? result.item : null;
  const cloudName = env.cloudinaryCloudName;
  const cover = item?.hero && cloudName ? await fetchCover(cloudName, item.hero.publicId) : null;
  if (!item || !cover) {
    // A failed read or fetch heals within minutes, as the portfolio reads do (Phase 12 spec, D3).
    const failed = (result !== null && !result.ok) || (item?.hero && cloudName && !cover);
    if (failed) cacheLife("minutes");
    else cacheLife("hours");
    return siteImage();
  }
  cacheLife("hours");
  const category = await block(serviceByCategory(item.category).nameKey);
  return portfolioCard({ cover, title: item.title, category });
}

// The URL is built from the stored rhm/ public ID on res.cloudinary.com, never a stored URL, so
// this adds no SSRF surface (tech-stack.md → Security baseline).
async function fetchCover(cloudName: string, publicId: string): Promise<string | null> {
  try {
    const res = await fetch(ogCoverUrl(cloudName, publicId));
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}
