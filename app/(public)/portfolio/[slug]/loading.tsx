import { block } from "@/lib/content/block";

// Shown while a navigation to a detail page streams (Phase 12 spec, D3): outlines of the
// heading and hero with no animation, and one labelled status, like the grid's skeleton.
export default async function PortfolioItemLoading() {
  const label = await block("portfolio.detail.loading");
  return (
    <div role="status" className="container-page pt-16 pb-12 md:pt-24">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        <div className="h-6 w-28 rounded border border-line" />
        <div className="mt-12 h-16 max-w-xl rounded border border-line" />
        <div className="mt-6 h-6 max-w-md rounded border border-line" />
        <div className="mt-10 aspect-[16/10] rounded-xl border border-line" />
      </div>
    </div>
  );
}
