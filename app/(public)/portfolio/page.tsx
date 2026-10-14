import type { Metadata } from "next";
import { PortfolioListing } from "@/components/portfolio/portfolio-grid";
import { Cta } from "@/components/shared/cta";
import { block } from "@/lib/content/block";
import { getPublishedPortfolio } from "@/lib/portfolio/read";
import { siteName } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const description = await block("portfolio.meta.description");
  return { title: `Portfolio | ${siteName}`, description };
}

// Every published item, prerendered from one cached read (Phase 10 spec, D2, D3). An unreachable
// database gives the unavailable state rather than a failed build.
export default async function PortfolioPage() {
  const [heading, intro, result] = await Promise.all([
    block("portfolio.heading"),
    block("portfolio.intro"),
    getPublishedPortfolio(),
  ]);
  return (
    <>
      <section className="container-page pt-16 pb-12 md:pt-24">
        <h1 className="max-w-4xl font-display text-display-1 font-black tracking-tight">
          {heading}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">{intro}</p>
      </section>
      <div className="container-page pb-16 md:pb-24">
        <PortfolioListing result={result} />
      </div>
      <div className="border-t border-line">
        <Cta />
      </div>
    </>
  );
}
