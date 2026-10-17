import { block } from "@/lib/content/block";
import { ALL, applyFilter, resolveFilter, type PortfolioFilter } from "@/lib/portfolio/filters";
import type { PortfolioCard as Card } from "@/lib/portfolio/read-core";
import type { PortfolioResult } from "@/lib/portfolio/read";
import { PortfolioCard } from "./portfolio-card";
import { PortfolioFilters } from "./portfolio-filters";

export type ListingState = "ready" | "empty" | "unavailable";

export function listingState(result: PortfolioResult): ListingState {
  if (!result.ok) return "unavailable";
  return result.cards.length === 0 ? "empty" : "ready";
}

/** One, two or three cards to a row, as on /services (Phase 4 spec, D1). */
export function PortfolioGrid({
  cards,
  headingLevel,
  preloadFirst = false,
}: {
  cards: readonly Card[];
  headingLevel: 2 | 3;
  preloadFirst?: boolean;
}) {
  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <li key={card.id}>
          <PortfolioCard
            card={card}
            headingLevel={headingLevel}
            preload={preloadFirst && index === 0}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * The /portfolio listing in one of its three states (Phase 10 spec, D3), filtered by `filter`
 * (Phase 11 spec, D3, D5). Only the ready state has the filter bar, and a filter with no cards
 * shows All. `data-state` and `data-filter` let the e2e tests check what rendered.
 */
export async function PortfolioListing({
  result,
  filter = ALL,
}: {
  result: PortfolioResult;
  filter?: PortfolioFilter;
}) {
  const state = listingState(result);
  if (!result.ok || state !== "ready") {
    return (
      <div data-state={state} data-testid="portfolio-listing">
        <p role="status" className="max-w-2xl text-lg text-muted">
          {await block(state === "empty" ? "portfolio.empty" : "portfolio.unavailable")}
        </p>
      </div>
    );
  }
  const { filters, current } = resolveFilter(result.cards, filter);
  return (
    <div data-state={state} data-filter={current.slug ?? "all"} data-testid="portfolio-listing">
      {filters.length > 1 && <PortfolioFilters filters={filters} current={current} />}
      <PortfolioGrid cards={applyFilter(result.cards, current)} headingLevel={2} preloadFirst />
    </div>
  );
}
