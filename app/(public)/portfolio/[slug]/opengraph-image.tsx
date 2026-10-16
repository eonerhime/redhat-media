import { getPublishedPortfolio } from "@/lib/portfolio/read";
import { detailParams } from "@/lib/portfolio/read-core";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-card";
import { pngResponse, portfolioCardImage } from "@/lib/seo/og-images";
import { siteName } from "@/lib/site";

// The item's cover with its title and category, or the site card (Phase 14 spec, D3).
export const alt = siteName;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Prerendered with the pages they belong to (Phase 12 spec, D1).
export async function generateStaticParams() {
  return detailParams(await getPublishedPortfolio());
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  return pngResponse(await portfolioCardImage((await params).slug));
}
