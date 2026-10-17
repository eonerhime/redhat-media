// The /portfolio category filters (Phase 11 spec, D1, D3). Pure, so the page, related work and
// the e2e tests share one table of slugs, labels and categories.

import type { ServiceCategory } from "@/content/services";
import type { BlockKey } from "@/lib/content/block";
import type { PortfolioCard } from "./read-core";

export type PortfolioFilter = {
  /** The `?category=` value; `null` is All, which has no parameter. */
  slug: string | null;
  labelKey: BlockKey;
  /** Empty for All, which matches every category. */
  categories: readonly ServiceCategory[];
};

/** In display order. Every category belongs to exactly one filter besides All (D1). */
export const portfolioFilters = [
  { slug: null, labelKey: "portfolio.filter.all", categories: [] },
  { slug: "web-apps", labelKey: "portfolio.filter.webApps", categories: ["WEB_APP"] },
  { slug: "photography", labelKey: "portfolio.filter.photography", categories: ["PHOTOGRAPHY"] },
  { slug: "videography", labelKey: "portfolio.filter.videography", categories: ["VIDEOGRAPHY"] },
  {
    slug: "marketing",
    labelKey: "portfolio.filter.marketing",
    categories: ["DIGITAL_MARKETING", "SOCIAL_MEDIA", "ONLINE_PRESENCE"],
  },
] as const satisfies readonly PortfolioFilter[];

export const ALL: PortfolioFilter = portfolioFilters[0];

const matches = (filter: PortfolioFilter, card: Pick<PortfolioCard, "category">) =>
  filter.slug === null || filter.categories.includes(card.category);

/** One exact slug, or All for anything else: missing, unknown, repeated or wrongly cased (D3). */
export function parseFilter(value: string | string[] | undefined): PortfolioFilter {
  if (typeof value !== "string") return ALL;
  return portfolioFilters.find((filter) => filter.slug === value) ?? ALL;
}

/** All, plus every filter with at least one card, in display order (D3). */
export function visibleFilters(
  cards: readonly Pick<PortfolioCard, "category">[],
): PortfolioFilter[] {
  return portfolioFilters.filter(
    (filter) => filter.slug === null || cards.some((card) => matches(filter, card)),
  );
}

/** The filter's cards, in the order given. */
export function applyFilter<T extends Pick<PortfolioCard, "category">>(
  cards: readonly T[],
  filter: PortfolioFilter,
): T[] {
  return cards.filter((card) => matches(filter, card));
}

export function filterHref(filter: PortfolioFilter): string {
  return filter.slug === null ? "/portfolio" : `/portfolio?category=${filter.slug}`;
}

/** The one non-All filter that holds this category. */
export function filterForCategory(category: ServiceCategory): PortfolioFilter {
  const filter = portfolioFilters.find((f) =>
    (f.categories as readonly string[]).includes(category),
  );
  if (!filter) throw new Error(`[portfolio] no filter holds ${category}`);
  return filter;
}

/**
 * What /portfolio shows for a requested filter: the bar's filters and the current one. A filter
 * with no cards is not in the bar, so a stale link to it shows All (D3).
 */
export function resolveFilter(
  cards: readonly Pick<PortfolioCard, "category">[],
  requested: PortfolioFilter,
): { filters: PortfolioFilter[]; current: PortfolioFilter } {
  const filters = visibleFilters(cards);
  return { filters, current: filters.includes(requested) ? requested : ALL };
}
