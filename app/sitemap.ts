import type { MetadataRoute } from "next";
import { visibleServices } from "@/lib/content/services";
import { env } from "@/lib/env";
import { getPublishedPortfolio } from "@/lib/portfolio/read";
import { sitemapEntries } from "@/lib/seo/sitemap";

// Visible services and published items only (Phase 14 spec, D4). Both reads are the cached ones
// the pages use, so a newly published item appears when the `portfolio` tag refreshes.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [visible, portfolio] = await Promise.all([visibleServices(), getPublishedPortfolio()]);
  return sitemapEntries({
    siteUrl: env.siteUrl,
    serviceSlugs: visible.map((service) => service.slug),
    portfolioSlugs: portfolio.ok ? portfolio.cards.map((card) => card.slug) : [],
  });
}
