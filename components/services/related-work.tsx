import Link from "next/link";
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import type { ServiceCategory } from "@/content/services";
import { block } from "@/lib/content/block";
import { filterForCategory, filterHref } from "@/lib/portfolio/filters";
import { relatedTo } from "@/lib/portfolio/read-core";
import { getPublishedPortfolio } from "@/lib/portfolio/read";
import { Editable } from "@/components/cms/editable";
import { EditButton } from "@/components/cms/edit-button";

// The service page's related-work slot (Phase 5 spec, D6; filled by Phase 10 spec, D8): up to three
// published items in this category, featured first. It renders nothing when the category has none
// or the read failed, so a service page never shows placeholder work or breaks.
export async function RelatedWork({ category }: { category: ServiceCategory }) {
  const result = await getPublishedPortfolio();
  const cards = result.ok ? relatedTo(result.cards, category) : [];
  if (cards.length === 0) return null;

  const [heading, link] = await Promise.all([
    block("services.detail.work.heading"),
    block("services.detail.work.link"),
  ]);
  return (
    <section aria-labelledby="work-heading" className="container-page border-t border-line py-16">
      <h2 id="work-heading" className="font-display text-display-2 font-extrabold">
        <Editable blockKey="services.detail.work.heading" value={heading} />
      </h2>
      <div className="mt-8">
        <PortfolioGrid cards={cards} headingLevel={3} />
      </div>
      {/* The filtered view of this category; it has items, so its filter is shown (Phase 11 spec, D7). */}
      <Link
        href={filterHref(filterForCategory(category))}
        className="mt-8 inline-block font-semibold underline decoration-brand decoration-2 underline-offset-8"
      >
        {link}
      </Link>
      <EditButton blockKey="services.detail.work.link" value={link} />
    </section>
  );
}
