import type { Metadata } from "next";
import { Suspense } from "react";
import { PortfolioListing } from "@/components/portfolio/portfolio-grid";
import { PortfolioSkeleton } from "@/components/portfolio/portfolio-skeleton";
import { Cta } from "@/components/shared/cta";
import { block } from "@/lib/content/block";
import { parseFilter } from "@/lib/portfolio/filters";
import { getPublishedPortfolio } from "@/lib/portfolio/read";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteName } from "@/lib/site";

// Metadata does not read searchParams, so it stays static for every filter (Phase 11 spec, D2).
// No canonical, so filtered views stay indexable (Architectural rules 2; Phase 14 spec, D2).
export async function generateMetadata(): Promise<Metadata> {
  const description = await block("portfolio.meta.description");
  return pageMetadata({
    title: `Portfolio | ${siteName}`,
    description,
    path: "/portfolio",
    canonical: false,
  });
}

// The heading, intro and CTA are the static shell. The listing reads ?category= inside
// <Suspense>, so it renders per request from the one cached read (Phase 11 spec, D2; Phase 10
// spec, D2, D3). An unreachable database gives the unavailable state, not a failed render.
export default async function PortfolioPage({ searchParams }: PageProps<"/portfolio">) {
  const [heading, intro] = await Promise.all([
    block("portfolio.heading"),
    block("portfolio.intro"),
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
        <Suspense fallback={<PortfolioSkeleton filterBar />}>
          <PortfolioResults searchParams={searchParams} />
        </Suspense>
      </div>
      <div className="border-t border-line">
        <Cta />
      </div>
    </>
  );
}

async function PortfolioResults({ searchParams }: Pick<PageProps<"/portfolio">, "searchParams">) {
  const [{ category }, result] = await Promise.all([searchParams, getPublishedPortfolio()]);
  return <PortfolioListing result={result} filter={parseFilter(category)} />;
}
