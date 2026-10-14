import { block } from "@/lib/content/block";

// Shown only while a fresh render streams; the page itself is prerendered (Phase 10 spec, D5).
// Card-shaped outlines with no animation, and one labelled status for screen readers.
export default async function PortfolioLoading() {
  const label = await block("portfolio.loading");
  return (
    <div className="container-page py-16 md:py-24">
      <div role="status">
        <span className="sr-only">{label}</span>
        <ul aria-hidden="true" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <li
              key={index}
              className="aspect-[4/5] rounded-xl border border-t-4 border-line border-t-line"
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
