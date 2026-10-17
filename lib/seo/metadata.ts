// One shape for every public page's metadata (Phase 14 spec, D1, D2). Next merges `openGraph`
// shallowly, so a page that set only some fields would drop the rest; going through this helper
// means no page can forget one. URLs are relative to `metadataBase` (the root layout), so a
// preview never claims the production origin.

import type { Metadata } from "next";
import { siteName } from "@/lib/site";

export type PageMetadataInput = {
  title: string;
  description: string;
  /** The page's own path, without a query string, e.g. "/services". */
  path: string;
  /**
   * Whether to send a canonical URL (default true). /portfolio sends none, so its filtered views
   * stay indexable (Architectural rules 2) while its metadata ignores searchParams (D2).
   */
  canonical?: boolean;
};

export function pageMetadata({
  title,
  description,
  path,
  canonical = true,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical: path } } : {}),
    openGraph: {
      title,
      description,
      url: path,
      siteName,
      type: "website",
      locale: "en_NG",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** A page that must stay out of the index (unavailable state): no canonical (D2). */
export function noindexMetadata(title: string): Metadata {
  return { title, robots: { index: false } };
}
