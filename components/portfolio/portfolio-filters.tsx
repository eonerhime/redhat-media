import Link from "next/link";
import { block } from "@/lib/content/block";
import { filterHref, type PortfolioFilter } from "@/lib/portfolio/filters";
import { EditAround } from "@/components/cms/edit-button";

/**
 * The /portfolio filter bar (Phase 11 spec, D4): links, not ARIA tabs, because each one loads a
 * new URL. Only filters with published items are passed in. On phones the row scrolls inside
 * its own box; the padding keeps the focus ring clear of that box's clipping edge.
 */
export async function PortfolioFilters({
  filters,
  current,
}: {
  filters: readonly PortfolioFilter[];
  current: PortfolioFilter;
}) {
  const [label, ...names] = await Promise.all([
    block("portfolio.filter.label"),
    ...filters.map((filter) => block(filter.labelKey)),
  ]);
  return (
    <nav aria-label={label} className="-mx-1 mb-8 overflow-x-auto p-1">
      <ul className="flex gap-3">
        {filters.map((filter, index) => {
          const isCurrent = filter === current;
          return (
            <li key={filter.slug ?? "all"} className="shrink-0">
              {/* Current: fg on brand-deep (5.03:1); the others fg on ink with a line edge. The
                  ✎ sits on the chip's corner, inside the nav's padding: the next chip is 12px away. */}
              <EditAround blockKey={filter.labelKey} value={names[index]} corner>
                <Link
                  href={filterHref(filter)}
                  scroll={false}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`inline-block rounded-full border px-4 py-2 text-base font-semibold whitespace-nowrap ${
                    isCurrent
                      ? "border-brand-deep bg-brand-deep"
                      : "border-line hover:border-brand-deep"
                  }`}
                >
                  {names[index]}
                </Link>
              </EditAround>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
