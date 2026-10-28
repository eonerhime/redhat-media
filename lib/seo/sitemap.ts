// sitemap.xml and robots.txt content (Phase 14 spec, D4, D5). Pure, so the rules are unit-tested;
// app/sitemap.ts and app/robots.ts supply the data.

import type { MetadataRoute } from "next";

export type SitemapInput = {
  /** Canonical origin without a trailing slash (lib/env.ts). */
  siteUrl: string;
  /** Visible services only (Architectural rules 3). */
  serviceSlugs: readonly string[];
  /** Published items; empty when the read failed, so the other pages are still listed. */
  portfolioSlugs: readonly string[];
};

// No /dev/*, /admin, filtered views or muted services. No lastModified: no stored date says when a
// page last changed, and publishedAt is not that (implementation log, 2026-10-15).
export function sitemapEntries({
  siteUrl,
  serviceSlugs,
  portfolioSlugs,
}: SitemapInput): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/services",
    ...serviceSlugs.map((slug) => `/services/${slug}`),
    "/about",
    "/portfolio",
    ...portfolioSlugs.map((slug) => `/portfolio/${slug}`),
    "/contact",
    // The privacy notice, public even while the inquiry form is off (Phase 18 spec, D11).
    "/privacy",
  ];
  return paths.map((path) => ({ url: `${siteUrl}${path === "/" ? "" : path}` }));
}

// No Disallow lines: listing /admin would advertise it (Architectural rules 6), and /dev/* already
// 404s in production with noindex.
export function robotsRules(siteUrl: string): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
