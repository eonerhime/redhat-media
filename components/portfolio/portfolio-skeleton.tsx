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

/**
 * Shown while an item streams (Phase 12 spec, D3): outlines of the heading and hero with no
 * animation, and one labelled status. In the modal (Phase 22 spec, D8) the label names the dialog
 * and there is no back link to outline.
 */
export async function PortfolioDetailSkeleton({ labelId }: { labelId?: string }) {
  const label = await block("portfolio.detail.loading");
  const modal = labelId !== undefined;
  return (
    <div
      role="status"
      className={`container-page pb-12 ${modal ? "pt-8 md:pt-12" : "pt-16 md:pt-24"}`}
    >
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <div aria-hidden="true">
        {modal ? null : <div className="mb-12 h-6 w-28 rounded border border-line" />}
        <div className="h-16 max-w-xl rounded border border-line" />
        <div className="mt-6 h-6 max-w-md rounded border border-line" />
        <div className="mt-10 aspect-[16/10] rounded-xl border border-line" />
      </div>
    </div>
  );
}
