import type { Metadata } from "next";
import { Cta } from "@/components/home/cta";
import { FeaturedWork } from "@/components/home/featured-work";
import { Hero } from "@/components/home/hero";
import { PillarCards } from "@/components/home/pillar-cards";
import { ProcessStrip } from "@/components/home/process-strip";
import { block } from "@/lib/content/block";
import { visiblePillars } from "@/lib/content/services";

export async function generateMetadata(): Promise<Metadata> {
  return { description: await block("home.meta.description") };
}

// Section order follows the roadmap (Phase 3 spec, Scope 4).
export default async function Home() {
  const groups = await visiblePillars();
  return (
    <>
      <Hero />
      <PillarCards groups={groups} />
      <FeaturedWork />
      <ProcessStrip groups={groups} />
      <Cta />
    </>
  );
}
