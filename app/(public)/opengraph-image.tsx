import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-card";
import { pngResponse, siteCardImage } from "@/lib/seo/og-images";
import { siteName } from "@/lib/site";

// The site card, used by every public page without its own (Phase 14 spec, D3).
export const alt = siteName;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return pngResponse(await siteCardImage());
}
