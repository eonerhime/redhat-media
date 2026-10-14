import { block } from "@/lib/content/block";

/**
 * Card-shaped outlines with no animation, and one labelled status for screen readers (Phase 10
 * spec, D5). With `filterBar`, a strip as tall as the filter bar comes first, so the listing does
 * not shift when it streams in (Phase 11 spec, D2).
 */
export async function PortfolioSkeleton({ filterBar = false }: { filterBar?: boolean }) {
  const label = await block("portfolio.loading");
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      {filterBar && <div aria-hidden="true" className="mb-8 h-[50px]" />}
      <ul aria-hidden="true" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <li
            key={index}
            className="aspect-[4/5] rounded-xl border border-t-4 border-line border-t-line"
          />
        ))}
      </ul>
    </div>
  );
}
