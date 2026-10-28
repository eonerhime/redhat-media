import Link from "next/link";
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import { block } from "@/lib/content/block";
import { featuredCards } from "@/lib/portfolio/read-core";
import { getPublishedPortfolio } from "@/lib/portfolio/read";
import { EditButton } from "@/components/cms/edit-button";
import { Editable } from "@/components/cms/editable";

// The homepage's featured work: up to three featured, published items from the cached portfolio
// read, so the `featured` flags decide what shows and Phase 31's refresh updates it (Phase 23
// spec, D1, D3). It replaced the Phase 3 placeholder (Phase 3 spec, D5). With nothing featured, or
// when the read fails, it shows only the text and link, never an error (D2). Each card links to
// the full page; the portfolio modal lives under /portfolio only (D4).
export async function FeaturedWork() {
  const result = await getPublishedPortfolio();
  const cards = result.ok ? featuredCards(result.cards) : [];
  // "Will appear here" is true only without cards (owner, 2026-10-24).
  const bodyKey = cards.length > 0 ? "home.work.bodyLive" : "home.work.body";
  const [heading, body, link] = await Promise.all([
    block("home.work.heading"),
    block(bodyKey),
    block("home.work.link"),
  ]);
  return (
    <section aria-labelledby="work-heading" className="container-page py-16">
      <h2 id="work-heading" className="font-display text-display-2 font-extrabold">
        <Editable blockKey="home.work.heading" value={heading} />
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        <Editable blockKey={bodyKey} value={body} />
      </p>
      {cards.length > 0 && (
        <div className="mt-8" data-testid="featured-work">
          <PortfolioGrid cards={cards} headingLevel={3} />
        </div>
      )}
      <Link
        href="/portfolio"
        className="mt-6 inline-block font-semibold underline decoration-brand decoration-2 underline-offset-8"
      >
        {link}
      </Link>
      <EditButton blockKey="home.work.link" value={link} />
    </section>
  );
}
