import type { Metadata } from "next";
import { PillarSection } from "@/components/services/pillar-section";
import { Cta } from "@/components/shared/cta";
import { block } from "@/lib/content/block";
import { visiblePillars } from "@/lib/content/services";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteName } from "@/lib/site";

// Title is the heading plus the site name (Phase 4 spec, D3; kept by Phase 14 spec, D1).
export async function generateMetadata(): Promise<Metadata> {
  const [heading, description] = await Promise.all([
    block("services.index.heading"),
    block("services.meta.description"),
  ]);
  return pageMetadata({ title: `${heading} | ${siteName}`, description, path: "/services" });
}

// Built only from visiblePillars(), so config changes reach the page with no code change
// (roadmap Phase 4 "Done when").
export default async function ServicesIndex() {
  const [groups, heading, intro] = await Promise.all([
    visiblePillars(),
    block("services.index.heading"),
    block("services.index.intro"),
  ]);
  return (
    <>
      <section className="container-page py-16 md:py-24">
        <h1 className="max-w-4xl font-display text-display-1 font-black tracking-tight">
          {heading}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">{intro}</p>
      </section>
      {groups.map((group) => (
        <PillarSection key={group.pillar.id} group={group} />
      ))}
      <div className="border-t border-line">
        <Cta />
      </div>
    </>
  );
}
