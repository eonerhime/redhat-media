import { allServiceSlugs } from "@/lib/content/services";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-card";
import { pngResponse, serviceCardImage } from "@/lib/seo/og-images";
import { siteName } from "@/lib/site";

// A card per visible service; a muted or unknown slug gets the site card (Phase 14 spec, D3).
export const alt = siteName;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Prerendered with the pages they belong to (Phase 5 spec, D1).
export function generateStaticParams() {
  return allServiceSlugs().map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  return pngResponse(await serviceCardImage((await params).slug));
}
