import type { Metadata } from "next";
import { Cta } from "@/components/shared/cta";
import { JsonLd } from "@/components/shared/json-ld";
import { FeaturedWork } from "@/components/home/featured-work";
import { Hero } from "@/components/home/hero";
import { PillarCards } from "@/components/home/pillar-cards";
import { ProcessStrip } from "@/components/home/process-strip";
import { block } from "@/lib/content/block";
import { visiblePillars } from "@/lib/content/services";
import { businessJsonLdInput } from "@/lib/seo/business";
import { organizationJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteName } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const description = await block("home.meta.description");
  return pageMetadata({ title: siteName, description, path: "/" });
}

// Section order follows the roadmap (Phase 3 spec, Scope 4).
export default async function Home() {
  const groups = await visiblePillars();
  return (
    <>
      {/* The site-wide Organization lives on the homepage (Phase 14 spec, D6). */}
      <JsonLd data={organizationJsonLd(businessJsonLdInput())} />
      <Hero />
      <PillarCards groups={groups} />
      <FeaturedWork />
      <ProcessStrip groups={groups} />
      <Cta />
    </>
  );
}
