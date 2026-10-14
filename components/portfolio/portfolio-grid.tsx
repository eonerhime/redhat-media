import { block } from "@/lib/content/block";
import type { PortfolioCard as Card } from "@/lib/portfolio/read-core";
import type { PortfolioResult } from "@/lib/portfolio/read";
import { PortfolioCard } from "./portfolio-card";

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
 * The /portfolio listing in one of its three states (Phase 10 spec, D3).
 * `data-state` lets the e2e tests check which one rendered.
 */
export async function PortfolioListing({ result }: { result: PortfolioResult }) {
  const state = listingState(result);
  return (
    <div data-state={state} data-testid="portfolio-listing">
      {result.ok && state === "ready" ? (
        <PortfolioGrid cards={result.cards} headingLevel={2} preloadFirst />
      ) : (
        <p role="status" className="max-w-2xl text-lg text-muted">
          {await block(state === "empty" ? "portfolio.empty" : "portfolio.unavailable")}
        </p>
      )}
    </div>
  );
}
